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

export function TableCards() {
  const [data, setData] = useState<DataV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(0);


const handleNextPage = () => {
    setPage((prev) => Math.min(prev + 1, pageCount));
    
  };
  const handlePreviousPage = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
  };  

  const paginationProps ={
    page,
    pageSize,
    pageCount,
    handleNextPage,
    handlePreviousPage,
    handlePageSizeChange,
    setPage
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const res = await fetch(`/api/data-v2?page=${page}&pageSize=${pageSize}`);
      const json = await res.json();

      console.log("✅ Fetched data:", json);

      setData(json.data);
      setTotal(json.total);
      setLoading(false);
      setPageCount(json.pageCount);
    }

    fetchData();
  }, [page, pageSize]);

  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);

  console.log("✅ total:", total);
  console.log("✅ pageSize:", pageSize);
  console.log("✅ totalPages:", totalPages);

  const table = useDataTableInstance({
    data,
    columns: recentLeadsColumns,
    getRowId: (row) => row.id.toString(),
    defaultPageSize: pageSize,
    
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
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Suivez et gérez vos transactions et leur statut.</CardDescription>
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
          <DataTablePagination table={table} {...paginationProps} />
        </CardContent>
      </Card>
    </div>
  );
}
