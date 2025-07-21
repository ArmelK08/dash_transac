import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Non autorisé" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { partnerCode: string };

    res.status(200).json({ partnerCode: decoded.partnerCode });
  } catch {
    res.status(401).json({ message: "Token invalide" });
  }
}
