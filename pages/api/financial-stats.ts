import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";

const partnerUri = process.env.MONGOTRANSAC_URI!;
const transactionUri = process.env.MONGOTRANSAC_URI!;

if (!partnerUri) throw new Error("MONGOTRANSAC_URI is not defined");

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

async function getMongoClient() {
  if (client) return client;
  if (!clientPromise) clientPromise = new MongoClient(partnerUri).connect();
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

    // 📂 partner_db
    const partnerDb = client.db("partner_db");
    const provisionColl = partnerDb.collection("account_provision");

    const provisionPipeline = [
      { $match: { partnerCode } },
      {
        $project: {
          amount: {
            $cond: [
              { $eq: [{ $type: "$amount" }, "string"] },
              { $toDouble: "$amount" },
              "$amount",
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalEncaissement: {
            $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] },
          },
          totalReversement: {
            $sum: { $cond: [{ $lt: ["$amount", 0] }, "$amount", 0] },
          },
        },
      },
    ];

    const provisionResult = await provisionColl.aggregate(provisionPipeline).toArray();

    const {
      totalEncaissement = 0,
      totalReversement = 0,
    } = provisionResult[0] || {};

    // 📂 transaction_db
    const transactionDb = client.db("transaction_db");
    const paymentColl = transactionDb.collection("payment_transactions");

    const transactionPipeline = [
      { $match: { partnerCode, status: "Successful" } },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          totalFee: { $sum: "$feeAmount" },
        },
      },
    ];

    const transactionResult = await paymentColl.aggregate(transactionPipeline).toArray();

    let totalMoneyTransfer = 0;
    let totalMobileMoney = 0;
    let totalFeeAmount = 0;

    for (const row of transactionResult) {
      const type = row._id;
      const amount = Number(row.totalAmount) || 0;
      const fee = Number(row.totalFee) || 0;

      if (type === "moneyTransfer") {
        totalMoneyTransfer += amount;
      }

      if (type === "mobileMoney") {
        totalMobileMoney += amount;
      }

      totalFeeAmount += fee;
    }

    // 🧾 solde
      const solde =totalMobileMoney-totalMoneyTransfer-totalFeeAmount+totalEncaissement+totalReversement;

    res.status(200).json({
      partnerCode,
      totalEncaissement,
      totalReversement,
      totalMoneyTransfer,
      totalMobileMoney,
      totalCommission: totalFeeAmount,
      solde,
    });
  } catch (err) {
    console.error("🔥 Erreur /api/financial-stats:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
};
