import mysql from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'student_skill_project_matching',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    dateStrings: true,
    multipleStatements: true,
  });
}

export const pool = globalThis.__mysqlPool ?? createPool();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__mysqlPool = pool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

export async function execute<T = any>(sql: string, params: any[] = []): Promise<T> {
  const [result] = await pool.execute(sql, params);
  return result as T;
}

export async function withTransaction<T>(
  callback: (conn: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Humanize MySQL error messages for client feedback.
 * Formats trigger signals (SQLSTATE 45000), foreign key failures, and check constraints.
 */
export function formatDbError(err: any): string {
  if (!err) return 'An unexpected database error occurred.';
  if (err.sqlState === '45000' && err.message) {
    // Extract trigger message
    const msg = err.message.replace(/^ER_SIGNAL_EXCEPTION:\s*/, '');
    return msg;
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return 'A record with these details already exists.';
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return 'Cannot delete or update this record because it is referenced by other database records.';
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return 'Referenced record does not exist in the database.';
  }
  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    return 'The entered data violated a database integrity constraint.';
  }
  return err.message || 'Database operation failed.';
}

