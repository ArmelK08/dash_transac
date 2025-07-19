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
      WHERE partnercode = ?
      `,
      [partnerCode]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}


export const config = {
  api: {
    responseLimit: false,
  },
};