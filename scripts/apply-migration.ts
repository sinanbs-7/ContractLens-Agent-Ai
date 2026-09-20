import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Client } = pg;

async function runMigration() {
  console.log('====================================================');
  console.log(' CONTRACTLENS: SUPABASE POSTGRESQL MIGRATION RUNNER');
  console.log('====================================================\n');

  const migrationFilePath = path.join(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql');

  if (!fs.existsSync(migrationFilePath)) {
    console.error(`[ERROR] Migration file not found at: ${migrationFilePath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationFilePath, 'utf-8');
  console.log(`[INFO] Loaded migration script: ${path.basename(migrationFilePath)} (${(sqlContent.length / 1024).toFixed(2)} KB)`);

  // Detect database connection details
  const dbUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!dbUrl || dbUrl.includes('your-ref') || dbUrl === 'postgresql://postgres:postgres@localhost:5432/postgres') {
    console.warn('\n[WARNING] No active Supabase DATABASE_URL detected in .env.');
    console.log('To connect directly to Supabase Cloud PostgreSQL, specify DATABASE_URL in your .env:');
    console.log('Example: DATABASE_URL=postgresql://postgres.[REF]:[DB_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres\n');
    console.log('Alternatively, you can copy the SQL script from:');
    console.log(`-> ${migrationFilePath}`);
    console.log('and paste it directly into your Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/_/sql).\n');

    if (!dbUrl) {
      process.exit(1);
    }
  }

  console.log('[INFO] Connecting to PostgreSQL database...');
  const client = new Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('[SUCCESS] Connected to database.');

    console.log('[INFO] Executing migration transaction...');
    await client.query('BEGIN');
    await client.query(sqlContent);
    await client.query('COMMIT');

    console.log('[SUCCESS] All tables, indexes, functions, RLS policies, and seed data applied successfully!');
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\n[ERROR] Migration execution failed:');
    console.error(err.message || err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
    console.log('\n[INFO] Migration runner finished.');
  }
}

runMigration().catch((err) => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});
