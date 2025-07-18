import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Non autorisé" });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return res.status(401).json({ error: "Token invalide" });
    }

    const partnerCode = decoded.partnerCode;
    if (!partnerCode) {
      return res.status(401).json({ error: "partnerCode manquant dans le token" });
    }

    // On filtre les stats uniquement pour ce partnerCode
    const [rows] = await db.query(`
      SELECT
        type,
        status,
        COUNT(*) AS count,
        SUM(amount) AS totalAmount
      FROM data_v2
      WHERE status IN ('Successful', 'Failed')
        AND type IN ('moneyTransfer', 'mobileMoney')
        AND partnercode = ?
      GROUP BY type, status
    `, [partnerCode]);

    const stats = {
      totalSuccessful: 0,
      totalFailed: 0,
      moneyTransferAmount: 0,
      mobileMoneyAmount: 0,
    };

    for (const row of rows as any[]) {
      const t = row.type;
      const s = row.status.toLowerCase();

      if (s === "successful") {
        stats.totalSuccessful += row.count;

        if (t === "moneyTransfer") {
          stats.moneyTransferAmount += Number(row.totalAmount) || 0;
        }
        if (t === "mobileMoney") {
          stats.mobileMoneyAmount += Number(row.totalAmount) || 0;
        }

      } else if (s === "failed") {
        stats.totalFailed += row.count;
      }
    }

    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}
