import type { NextApiRequest, NextApiResponse } from "next";
import { connectToMongo } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../../../models/User";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { partnerCode, password } = req.body;

  if (!partnerCode || !password) {
    return res.status(400).json({ message: "partnerCode et mot de passe requis" });
  }

  try {
    await connectToMongo();
    const user = await User.findOne({ partnerCode });
    if (!user) return res.status(401).json({ message: "Partenaire non trouvé" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Mot de passe invalide" });

    const token = jwt.sign(
      { id: user._id, partnerCode: user.partnerCode },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    // Set HttpOnly cookie
    res.setHeader("Set-Cookie", `token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax;`);

    res.status(200).json({ 
      message: "Connexion réussie",
      partnerCode: user.partnerCode,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
};