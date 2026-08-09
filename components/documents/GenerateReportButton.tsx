"use client";

import { useState } from "react";
import { type DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Download, Loader2 } from "lucide-react";
import { format, subDays } from "date-fns";

interface GenerateReportButtonProps {
  totalDocuments: number;
}

export function GenerateReportButton({
  totalDocuments,
}: GenerateReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const hasDocuments = totalDocuments > 0;

  const label = (() => {
    if (range?.from && range?.to) {
      return `${format(range.from, "MMM d, yyyy")} – ${format(range.to, "MMM d, yyyy")}`;
    }
    if (range?.from) return format(range.from, "MMM d, yyyy");
    return "Pick a date range";
  })();

  async function handleGenerate() {
    if (!range?.from) return;
    setIsGenerating(true);
    try {
      const params = new URLSearchParams({
        startDate: range.from.toISOString(),
        endDate: (range.to ?? range.from).toISOString(),
      });
      const res = await fetch(`/api/reports?${params}`);

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        console.error("Report generation failed:", json?.error ?? res.statusText);
        return;
      }

      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const fileName = match?.[1] ?? "report.csv";

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        disabled={!hasDocuments}
        title={
          !hasDocuments
            ? "Create at least one document to generate a report"
            : "Generate CSV report"
        }
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-medium transition-all border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 disabled:pointer-events-none disabled:opacity-50 uppercase"
      >
        <CalendarIcon size={16} />
        Generate Report
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex flex-col">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            disabled={{ after: new Date() }}
            numberOfMonths={2}
          />
          <div className="border-t border-border px-4 py-3 flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground truncate flex-1">
              {label}
            </span>
            <Button
              disabled={!range?.from || isGenerating}
              onClick={handleGenerate}
            >
              {isGenerating ? (
                <Loader2 size={16} className="mr-1.5 animate-spin" />
              ) : (
                <Download size={16} className="mr-1.5" />
              )}
              {isGenerating ? "Generating…" : "Download CSV"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

