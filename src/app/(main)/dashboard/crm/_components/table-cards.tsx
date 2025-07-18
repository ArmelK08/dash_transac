"use client";

import { useEffect, useState } from "react";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { Download } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardAction,
} from "@/components/ui/card";

import { recentLeadsColumns } from "./columns.crm";
import { DataV2 } from "./crm.config";

export function TableCards() {
  const [data, setData] = useState<DataV2[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/data-v2");
      const json = await res.json();
      setData(json);
      setLoading(false);
    }

    fetchData();
  }, []);

  const table = useDataTableInstance({
    data,
    columns: recentLeadsColumns,
    getRowId: (row) => row.id.toString(),
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement des données…</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs">
      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
          <CardDescription>
            Track and manage your latest leads and their status.
          </CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <DataTableViewOptions table={table} />
              <Button variant="outline" size="sm">
                <Download />
                <span className="hidden lg:inline">Export</span>
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex size-full flex-col gap-4">
          <div className="overflow-hidden rounded-md border">
            <DataTable table={table} columns={recentLeadsColumns} />
          </div>
          <DataTablePagination table={table} />
        </CardContent>
      </Card>
    </div>
  );
}
