import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";
import { Parser as JSON2CSVParser } from "json2csv";
import fs from "fs-extra";
import tmp from "tmp";
import archiver from "archiver";

const uri = process.env.MONGOTRANSAC_URI!;
if (!uri) throw new Error("MONGOTRANSAC_URI is not defined");

let client: MongoClient | null = null;

async function getMongoClient() {
  if (client) return client;
  client = new MongoClient(uri);
  await client.connect();
  return client;
}

function formatFrDate(dateStr: string) {
  const date = new Date(dateStr);
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
}

type CsvRow = {
  id: string;
  date: string;
  amount: number;
  status: string;
  type: string;
  feeAmount: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Non autorisé" });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const partnerCode = decoded.partnerCode;
    if (!partnerCode) return res.status(401).json({ error: "partnerCode manquant" });

    const exportCsv = req.query.export === "true";
    const mongoClient = await getMongoClient();
    const db = mongoClient.db("transaction_db");
    const collection = db.collection("payment_transactions");

    const query: any = { partnerCode };

    const search = (req.query.search as string) || "";
    const type = (req.query.type as string) || "";
    const sortBy = (req.query.sortBy as string) || "date";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;

    const allowedStatuses = ["Successful", "Pending", "Failed"];
    const status = ((req.query.status as string) || "");
    const statusForQuery = allowedStatuses.includes(status) ? status : "";

    const dateStr = (req.query.date as string) || "";
    console.log("📅 dateStr reçue:", dateStr);

    if (dateStr) {
      const selectedDate = new Date(dateStr);
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);

      query.date = {
        $gte: startOfMonth.toISOString(),
        $lte: endOfMonth.toISOString(),
      };
    }

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

    if (statusForQuery) query.status = statusForQuery;
    if (type) query.type = type;

    const sortField = ["_id", "date", "amount", "status", "type", "feeAmount"].includes(sortBy)
      ? sortBy
      : "date";

    if (!exportCsv) {
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 100, 1000);
      const skip = (page - 1) * pageSize;

      console.log("🔍 Requête Mongo avec filtre :", query);
      console.log(`📄 Pagination : page=${page} pageSize=${pageSize} skip=${skip}`);

      const total = await collection.countDocuments(query);
      const rows = await collection
        .find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(pageSize)
        .project({ _id: 1, date: 1, amount: 1, status: 1, type: 1, feeAmount: 1 })
        .toArray();

      return res.status(200).json({
        data: rows.map(r => ({
          id: r._id.toString(),
          date: r.date ? formatFrDate(r.date) : "",
          amount: r.amount,
          status: r.status,
          type: r.type,
          feeAmount: r.feeAmount,
        })),
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      });
    }

    // === EXPORT CSV ===
    const tmpDir = tmp.dirSync({ unsafeCleanup: true });
    const CHUNK_SIZE = 1_048_576;
    let count = 0;
    let fileIndex = 1;
    let writeStream = fs.createWriteStream(`${tmpDir.name}/part_${fileIndex}.csv`);

    const parserWithHeader = new JSON2CSVParser<CsvRow>({
      fields: ["id", "date", "amount", "status", "type", "feeAmount"],
    });
    const parserWithoutHeader = new JSON2CSVParser<CsvRow>({
      fields: ["id", "date", "amount", "status", "type", "feeAmount"],
      header: false,
    });

    const headerCsv = parserWithHeader.parse([]);
    writeStream.write(headerCsv + "\n");

    const cursor = collection
      .find(query)
      .sort({ [sortField]: sortOrder })
      .project({ _id: 1, date: 1, amount: 1, status: 1, type: 1, feeAmount: 1 })
      .stream();

    cursor.on("data", doc => {
      const row: CsvRow = {
        id: doc._id.toString(),
        date: doc.date ? formatFrDate(doc.date) : "",
        amount: doc.amount,
        status: doc.status,
        type: doc.type,
        feeAmount: doc.feeAmount,
      };

      if (count >= CHUNK_SIZE) {
        writeStream.end();
        fileIndex++;
        count = 0;
        writeStream = fs.createWriteStream(`${tmpDir.name}/part_${fileIndex}.csv`);
        writeStream.write(headerCsv + "\n");
      }

      const csvLine = parserWithoutHeader.parse(row) + "\n";
      writeStream.write(csvLine);
      count++;
    });

    cursor.on("end", () => {
      writeStream.end();

      const statusForFile = allowedStatuses.includes(status) ? status : "all";

      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=transactions_export_${statusForFile}_${Date.now()}.zip`
      );

      const archive = archiver("zip");
      archive.on("error", err => {
        console.error("Archiver error:", err);
        if (!res.headersSent) res.status(500).end();
      });
      archive.pipe(res);

      fs.readdirSync(tmpDir.name).forEach(file => {
        archive.file(`${tmpDir.name}/${file}`, { name: file });
      });

      archive.finalize().then(() => {
        tmpDir.removeCallback();
      });
    });

    cursor.on("error", err => {
      console.error("Mongo stream error:", err);
      if (!res.headersSent) res.status(500).end();
    });

  } catch (err) {
    console.error("🔥 Erreur API /api/data-v2:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
}

export const config = {
  api: { responseLimit: false },
};
