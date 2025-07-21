"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
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
import { DatePickerWithInput } from "@/components/ui/DatePickerWithInput";
import type { CellContext } from "@tanstack/react-table";
import { recentLeadsColumns } from "./columns.crm";
import { DataV2 } from "./crm.config";

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {recentLeadsColumns.map((col, i) => (
        <td key={i} className="py-2 px-3">
          <div
            className={`h-3 rounded bg-gray-200 dark:bg-gray-700 ${
              i % 3 === 0 ? "w-1/2" : i % 3 === 1 ? "w-3/4" : "w-full"
            }`}
          />
        </td>
      ))}
    </tr>
  );
}

// Ici on accepte aussi null et undefined, et on renvoie "" si date invalide
function formatDate(date?: string | Date | null) {
  if (!date) return "";
  try {
    return format(new Date(date), "dd/MM/yyyy HH:mm:ss");
  } catch {
    return date.toString();
  }
}

export function TableCards() {
  const [data, setData] = useState<DataV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportDone, setExportDone] = useState(false);

  const getCacheKey = () =>
    `transactions_${page}_${pageSize}_${status}_${type}_${search}_${selectedDate?.toISOString()}`;

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (status) queryParams.append("status", status);
      if (type) queryParams.append("type", type);
      if (search) queryParams.append("search", search);
      if (selectedDate) queryParams.append("date", selectedDate.toISOString());

      const res = await fetch(`/api/data-v2?${queryParams.toString()}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();

      setData(json.data);
      setTotal(json.total);
      setPageCount(json.pageCount);
    } catch (e: any) {
      setError(e.message || "Erreur lors du chargement des données");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setExportProgress(0);

      const params = new URLSearchParams({
        export: "true",
        status,
        type,
        search,
      });
      if (selectedDate) params.append("date", selectedDate.toISOString());

      const res = await fetch(`/api/data-v2?${params.toString()}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);

      const blob = await res.blob();
      downloadBlob(blob);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Erreur pendant l’export.");
    } finally {
      setExporting(false);
    }
  };

  function downloadBlob(blob: Blob) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions_export.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, status, type, search, selectedDate]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const filteredData = useMemo(() => {
    const lower = searchInput.toLowerCase().trim();
    if (!lower) return data;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(lower);

    if (isObjectId) {
      const exact = data.find((item) => item.id.toString() === lower);
      return exact ? [exact] : [];
    } else {
      return data.filter((item) =>
        item.id.toString().toLowerCase().includes(lower)
      );
    }
  }, [data, searchInput]);

  const paginationProps = {
    page,
    pageSize,
    pageCount,
    handleNextPage: () => setPage((prev) => Math.min(prev + 1, pageCount)),
    handlePreviousPage: () => setPage((prev) => Math.max(prev - 1, 1)),
    handlePageSizeChange: (size: number) => setPageSize(size),
    setPage,
  };

  const table = useDataTableInstance({
    data: filteredData,
    columns: recentLeadsColumns.map((col) =>
      col.id === "date"
        ? {
            ...col,
            cell: ({ row }: CellContext<DataV2, unknown>) =>
              row.original.date ? formatDate(row.original.date) : "",
          }
        : col
    ),
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

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs">
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            Suivez et gérez vos transactions et leur statut.
          </CardDescription>

          <div className="flex flex-wrap gap-2 mb-4">
            <select
              className="border rounded px-2 py-1"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              <option value="">Tous les status</option>
              <option value="Successful">Successful</option>
              <option value="Failed">Failed</option>
              <option value="Pending">Pending</option>
            </select>

            <select
              className="border rounded px-2 py-1"
              value={type}
              onChange={(e) => {
                setPage(1);
                setType(e.target.value);
              }}
            >
              <option value="">Tous les types</option>
              <option value="moneyTransfer">Money Transfer</option>
              <option value="mobileMoney">Mobile Money</option>
            </select>
  <input
              type="text"
              placeholder="Rechercher par ID"
              className="border rounded px-2 py-1"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <DatePickerWithInput
              date={selectedDate}
              setDate={(date) => {
                setPage(1);
                setSelectedDate(date ?? undefined);
              }}
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(undefined)}
                className="ml-2 text-sm text-red-500 underline"
              >
                Réinitialiser
              </button>
            )}
          </div>

          <CardAction>
            <div className="flex items-center gap-2">
              <DataTableViewOptions table={table} />
              <Button
                variant="outline"
                size="sm"
                disabled={exporting}
                onClick={handleExport}
              >
                {!exporting ? (
                  <>
                    <Download className="inline mr-1" /> Export
                  </>
                ) : (
                  <>Export en cours... {exportProgress}%</>
                )}
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
