"use client";

import { useEffect, useState, useMemo } from "react";
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

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {recentLeadsColumns.map((col, i) => (
        <td key={i} className="py-2 px-3">
          <div
            className={`
              h-3
              rounded
              bg-gray-200
              dark:bg-gray-700
              ${i % 3 === 0 ? "w-1/2" : i % 3 === 1 ? "w-3/4" : "w-full"}
            `}
          />
        </td>
      ))}
    </tr>
  );
}

export function TableCards() {
  const [data, setData] = useState<DataV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  const CACHE_KEY = `tablecards_cache_page_${page}_size_${pageSize}`;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/data-v2?page=${page}&pageSize=${pageSize}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();

      setData(json.data);
      setTotal(json.total);
      setPageCount(json.pageCount);

      // 📝 on stocke dans localStorage
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: json.data,
          total: json.total,
          pageCount: json.pageCount,
        })
      );
    } catch (e: any) {
      setError(e.message || "Erreur lors du chargement des données");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached) {
      console.log("✅ Données chargées depuis localStorage");
      const json = JSON.parse(cached);
      setData(json.data);
      setTotal(json.total);
      setPageCount(json.pageCount);
      setLoading(false);
    } else {
      fetchData();
    }
  }, [page, pageSize]);

  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);

  const handleNextPage = () => setPage((prev) => Math.min(prev + 1, pageCount));
  const handlePreviousPage = () => setPage((prev) => Math.max(prev - 1, 1));
  const handlePageSizeChange = (size: number) => setPageSize(size);

  const paginationProps = {
    page,
    pageSize,
    pageCount,
    handleNextPage,
    handlePreviousPage,
    handlePageSizeChange,
    setPage,
  };

  const table = useDataTableInstance({
    data,
    columns: recentLeadsColumns,
    getRowId: (row) => row.id.toString(),
    defaultPageSize: pageSize,
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erreur</CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
          <CardAction>
            <Button onClick={fetchData}>Réessayer</Button>
          </CardAction>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement des données…</CardTitle>
          <CardDescription>Veuillez patienter pendant que nous récupérons vos transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full table-fixed border-collapse border border-gray-200">
              <thead className="bg-muted">
                <tr>
                  {recentLeadsColumns.map((col) => {
                    const headerContent =
                      typeof col.header === "function" ? col.id : col.header;

                    return (
                      <th
                        key={col.id}
                        className="border-b p-2 text-left text-sm font-medium text-muted-foreground"
                      >
                        {headerContent}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs">
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Suivez et gérez vos transactions et leur statut.</CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <DataTableViewOptions table={table} />
              <Button variant="outline" size="sm" onClick={() => alert("Export désactivé")}>
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
          <DataTablePagination table={table} {...paginationProps} />
        </CardContent>
      </Card>
    </div>
  );
}
