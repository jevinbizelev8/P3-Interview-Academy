#!/usr/bin/env node

/**
 * P³ Interview Academy - Database Verification Script
 * Tests database connectivity and schema initialization
 */

import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../shared/schema.js';

// Configure Neon for Node.js environment
const neonConfig = { webSocketConstructor: ws };

console.log('==========================================');
console.log('P³ Interview Academy - Database Verification');
console.log('==========================================');
console.log('');

/**
 * Test basic database connectivity
 */
async function testDatabaseConnection() {
    console.log('1. TESTING DATABASE CONNECTION');
    console.log('===============================');

    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable not set');
        return false;
    }

    console.log('✓ DATABASE_URL is configured');

    try {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const db = drizzle({ client: pool, schema });

        // Test basic query
        const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
        const { current_time, pg_version } = result.rows[0];

        console.log(`✓ Database connected successfully`);
        console.log(`  Time: ${current_time}`);
        console.log(`  PostgreSQL: ${pg_version.split(' ')[0]} ${pg_version.split(' ')[1]}`);

        await pool.end();
        return true;

    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error(`   ${error.message}`);

        if (error.message.includes('authentication failed')) {
            console.error('   → Check database credentials in DATABASE_URL');
        } else if (error.message.includes('does not exist')) {
            console.error('   → Check database name in DATABASE_URL');
        } else if (error.message.includes('timeout')) {
            console.error('   → Check database host accessibility and firewall settings');
        }

        return false;
    }
}

/**
 * Test session table creation and access
 */
async function testSessionTable() {
    console.log('');
    console.log('2. TESTING SESSION TABLE');
    console.log('=========================');

    try {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });

        // Check if sessions table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'sessions'
            ) as exists
        `);

        const sessionTableExists = tableCheck.rows[0].exists;

        if (sessionTableExists) {
            console.log('✓ Sessions table exists');

            // Check table structure
            const structure = await pool.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'sessions'
                ORDER BY ordinal_position
            `);

            console.log('  Table structure:');
            structure.rows.forEach(row => {
                console.log(`    - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
            });

            // Test session operations (create/read/delete)
            const testSid = `test-session-${Date.now()}`;
            const testData = { userId: 'test', timestamp: new Date().toISOString() };

            // Insert test session
            await pool.query(
                'INSERT INTO sessions (sid, sess, expire) VALUES ($1, $2, $3)',
                [testSid, JSON.stringify(testData), new Date(Date.now() + 3600000)] // 1 hour from now
            );

            // Read test session
            const readResult = await pool.query('SELECT sess FROM sessions WHERE sid = $1', [testSid]);
            if (readResult.rows.length > 0) {
                console.log('✓ Session read/write operations working');
            }

            // Clean up test session
            await pool.query('DELETE FROM sessions WHERE sid = $1', [testSid]);
            console.log('✓ Session cleanup successful');

        } else {
            console.log('⚠️ Sessions table does not exist yet');
            console.log('   This is normal for first deployment - it will be auto-created');

            // Try to create the table manually to test permissions
            await pool.query(`
                CREATE TABLE IF NOT EXISTS sessions (
                    sid character varying NOT NULL PRIMARY KEY,
                    sess json NOT NULL,
                    expire timestamp(6) without time zone NOT NULL
                )
            `);

            console.log('✓ Sessions table created successfully');
        }

        await pool.end();
        return true;

    } catch (error) {
        console.error('❌ Session table test failed:');
        console.error(`   ${error.message}`);

        if (error.message.includes('permission denied')) {
            console.error('   → Database user lacks table creation permissions');
        }

        return false;
    }
}

/**
 * Test main application schema
 */
async function testApplicationSchema() {
    console.log('');
    console.log('3. TESTING APPLICATION SCHEMA');
    console.log('==============================');

    try {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });

        // Check for key application tables
        const tables = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('users', 'interview_sessions', 'interview_messages', 'preparation_sessions')
            ORDER BY table_name
        `);

        const existingTables = tables.rows.map(row => row.table_name);

        console.log('Application tables status:');
        const expectedTables = ['users', 'interview_sessions', 'interview_messages', 'preparation_sessions'];

        expectedTables.forEach(tableName => {
            if (existingTables.includes(tableName)) {
                console.log(`  ✓ ${tableName} - exists`);
            } else {
                console.log(`  ⚠️ ${tableName} - missing (will be created by Drizzle migrations)`);
            }
        });

        if (existingTables.length > 0) {
            console.log('✓ Some application tables exist');
        } else {
            console.log('⚠️ No application tables found - run database migrations');
            console.log('   → Run: npm run db:push');
        }

        await pool.end();
        return true;

    } catch (error) {
        console.error('❌ Application schema test failed:');
        console.error(`   ${error.message}`);
        return false;
    }
}

