"use client";

import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AccountSwitcher() {
  const [partnerCode, setPartnerCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me")
      .then((res) => {
        if (!res.ok) throw new Error("Non autorisé");
        return res.json();
      })
      .then((data) => {
        if (data.partnerCode) setPartnerCode(data.partnerCode);
      })
      .catch((err) => {
        console.error("Erreur récupération user", err);
        router.push("/auth/v2/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Déconnecté avec succès");
        router.push("/auth/v2/login");
      } else {
        toast.error("Échec de la déconnexion");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur réseau pendant la déconnexion");
    }
  };

  if (loading) {
    return (
      <Avatar className="size-9 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-9 rounded-lg cursor-pointer">
          <AvatarFallback className="rounded-lg">
            {getInitials(partnerCode ?? "Partenaire")}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="min-w-56 space-y-1 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuItem className="p-0">
          <div className="flex w-full items-center gap-2 px-1 py-1.5">
            <Avatar className="size-9 rounded-lg">
              <AvatarFallback className="rounded-lg">
                {getInitials(partnerCode ?? "Partenaire")}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {partnerCode ?? "Partenaire"}
              </span>
              <span className="truncate text-xs capitalize">Partenaire</span>
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleLogout}>
          <LogOut />
          <span className="ml-2">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
