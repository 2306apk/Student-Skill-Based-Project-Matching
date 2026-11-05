import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';

try {
  // Load local .env without printing any credentials
  process.loadEnvFile?.();
} catch {}

async function testConnections() {
  console.log('==================================================');
  console.log('STUDENT SKILL–PROJECT MATCHING SYSTEM: DB TEST');
  console.log('==================================================');

  // 1. MySQL Test
  console.log('\n[1/3] Testing MySQL Connection & Schema...');
  try {
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'student_skill_project_matching',
    });

    const [tables]: any = await conn.query('SHOW TABLES');
    console.log(`✅ MySQL Connected! Found ${tables.length} tables/views.`);

    // Check Views
    const [viewRows]: any = await conn.query('SELECT COUNT(*) as count FROM Student_Skill_Profile');
    console.log(`✅ View 'Student_Skill_Profile' functional: ${viewRows[0].count} rows.`);

    // Check Stored Procedure
    const [procRows]: any = await conn.query('CALL Get_Project_Matches(501)');
    console.log(`✅ Stored Procedure 'Get_Project_Matches(501)' returned ${procRows[0].length} matches.`);

    await conn.end();
  } catch (err: any) {
    console.error('❌ MySQL Test Error:', err.message);
  }

  // 2. MongoDB Test
  console.log('\n[2/3] Testing MongoDB Connection...');
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_skill_project_matching';
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
    await client.connect();
    const db = client.db();
    const ping = await db.command({ ping: 1 });
    console.log('✅ MongoDB Connected successfully!', ping);

    const count = await db.collection('activity_logs').countDocuments();
    console.log(`   activity_logs collection contains ${count} records.`);
    await client.close();
  } catch (err: any) {
    console.error('❌ MongoDB Test Error:', err.message);
  }

  console.log('\n==================================================');
}

testConnections();

