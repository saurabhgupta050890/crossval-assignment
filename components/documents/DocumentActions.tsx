"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Send } from "lucide-react";
import { DocumentStatus } from "@prisma/client";
import { useState } from "react";
import { parseApiError } from "@/app/types";

type DocumentActionsProps = {
  documentId: string;
  status: DocumentStatus;
};

export function DocumentActions({ documentId, status }: DocumentActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const { message } = await parseApiError(
          res,
          "Failed to delete document",
        );
        throw new Error(message);
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFinalize = async () => {
    if (
      !confirm(
        "Are you sure you want to finalize this document? It cannot be edited afterwards.",
      )
    )
      return;

    setIsFinalizing(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFinal: true }),
      });

      if (!res.ok) {
        const { message } = await parseApiError(
          res,
          "Failed to finalize document",
        );
        throw new Error(message);
      }

      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-sm text-destructive mr-2">{error}</span>}

      {status === DocumentStatus.DRAFT && (
        <>
          <Button
            variant="outline"
            onClick={() => router.push(`/document/${documentId}/edit`)}
            disabled={isFinalizing || isDeleting}
          >
            <Pencil size={16} className="mr-2" />
            Edit
          </Button>
          <Button
            variant="secondary"
            onClick={handleFinalize}
            disabled={isFinalizing || isDeleting}
          >
            <Send size={16} className="mr-2" />
            {isFinalizing ? "Finalizing..." : "Finalize"}
          </Button>
        </>
      )}

      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={isFinalizing || isDeleting}
      >
        <Trash2 size={14} className="mr-2" />
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
