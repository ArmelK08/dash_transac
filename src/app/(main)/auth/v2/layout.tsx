import { ReactNode } from "react";
import Image from "next/image";

import { Separator } from "@/components/ui/separator";
import { APP_CONFIG } from "@/config/app-config";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="bg-primary relative order-2 hidden h-full rounded-3xl lg:flex">
          <div className="text-primary-foreground absolute top-10 space-y-4 px-10 w-full text-center align-center">
            <Image
              src="/icon.png"
              alt="Logo"
              width={60}
              height={60}
              className="mx-auto rounded"
            />
            <p className="text-5xl font-medium">
              Suivez l’état de votre transaction en temps réel.
            </p>
          </div>
        </div>
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
