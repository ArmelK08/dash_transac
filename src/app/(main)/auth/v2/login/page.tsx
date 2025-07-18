import Link from "next/link";

import { Globe } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";

import { LoginForm } from "../../_components/login-form";
import { GoogleButton } from "../../_components/social-auth/google-button";

export default function LoginV2() {
  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-medium">Connectez vous à votre compte</h1>
          <p className="text-muted-foreground text-sm">Rentrez vos données de connexion.</p>
        </div>
        <div className="space-y-4">
          <LoginForm />
        </div>
      </div>

      <div className="absolute top-5 flex w-full justify-end px-10">
        <div className="text-muted-foreground text-sm">
          Vous n&apos;avez pas de compte ?{" "}
          <Link className="text-foreground" href="/register">
        Inscrivez-vous
          </Link>
        </div>
      </div>
    </>
  );
}
