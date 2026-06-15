import mysql from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

// Singleton: reuse pool across hot-reloads in development
const pool: mysql.Pool = global._mysqlPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  global._mysqlPool = pool;
}

export default pool;
