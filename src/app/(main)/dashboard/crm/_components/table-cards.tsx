"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
            className={`h-3 rounded bg-gray-200 dark:bg-gray-700 ${
              i % 3 === 0 ? "w-1/2" : i % 3 === 1 ? "w-3/4" : "w-full"
            }`}
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

  const [status, setStatus] = useState("");
  const [type, setType] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const CACHE_KEY = `tablecards_cache_page_${page}_size_${pageSize}_status_${status}_type_${type}_search_${search}`;

  // Ref pour préchargement
  const prefetchingRef = useRef(false);
  const preloadedPages = useRef<Map<number, DataV2[]>>(new Map());

  // Fetch data depuis API ou cache localStorage, ou depuis préchargé en mémoire
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    // Si on a la page en mémoire préchargée, on l'utilise directement
    if (preloadedPages.current.has(page)) {
      setData(preloadedPages.current.get(page)!);
      setLoading(false);
      return;
    }

    // Sinon on tente le cache localStorage
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const json = JSON.parse(cached);
      setData(json.data);
      setTotal(json.total);
      setPageCount(json.pageCount);
      setLoading(false);
      return;
    }

    // Sinon on fetch depuis API
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (status) queryParams.append("status", status);
      if (type) queryParams.append("type", type);
      if (search) queryParams.append("search", search);

      const res = await fetch(`/api/data-v2?${queryParams.toString()}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();

      setData(json.data);
      setTotal(json.total);
      setPageCount(json.pageCount);

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

  // Préchargement progressif des pages suivantes en arrière-plan
  const preloadPages = () => {
    if (prefetchingRef.current) return;
    prefetchingRef.current = true;

    const loadPage = async (p: number) => {
      if (p > pageCount || preloadedPages.current.has(p)) {
        if (p > pageCount) prefetchingRef.current = false;
        return;
      }

      try {
        const queryParams = new URLSearchParams({
          page: p.toString(),
          pageSize: pageSize.toString(),
        });
        if (status) queryParams.append("status", status);
        if (type) queryParams.append("type", type);
        if (search) queryParams.append("search", search);

        const res = await fetch(`/api/data-v2?${queryParams.toString()}`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const json = await res.json();

        preloadedPages.current.set(p, json.data);

        if (p < pageCount) {
          setTimeout(() => loadPage(p + 1), 200); // délai entre pages
        } else {
          prefetchingRef.current = false;
        }
      } catch (err) {
        console.error(`Erreur préchargement page ${p}`, err);
        prefetchingRef.current = false;
      }
    };

    setTimeout(() => loadPage(page + 1), 2000); // commence après 2s, page courante prioritaire
  };

  // Effet de fetch data à chaque changement d’état
  useEffect(() => {
    fetchData();
  }, [page, pageSize, status, type, search]);

  // Effet debounce recherche
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Effet pour lancer préchargement quand la page courante est chargée
  useEffect(() => {
    if (!loading && pageCount > 0) {
      preloadPages();
    }
  }, [loading, page, pageCount, status, type, search]);

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
          <CardDescription>
            Veuillez patienter pendant que nous récupérons vos transactions.
          </CardDescription>
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

          {/* FILTRES */}
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
              placeholder="Rechercher par ID ou status"
              className="border rounded px-2 py-1"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <CardAction>
            <div className="flex items-center gap-2">
              <DataTableViewOptions table={table} />
              <Button variant="outline" size="sm" onClick={() => alert("Export désactivé")}>
                <Download /> Export
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
