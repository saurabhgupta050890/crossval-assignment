"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentStatus } from "@prisma/client";
import { StatusBadge } from "./StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Send,
} from "lucide-react";
import { formatDate, truncateId } from "@/lib/utils";
import Link from "next/link";

interface DocumentRow {
  id: string;
  customerName: string;
  issueDate: string;
  status: DocumentStatus;
  itemCount: number;
}

interface PageMeta {
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

interface DocumentsResponse {
  data: DocumentRow[];
  meta: PageMeta;
}

async function fetcher(url: string): Promise<DocumentsResponse> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load documents");
  return res.json();
}

const PAGE_SIZES = [5, 10, 20, 50];

function Pagination({
  meta,
  limit,
  onPageChange,
  onLimitChange,
}: {
  meta: PageMeta;
  limit: number;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
}) {
  const { page, pageCount, total } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="tracking-wide uppercase font-medium">Rows</span>
        <div className="flex items-center border border-border divide-x divide-border">
          {PAGE_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onLimitChange(size)}
              className={`px-2.5 py-1 transition-colors cursor-pointer font-semibold tracking-widest ${
                limit === size
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <span className="font-mono tracking-tight">
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>
        <span className="px-2 font-semibold tracking-widest">
          {page} / {pageCount || 1}
        </span>
        <Button
          variant="outline"
          size="icon"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

/** Stops the row-click navigation from firing when an action button is clicked */
function stopPropagation(e: React.MouseEvent) {
  e.stopPropagation();
}

function RowActions({ doc, apiKey }: { doc: DocumentRow; apiKey: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    stopPropagation(e);
    if (!confirm("Are you sure you want to delete this document?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        mutate(apiKey);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFinalize = async (e: React.MouseEvent) => {
    stopPropagation(e);
    if (
      !confirm(
        "Are you sure you want to finalize this document? It cannot be edited afterwards.",
      )
    )
      return;

    setIsFinalizing(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFinal: true }),
      });
      if (res.ok) {
        mutate(apiKey);
      }
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div
      className="flex items-center justify-end gap-1"
      onClick={stopPropagation}
    >
      {doc.status === DocumentStatus.DRAFT && (
        <>
          <Link href={`/document/${doc.id}/edit`} onClick={stopPropagation}>
            <Button
              variant="ghost"
              size="icon"
              disabled={isFinalizing || isDeleting}
              aria-label="Edit document"
              className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 cursor-pointer"
              title="Edit"
            >
              <Pencil />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleFinalize}
            disabled={isFinalizing || isDeleting}
            aria-label="Finalize document"
            className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
            title="Finalize"
          >
            {isFinalizing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Send className="" />
            )}
          </Button>
        </>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isFinalizing || isDeleting}
        aria-label="Delete document"
        className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
        title="Delete"
      >
        {isDeleting ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Trash2 className="" />
        )}
      </Button>
    </div>
  );
}

export function DocumentsTable() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const router = useRouter();

  const apiKey = `/api/documents?page=${page}&limit=${limit}`;

  const { data, error, isLoading } = useSWR<DocumentsResponse>(
    apiKey,
    fetcher,
    {
      keepPreviousData: true, // don't flash empty while changing pages
      revalidateOnFocus: false,
    },
  );

  function handleLimitChange(newLimit: number) {
    setLimit(newLimit);
    setPage(1); // reset to first page on size change
  }

  const documents = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="rounded-none border border-border overflow-hidden">
      {/* Header bar */}
      <div className="bg-muted/40 border-b border-border px-4 py-3 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
          Documents
        </p>
        {meta && (
          <span className="text-xs text-muted-foreground font-mono">
            {meta.total} {meta.total === 1 ? "record" : "records"}
          </span>
        )}
      </div>

      {/* Loading (initial load only) */}
      {isLoading && !data && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <p className="text-xs tracking-widest uppercase">Loading…</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
          <AlertCircle className="size-6" />
          <p className="text-xs tracking-widest uppercase">{error.message}</p>
        </div>
      )}

      {/* Table */}
      {!error && (data || isLoading) && (
        <>
          {/* Stale overlay while loading next page */}
          <div
            className={`relative transition-opacity ${isLoading ? "opacity-50" : "opacity-100"}`}
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead className="w-32">ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center w-20">Items</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {documents.length === 0 && !isLoading ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                        <FileText className="size-8 opacity-25" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">
                            No documents yet
                          </p>
                          <p className="text-xs mt-1 opacity-60">
                            Create your first document to get started.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow
                      key={doc.id}
                      onClick={() => router.push(`/document/${doc.id}`)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground tracking-wider">
                          {truncateId(doc.id)}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="font-medium text-foreground text-xs">
                          {doc.customerName}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(doc.issueDate)}
                        </span>
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={doc.status} />
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center size-6 bg-muted text-xs font-semibold text-muted-foreground">
                          {doc.itemCount}
                        </span>
                      </TableCell>

                      <TableCell>
                        <RowActions doc={doc} apiKey={apiKey} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {meta && meta.total > 0 && (
            <Pagination
              meta={meta}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={handleLimitChange}
            />
          )}
        </>
      )}
    </div>
  );
}
