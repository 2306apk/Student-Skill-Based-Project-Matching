import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

try {
  process.loadEnvFile?.();
} catch {}

async function seedUsers() {
  console.log('--- Seeding Authentication Users with Hashed Credentials ---');
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'student_skill_project_matching',
  });

  try {
    const adminHash = await bcrypt.hash('Admin@123', 10);
    const studentHash = await bcrypt.hash('Student@123', 10);

    const users = [
      {
        email: 'admin@college.edu',
        password_hash: adminHash,
        role: 'ADMIN',
        student_id: null,
      },
      {
        email: 'rahul@gmail.com',
        password_hash: studentHash,
        role: 'STUDENT',
        student_id: 101,
      },
      {
        email: 'ananya@gmail.com',
        password_hash: studentHash,
        role: 'STUDENT',
        student_id: 102,
      },
      {
        email: 'vikram@gmail.com',
        password_hash: studentHash,
        role: 'STUDENT',
        student_id: 103,
      },
      {
        email: 'sneha@gmail.com',
        password_hash: studentHash,
        role: 'STUDENT',
        student_id: 104,
      },
      {
        email: 'arjun@gmail.com',
        password_hash: studentHash,
        role: 'STUDENT',
        student_id: 105,
      },
    ];

    for (const u of users) {
      await connection.query(
        `INSERT INTO APP_USER (email, password_hash, role, student_id)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           password_hash = VALUES(password_hash),
           role = VALUES(role),
           student_id = VALUES(student_id)`,
        [u.email, u.password_hash, u.role, u.student_id]
      );
    }

    console.log('✅ Demo accounts seeded successfully:');
    console.log('   Admin:   admin@college.edu / Admin@123');
    console.log('   Student: rahul@gmail.com   / Student@123 (Student ID: 101)');
    console.log('   Student: ananya@gmail.com  / Student@123 (Student ID: 102)');
    console.log('   Student: sneha@gmail.com   / Student@123 (Student ID: 104)');
  } catch (err: any) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedUsers();

