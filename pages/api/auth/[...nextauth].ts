import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToMongo } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { User } from "../../../models/User";

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt' as const,
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        partnerCode: { label: "Partner Code", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.partnerCode || !credentials?.password) {
          throw new Error("partnerCode et mot de passe requis");
        }

        await connectToMongo();

        const user = await User.findOne({ partnerCode: credentials.partnerCode });
        if (!user) throw new Error("Utilisateur non trouvé");

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Mot de passe invalide");

        return {
          id: user._id.toString(),
          partnerCode: user.partnerCode,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login", // mets la page de login que tu souhaites
  },
};

export default NextAuth(authOptions);
