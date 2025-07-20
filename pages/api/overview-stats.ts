import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";

const uri = process.env.MONGOTRANSAC_URI!;
if (!uri) throw new Error("MONGOTRANSAC_URI is not defined");

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

async function getMongoClient() {
  if (client) return client;
  if (!clientPromise) clientPromise = new MongoClient(uri).connect();
  client = await clientPromise;
  return client;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Non autorisé" });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const partnerCode = decoded.partnerCode;

    if (!partnerCode) {
      return res.status(400).json({ error: "partnerCode manquant dans le token" });
    }

    const client = await getMongoClient();
    const db = client.db("transaction_db");
    const collection = db.collection("payment_transactions");

    const pipeline = [
      {
        $match: {
          partnerCode,
          status: { $in: ["Successful", "Failed"] },
          type: { $in: ["moneyTransfer", "mobileMoney"] },
        },
      },
      {
        $group: {
          _id: { type: "$type", status: "$status" },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ];

    const aggResult = await collection.aggregate(pipeline).toArray();

    const stats = {
      partnerCode,
      totalSuccessful: 0,
      totalFailed: 0,
      moneyTransferAmount: 0,
      mobileMoneyAmount: 0,
    };

    for (const row of aggResult) {
      const { type, status } = row._id;

      if (status === "Successful") {
        stats.totalSuccessful += row.count;
        if (type === "moneyTransfer") {
          stats.moneyTransferAmount += row.totalAmount || 0;
        }
        if (type === "mobileMoney") {
          stats.mobileMoneyAmount += row.totalAmount || 0;
        }
      }

      if (status === "Failed") {
        stats.totalFailed += row.count;
      }
    }

    res.status(200).json(stats);
  } catch (err) {
    console.error("🔥 Erreur /api/stats:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
};
