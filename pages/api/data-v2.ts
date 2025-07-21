import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { MongoClient } from "mongodb";
import { parse } from "json2csv";

const uri = process.env.MONGOTRANSAC_URI!;
if (!uri) throw new Error("MONGOTRANSAC_URI is not defined");

let client: MongoClient | null = null;

async function getMongoClient() {
  if (client) return client;
  client = new MongoClient(uri);
  await client.connect();
  return client;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Non autorisé" });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const partnerCode = decoded.partnerCode;
    if (!partnerCode) return res.status(401).json({ error: "partnerCode manquant" });

    // Pagination
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 100, 1000);
    const skip = (page - 1) * pageSize;

    // Filtres
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "";
    const type = (req.query.type as string) || "";
    const sortBy = (req.query.sortBy as string) || "date";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : null;
    const exportCsv = req.query.export === "true";

    const allowedSortFields = ["_id", "date", "amount", "status", "type", "feeAmount"];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "date";

    const mongoClient = await getMongoClient();
    const db = mongoClient.db("transaction_db");
    const collection = db.collection("payment_transactions");

    const query: any = { partnerCode };

    // if (search) {
    //   query.$or = [
    //     { _id: { $regex: search, $options: "i" } },
    //     { type: { $regex: search, $options: "i" } },
    //     { status: { $regex: search, $options: "i" } },
    //   ];
    // }

    const { ObjectId } = require("mongodb");

if (search) {
  const isObjectId = ObjectId.isValid(search);
  if (isObjectId) {
    query._id = new ObjectId(search);
  } else {
    query.$or = [
      { type: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
    ];
  }
}

    if (status) query.status = { $regex: `^${status}$`, $options: "i" };
    if (type) query.type = { $regex: `^${type}$`, $options: "i" };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    if (!exportCsv) {
      const total = await collection.countDocuments(query);

      const rows = await collection
        .find(query)
        .sort({ [safeSortBy]: sortOrder })
        .skip(skip)
        .limit(pageSize)
        .project({
          _id: 1,
          date: 1,
          amount: 1,
          status: 1,
          type: 1,
          feeAmount: 1,
        })
        .toArray();

      const data = rows.map((r) => ({
        id: r._id,
        date: r.date,
        amount: r.amount,
        status: r.status,
        type: r.type,
        feeAmount: r.feeAmount,
      }));

      return res.status(200).json({
        data,
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      });
    } else {
      // Export CSV (toutes données filtrées, sans pagination)
      const rows = await collection
        .find(query)
        .sort({ [safeSortBy]: sortOrder })
        .project({
          _id: 1,
          date: 1,
          amount: 1,
          status: 1,
          type: 1,
          feeAmount: 1,
        })
        .toArray();

      const dataToExport = rows.map((r) => ({
        id: r._id,
        date: r.date.toISOString(),
        amount: r.amount,
        status: r.status,
        type: r.type,
        feeAmount: r.feeAmount,
      }));

      const fields = ["id", "date", "amount", "status", "type", "feeAmount"];

      const csv = parse(dataToExport, { fields });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=transactions_export.csv`);
      return res.status(200).send(csv);
    }
  } catch (err) {
    console.error("🔥 Erreur API /api/data-v2:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
};
