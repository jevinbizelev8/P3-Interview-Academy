/**
 * Script to check UUID columns in staging database
 * Checks p3_staging database specifically
 */

import pg from 'pg';

const { Pool } = pg;

// Staging database URL - p3_staging database
const stagingDbUrl = 'postgresql://app_user:ZgVs0A8jEJurQezzkp37txtJ@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/p3_staging';

const pool = new Pool({
  connectionString: stagingDbUrl,
  ssl: {
    rejectUnauthorized: false // Required for AWS RDS
  }
});

async function checkUuidColumns() {
  console.log('🔍 Checking UUID columns in staging database (p3_staging)...\n');

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Connected to staging database\n');

    // Check for columns that reference users.id or other UUID columns but are varchar
    const query = `
      SELECT
        c.table_name,
        c.column_name,
        c.data_type,
        c.udt_name,
        CASE
          WHEN fk.constraint_name IS NOT NULL THEN 'Has FK: ' || fk.foreign_table_name || '.' || fk.foreign_column_name
          ELSE 'No FK'
        END as foreign_key_info
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT
          tc.table_name,
          kcu.column_name,
          tc.constraint_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
      ) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
      WHERE c.table_schema = 'public'
        AND c.column_name IN ('user_id', 'created_by', 'session_id', 'scenario_id')
        AND c.data_type IN ('character varying', 'text')
      ORDER BY c.table_name, c.column_name;
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      console.log('✅ No varchar/text columns found that need UUID casting!');
      console.log('   All user_id, created_by, session_id, and scenario_id columns are already UUID.\n');
      await pool.end();
      return [];
    }

    console.log(`⚠️  Found ${result.rows.length} columns that need UUID casting:\n`);

    const migrations = [];

    for (const row of result.rows) {
      console.log(`📋 Table: ${row.table_name}`);
      console.log(`   Column: ${row.column_name}`);
      console.log(`   Type: ${row.data_type}`);
      console.log(`   ${row.foreign_key_info}`);

      // Check if column has data
      const dataCheck = await pool.query(
        `SELECT COUNT(*) as count FROM ${row.table_name} WHERE ${row.column_name} IS NOT NULL`
      );
      const rowCount = parseInt(dataCheck.rows[0].count);
      console.log(`   Rows with data: ${rowCount}`);

      if (rowCount > 0) {
        // Sample the data to see if it's valid UUIDs
        const sampleQuery = await pool.query(
          `SELECT ${row.column_name} FROM ${row.table_name} WHERE ${row.column_name} IS NOT NULL LIMIT 3`
        );
        console.log(`   Sample values:`, sampleQuery.rows.map(r => r[row.column_name]).join(', '));
      }

      migrations.push({
        table: row.table_name,
        column: row.column_name,
        hasForeignKey: row.foreign_key_info !== 'No FK',
        foreignKeyInfo: row.foreign_key_info,
        rowCount
      });

      console.log('');
    }

    // Generate migration SQL
    console.log('\n📝 Generated Migration SQL:\n');
    console.log('-- ============================================');
    console.log('-- UUID CAST MIGRATION FOR STAGING');
    console.log('-- Database: p3_staging');
    console.log(`-- Generated: ${new Date().toISOString()}`);
    console.log('-- ============================================\n');
    console.log('BEGIN;\n');

    for (const mig of migrations) {
      console.log(`-- ${mig.table}.${mig.column} (${mig.rowCount} rows)`);

      if (mig.hasForeignKey) {
        // Extract FK details
        const fkMatch = mig.foreignKeyInfo.match(/Has FK: (.+)\.(.+)/);
        if (fkMatch) {
          const [, fkTable, fkColumn] = fkMatch;
          // Get FK constraint name
          const fkNameQuery = await pool.query(`
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = $1
              AND constraint_type = 'FOREIGN KEY'
              AND constraint_name IN (
                SELECT constraint_name
                FROM information_schema.key_column_usage
                WHERE table_name = $1 AND column_name = $2
              )
            LIMIT 1
          `, [mig.table, mig.column]);

          const fkName = fkNameQuery.rows[0]?.constraint_name || `${mig.table}_${mig.column}_fkey`;

          console.log(`ALTER TABLE ${mig.table} DROP CONSTRAINT IF EXISTS ${fkName};`);
          console.log(`ALTER TABLE ${mig.table} ALTER COLUMN ${mig.column} TYPE uuid USING ${mig.column}::uuid;`);
          console.log(`ALTER TABLE ${mig.table} ADD CONSTRAINT ${fkName} FOREIGN KEY (${mig.column}) REFERENCES ${fkTable}(${fkColumn});`);
        }
      } else {
        console.log(`ALTER TABLE ${mig.table} ALTER COLUMN ${mig.column} TYPE uuid USING ${mig.column}::uuid;`);
      }
      console.log('');
    }

    console.log('COMMIT;\n');

    console.log('📊 Summary:');
    console.log(`   Total columns to migrate: ${migrations.length}`);
    console.log(`   With foreign keys: ${migrations.filter(m => m.hasForeignKey).length}`);
    console.log(`   Total rows affected: ${migrations.reduce((sum, m) => sum + m.rowCount, 0)}`);

    return migrations;

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
checkUuidColumns().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
