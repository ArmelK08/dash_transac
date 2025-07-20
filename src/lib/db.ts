import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: '92.222.217.60',
  user: 'userpix',
  password: 'pixpay2024@stlog',
  database: 'reporting_v2',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
