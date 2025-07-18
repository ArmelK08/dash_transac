// lib/mysql.ts
import mysql from "mysql2/promise";

// Création du pool de connexion
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Fonction pour vérifier si un partnerCode existe
export async function getPartnerFromMySQL(partnerCode: string) {
  const [rows] = await pool.execute(
    'SELECT partnercode FROM data_v2 WHERE partnercode = ? LIMIT 1',
    [partnerCode]
  );

  if (Array.isArray(rows) && rows.length > 0) {
    return rows[0];
  }

  return null;
}