/**
 * Test connection pool performance
 */
async function testConnectionPerformance() {
    console.log('');
    console.log('4. TESTING CONNECTION PERFORMANCE');
    console.log('==================================');

    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 5  // Small pool for testing
        });

        console.log('Testing connection pool performance...');

        const start = Date.now();

        // Perform multiple concurrent queries
        const queries = Array.from({ length: 5 }, (_, i) =>
            pool.query('SELECT $1 as query_id, NOW() as timestamp', [i])
        );

        const results = await Promise.all(queries);
        const duration = Date.now() - start;

        console.log(`✓ 5 concurrent queries completed in ${duration}ms`);

        if (duration < 1000) {
            console.log('✓ Connection performance: Excellent');
        } else if (duration < 3000) {
            console.log('✓ Connection performance: Good');
        } else {
            console.log('⚠️ Connection performance: Slow - check network/database performance');
        }

        await pool.end();
        return true;

    } catch (error) {
        console.error('❌ Connection performance test failed:');
        console.error(`   ${error.message}`);
        return false;
    }
}

/**
 * Generate database report
 */
async function generateDatabaseReport() {
    console.log('');
    console.log('5. DATABASE CONFIGURATION REPORT');
    console.log('=================================');

    try {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });

        // Get database configuration
        const config = await pool.query(`
            SELECT
                setting as max_connections,
                (SELECT setting FROM pg_settings WHERE name = 'shared_buffers') as shared_buffers,
                (SELECT setting FROM pg_settings WHERE name = 'effective_cache_size') as effective_cache_size,
                (SELECT setting FROM pg_settings WHERE name = 'timezone') as timezone
            FROM pg_settings WHERE name = 'max_connections'
        `);

        const dbConfig = config.rows[0];
        console.log('Database configuration:');
        console.log(`  Max connections: ${dbConfig.max_connections}`);
        console.log(`  Shared buffers: ${dbConfig.shared_buffers}`);
        console.log(`  Effective cache size: ${dbConfig.effective_cache_size}`);
        console.log(`  Timezone: ${dbConfig.timezone}`);

        // Get current connections
        const connections = await pool.query(`
            SELECT COUNT(*) as active_connections
            FROM pg_stat_activity
            WHERE state = 'active'
        `);

        console.log(`  Active connections: ${connections.rows[0].active_connections}`);

        await pool.end();

    } catch (error) {
        console.log('⚠️ Could not retrieve database configuration details');
    }
}

/**
 * Main verification function
 */
async function main() {
    console.log('Starting database verification...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('');

    let allPassed = true;

    // Run all tests
    allPassed &= await testDatabaseConnection();
    allPassed &= await testSessionTable();
    allPassed &= await testApplicationSchema();
    allPassed &= await testConnectionPerformance();

    await generateDatabaseReport();

    console.log('');
    console.log('==========================================');

    if (allPassed) {
        console.log('✅ ALL DATABASE TESTS PASSED');
        console.log('Database is ready for production deployment!');
    } else {
        console.log('❌ SOME DATABASE TESTS FAILED');
        console.log('Fix the issues above before deploying.');
        process.exit(1);
    }

    console.log('==========================================');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the verification
main().catch(error => {
    console.error('❌ Verification script failed:', error.message);
    process.exit(1);
});