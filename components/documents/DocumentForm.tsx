"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ItemRow } from "./ItemRow";
import { CalendarIcon, Plus, Save, Send } from "lucide-react";
import { ItemInput, DocumentOutput } from "@/lib/validations";
import { parseApiError, ApiFieldErrors } from "@/app/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type DocumentFormProps = {
  initialData?: DocumentOutput;
  isEdit?: boolean;
};

export function DocumentForm({
  initialData,
  isEdit = false,
}: DocumentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({});

  const [title, setTitle] = useState(initialData?.title || "");
  const [customerName, setCustomerName] = useState(
    initialData?.customerName || "",
  );
  const [issueDate, setIssueDate] = useState<Date>(
    initialData?.issueDate
      ? new Date(initialData.issueDate)
      : new Date(),
  );

  const [items, setItems] = useState<ItemInput[]>(
    initialData?.items?.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discount: i.discount ?? undefined,
      tax: i.tax ?? undefined,
    })) || [
      { description: "", quantity: 1, unitPrice: 0, discount: undefined },
    ],
  );

  const handleItemChange = (
    index: number,
    field: keyof ItemInput,
    value: string | number | undefined,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { description: "", quantity: 1, unitPrice: 0, discount: undefined },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const submitDocument = async (isFinal: boolean) => {
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const payload = {
        title,
        customerName,
        issueDate: issueDate.toISOString(),
        isFinal,
        items,
      };

      const url =
        isEdit && initialData?.id
          ? `/api/documents/${initialData.id}`
          : "/api/documents";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const { message, issues } = await parseApiError(res, "Failed to save document");
        if (issues) setFieldErrors(issues);
        throw new Error(message);
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitDocument(false);
  };

  const handleFinalize = () => {
    void submitDocument(true);
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm space-y-1">
          <p className="font-medium">{error}</p>
          {/* Surface any item-level or non-field errors as a list */}
          {fieldErrors.items && (
            <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
              {fieldErrors.items.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2 col-span-1">
          <Label htmlFor="title">Document Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Invoice #1234"
            required
            aria-invalid={!!fieldErrors.title}
          />
          {fieldErrors.title?.map((msg, i) => (
            <p key={i} className="text-xs text-destructive mt-1">{msg}</p>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name</Label>
          <Input
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Acme Corp"
            required
            aria-invalid={!!fieldErrors.customerName}
          />
          {fieldErrors.customerName?.map((msg, i) => (
            <p key={i} className="text-xs text-destructive mt-1">{msg}</p>
          ))}
        </div>
        <div className="space-y-2">
          <Label>Issue Date</Label>
          <Popover>
            <PopoverTrigger
              id="issueDate"
              aria-invalid={!!fieldErrors.issueDate}
              className={cn(
                "inline-flex w-full items-center justify-start gap-2 whitespace-nowrap rounded-none border border-input bg-background px-3 py-2 text-sm font-normal shadow-xs transition-all hover:bg-accent hover:text-accent-foreground h-9",
                !issueDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon size={14} className="opacity-50" />
              {issueDate ? format(issueDate, "PPP") : "Pick a date"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={issueDate}
                onSelect={(d) => d && setIssueDate(d)}
                disabled={{ after: new Date() }}
                autoFocus
              />
            </PopoverContent>
          </Popover>
          {fieldErrors.issueDate?.map((msg, i) => (
            <p key={i} className="text-xs text-destructive mt-1">{msg}</p>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Items</h3>
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <div className="hidden md:grid grid-cols-12 gap-3 mb-4 pb-2 border-b border-border/50 text-sm font-medium text-muted-foreground">
            <div className="col-span-4">Description</div>
            <div className="col-span-2">Quantity</div>
            <div className="col-span-2">Unit Price</div>
            <div className="col-span-2">Discount (Opt)</div>
            <div className="col-span-1">Tax % (Opt)</div>
            <div className="col-span-1 text-center">Action</div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No items added. A document cannot be finalized without at least
              one item.
            </div>
          ) : (
            items.map((item, index) => (
              <ItemRow
                key={index}
                index={index}
                item={item}
                onChange={handleItemChange}
                onRemove={handleRemoveItem}
              />
            ))
          )}
        </div>
        <div className="flex items-center justify-end">
          
          <Button
            type="button"
            variant="outline"
            onClick={handleAddItem}
          >
            <Plus size={16} className="mr-2" /> Add Item
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="secondary" disabled={isSubmitting}>
          <Save size={16} className="mr-2" />
          Save as Draft
        </Button>
        <Button
          type="button"
          disabled={isSubmitting || items.length === 0}
          onClick={handleFinalize}
        >
          <Send size={16} className="mr-2" />
          Save & Finalize
        </Button>
      </div>
    </form>
  );
}
