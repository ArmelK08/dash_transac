"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Wallet, Coins, Scale } from "lucide-react";

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

type FinancialStats = {
  totalEncaissement: number;
  totalReversement: number;
  solde: number;
  totalCommission?: number;
};

const CACHE_KEY = "overviewStatsCache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

export function OverviewCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [financialStats, setFinancialStats] = useState<FinancialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatAmount = (amount: number) =>
    amount.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  useEffect(() => {
    let isMounted = true;

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { data: Stats; timestamp: number };
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          setStats(parsed.data);
          setLoading(false);
        }
      } catch {}
    }

    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, financialRes] = await Promise.all([
          fetch("/api/overview-stats"),
          fetch("/api/financial-stats"),
        ]);

        if (!overviewRes.ok || !financialRes.ok) {
          throw new Error("Erreur API");
        }

        const overviewData: Stats = await overviewRes.json();
        const financialData: FinancialStats = await financialRes.json();

        if (isMounted) {
          setStats(overviewData);
          setFinancialStats(financialData);
          setLoading(false);

          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: overviewData, timestamp: Date.now() })
          );
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("Impossible de charger les statistiques.");
          setLoading(false);
        }
      }
    }

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
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

  if (!stats || !financialStats) {
    return <div>Aucune donnée disponible.</div>;
  }

  const cards = [
    {
      description: "Transactions Successful",
      value: stats.totalSuccessful,
      badge: "Réussies",
      icon: <TrendingUp />,
    },
    {
      description: "Transactions Failed",
      value: stats.totalFailed,
      badge: "Échouées",
      icon: <TrendingDown />,
    },
    {
      description: "Montant moneyTransfer",
      value: `${formatAmount(stats.moneyTransferAmount)} Fcfa`,
      badge: "Réussies",
      icon: <TrendingUp />,
    },
    {
      description: "Montant mobileMoney",
      value: `${formatAmount(stats.mobileMoneyAmount)} Fcfa`,
      badge: "Réussies",
      icon: <TrendingUp />,
    },
    {
      description: "Total Encaissement",
      value: `${formatAmount(financialStats.totalEncaissement)} Fcfa`,
      badge: "Encaissement",
      icon: <Wallet />,
    },
    {
      description: "Total Reversement",
      value: `${formatAmount(financialStats.totalReversement)} Fcfa`,
      badge: "Reversement",
      icon: <TrendingDown />,
    },
    {
      description: "Total Commission",
      value: `${formatAmount(financialStats.totalCommission ?? 0)} Fcfa`,
      badge: "Commission",
      icon: <Coins />,
    },
    {
      description: "Solde",
      value: `${formatAmount(financialStats.solde)} Fcfa`,
      badge: "Solde",
      icon: <Scale />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <Card key={idx} className="@container/card">
          <CardHeader className="flex flex-col gap-1">
            <div className="flex justify-between items-start w-full">
              <CardDescription>{card.description}</CardDescription>
              <CardAction>
                <Badge variant="outline">
                  {card.icon} {card.badge}
                </Badge>
              </CardAction>
            </div>
            <CardTitle className="text-xl font-semibold tabular-nums break-words @[250px]/card:text-3xl">
              {card.value}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm text-muted-foreground">
            {/* tu peux ajouter un sous-texte ici si besoin */}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
