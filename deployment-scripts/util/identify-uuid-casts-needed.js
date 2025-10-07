/**
 * Script to identify which columns need to be cast from varchar to uuid
 * Run this against staging database first, then production
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Use staging database URL if provided, otherwise fall back to regular DATABASE_URL
const dbUrl = process.env.DATABASE_URL_STAGING || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ No database URL found. Set DATABASE_URL_STAGING or DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function identifyUuidCasts() {
  console.log('🔍 Identifying columns that need UUID casting...\n');

  try {
    // Check for columns that should be UUID but are varchar
    const query = `
      SELECT
        table_name,
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          column_name IN ('user_id', 'created_by', 'session_id', 'scenario_id', 'question_id')
          OR column_name LIKE '%_id'
        )
        AND data_type IN ('character varying', 'varchar', 'text')
      ORDER BY table_name, column_name;
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      console.log('✅ No varchar columns found that need UUID casting!');
      await pool.end();
      return;
    }

    console.log(`⚠️  Found ${result.rows.length} columns that may need UUID casting:\n`);

    const castStatements = [];

    for (const row of result.rows) {
      console.log(`  Table: ${row.table_name}`);
      console.log(`  Column: ${row.column_name}`);
      console.log(`  Current Type: ${row.data_type}`);

      // Check if the column has references to users or other UUID tables
      const referencesQuery = `
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = $1
          AND kcu.column_name = $2;
      `;

      const refResult = await pool.query(referencesQuery, [row.table_name, row.column_name]);

      if (refResult.rows.length > 0) {
        console.log(`  ⚠️  Has foreign key constraint: ${refResult.rows[0].constraint_name}`);
        console.log(`  References: ${refResult.rows[0].foreign_table_name}.${refResult.rows[0].foreign_column_name}`);

        // Drop FK, cast, recreate FK
        const fk = refResult.rows[0];
        castStatements.push({
          table: row.table_name,
          column: row.column_name,
          hasFk: true,
          fkName: fk.constraint_name,
          fkTargetTable: fk.foreign_table_name,
          fkTargetColumn: fk.foreign_column_name,
          sql: [
            `-- Drop foreign key constraint`,
            `ALTER TABLE ${row.table_name} DROP CONSTRAINT IF EXISTS ${fk.constraint_name};`,
            `-- Cast column to UUID`,
            `ALTER TABLE ${row.table_name} ALTER COLUMN ${row.column_name} TYPE uuid USING ${row.column_name}::uuid;`,
            `-- Recreate foreign key constraint`,
            `ALTER TABLE ${row.table_name} ADD CONSTRAINT ${fk.constraint_name} FOREIGN KEY (${row.column_name}) REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name});`
          ].join('\n')
        });
      } else {
        console.log(`  No foreign key constraint`);

        // Simple cast
        castStatements.push({
          table: row.table_name,
          column: row.column_name,
          hasFk: false,
          sql: `-- Cast column to UUID\nALTER TABLE ${row.table_name} ALTER COLUMN ${row.column_name} TYPE uuid USING ${row.column_name}::uuid;`
        });
      }

      console.log('');
    }

    console.log('\n📝 Generated SQL statements:\n');
    console.log('-- ============================================');
    console.log('-- UUID CAST MIGRATION');
    console.log('-- Run this in staging first, then production');
    console.log('-- ============================================\n');

    for (const stmt of castStatements) {
      console.log(stmt.sql);
      console.log('');
    }

    console.log('\n📋 Summary:');
    console.log(`  Total columns to cast: ${castStatements.length}`);
    console.log(`  Columns with FK constraints: ${castStatements.filter(s => s.hasFk).length}`);
    console.log(`  Simple casts: ${castStatements.filter(s => !s.hasFk).length}`);

    // Save to file
    const fs = await import('fs');
    const sqlContent = castStatements.map(s => s.sql).join('\n\n');
    const filename = 'uuid-cast-migration.sql';

    fs.writeFileSync(filename, `-- ============================================
-- UUID CAST MIGRATION
-- Generated: ${new Date().toISOString()}
-- Database: ${dbUrl.split('@')[1]?.split('/')[0] || 'unknown'}
-- Run this in staging first, then production
-- ============================================

BEGIN;

${sqlContent}

COMMIT;
`);

    console.log(`\n✅ SQL statements saved to: ${filename}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
identifyUuidCasts().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
