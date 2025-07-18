"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Stats = {
  totalSuccessful: number;
  totalFailed: number;
  moneyTransferAmount: number;
  mobileMoneyAmount: number;
};

export function OverviewCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const res = await fetch("/api/overview-stats");
      if (res.ok) {
        const data: Stats = await res.json();
        setStats(data);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading || !stats) {
    return <div>Chargement des statistiques…</div>;
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      
      {/* Carte 1 : Successful */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Transactions Successful</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalSuccessful}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp /> Réussies
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Nombre total de transactions réussies</div>
        </CardFooter>
      </Card>

      {/* Carte 2 : Failed */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Transactions Failed</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalFailed}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingDown /> Échouées
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Nombre total de transactions échouées</div>
        </CardFooter>
      </Card>

      {/* Carte 3 : Montant moneyTransfer */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Montant moneyTransfer</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.moneyTransferAmount.toFixed(2)} Fcfa
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp /> Réussies
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Total des montants moneyTransfer réussis</div>
        </CardFooter>
      </Card>

      {/* Carte 4 : Montant mobileMoney */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Montant mobileMoney</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.mobileMoneyAmount.toFixed(2)} Fcfa
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp /> Réussies
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Total des montants mobileMoney réussis</div>
        </CardFooter>
      </Card>
    </div>
  );
}
