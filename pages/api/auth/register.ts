import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectToMongo } from "@/lib/mongodb";
import { User } from "../../../models/User";
import { getPartnerFromMySQL } from "@/lib/mysql";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const { partnerCode, password } = req.body;

  if (!partnerCode || !password) {
    return res.status(400).json({ message: "partnerCode et mot de passe requis" });
  }

  try {
    // Vérifier partnerCode dans MySQL
    const partner = await getPartnerFromMySQL(partnerCode);
    if (!partner) {
      return res.status(400).json({ message: "partnerCode invalide" });
    }

    await connectToMongo();

    // Vérifier s'il existe déjà
    const existingUser = await User.findOne({ partnerCode });
    if (existingUser) {
      return res.status(400).json({ message: "Ce partenaire est déjà inscrit" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ partnerCode, password: hashedPassword });
    await user.save();

    console.log(`✅ User registered: mot de passe= ${password}`);
    return res.status(201).json({ 
      message: "Inscription réussie",
      partnerCode,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
};