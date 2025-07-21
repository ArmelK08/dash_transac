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
import { Skeleton } from "@/components/ui/skeleton";

type Stats = {
  totalSuccessful: number;
  totalFailed: number;
  moneyTransferAmount: number;
  mobileMoneyAmount: number;
};

const CACHE_KEY = "overviewStatsCache";
const CACHE_TTL_MS = 5 * 60 * 1000; // cache expire après 5 minutes

export function OverviewCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Lire cache localStorage
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { data: Stats; timestamp: number };
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          setStats(parsed.data);
          setLoading(false);
        }
      } catch {
        // si erreur JSON, on ignore et on continue
      }
    }

    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/overview-stats");
        if (!res.ok) {
          throw new Error(`Erreur API: ${res.statusText}`);
        }
        const data: Stats = await res.json();

        if (isMounted) {
          setStats(data);
          setLoading(false);

          // Stocker dans localStorage avec timestamp
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data, timestamp: Date.now() })
          );
        }
      } catch (err: any) {
        console.error(err);
        if (isMounted) {
          setError("Impossible de charger les statistiques.");
          setLoading(false);
        }
      }
    }

    fetchStats();
  }, []);

  if (loading && !stats) {
    // Affiche loader seulement si on n'a pas déjà de cache
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-24 mb-3" />
              <CardAction>
                <Skeleton className="h-6 w-20" />
              </CardAction>
            </CardHeader>
            <CardFooter>
              <Skeleton className="h-3 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 font-semibold">{error}</div>;
  }

  if (!stats) {
    return <div>Aucune donnée disponible.</div>;
  }

  const formatAmount = (amount: number) =>
    amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* ... le reste du JSX identique ... */}
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
      {/* ... autres cartes ... */}
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

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Montant moneyTransfer</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatAmount(stats.moneyTransferAmount)} Fcfa
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

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Montant mobileMoney</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatAmount(stats.mobileMoneyAmount)} Fcfa
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
