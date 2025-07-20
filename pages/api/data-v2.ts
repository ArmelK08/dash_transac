// pages/api/data-v2.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db"; // ton instance mysql2/promise
import jwt from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Non autorisé" });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const partnerCode = decoded.partnerCode;
    if (!partnerCode) return res.status(401).json({ error: "partnerCode manquant" });

    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 100, 1000);
    
    
    
    const offset = (page - 1) * pageSize;

    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "";
    const type = (req.query.type as string) || "";
    const sortBy = (req.query.sortBy as string) || "date";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? "ASC" : "DESC";

    const whereClauses = [`partnercode = ?`];
    const params: any[] = [partnerCode];

    if (search) {
      whereClauses.push(`(id LIKE ? OR type LIKE ? OR status LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClauses.push(`status = ?`);
      params.push(status);
    }

    if (type) {
      whereClauses.push(`type = ?`);
      params.push(type);
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // 🔷 Total count
    const [result]  = await db.query(
      `SELECT COUNT(*) as total FROM data_v2 ${where}`,
      params
    );
      const total = (result as any)?.[0].total;

    console.log("✅ total:", total);
    // 🔷 Data page
    const [rows] = await db.query(
      `
      SELECT
        _id AS id,
        date,
        amount,
        status,
        type,
        feeamount
      FROM data_v2
      ${where}
      ORDER BY ${db.escapeId(sortBy)} ${sortOrder}
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset]
    );

    res.status(200).json({
      data: rows,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error("🔥 Erreur API /api/data-v2:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// pour autoriser de grandes réponses JSON
export const config = {
  api: {
    responseLimit: false,
  },
};
