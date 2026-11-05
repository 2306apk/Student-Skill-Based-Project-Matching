import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

try {
  process.loadEnvFile?.();
} catch {}

async function runMigration() {
  console.log('--- Running Additive Migration for APP_USER ---');
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'student_skill_project_matching',
  });

  try {
    const migrationSqlPath = path.join(process.cwd(), 'migrations', '001_create_app_user.sql');
    const sql = fs.readFileSync(migrationSqlPath, 'utf8');

    await connection.query(sql);
    console.log('✅ Successfully created APP_USER table (additive migration complete).');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();

