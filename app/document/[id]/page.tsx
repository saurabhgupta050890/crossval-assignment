import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";
import SignOutButton from "@/components/auth/SignOutButton";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { processDocumentCalculations } from "@/lib/calculations";
import { DocumentActions } from "@/components/documents/DocumentActions";
import { StatusBadge } from "@/components/documents/StatusBadge";
import { ExportPdfButton } from "@/components/documents/ExportPdfButton";

export const metadata = {
  title: "View Document — CrossVal Multirate",
};

export default async function ViewDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { id } = await params;

  const document = await prisma.document.findFirst({
    where: { id, userId: session.userId },
    include: { items: true },
  });

  if (!document) {
    redirect("/dashboard");
  }

  const processedDocument = processDocumentCalculations(document);

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-foreground">
              CrossVal Multirate
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main
        id="document-content"
        className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-8 bg-background"
      >
        <div>
          <div data-html2canvas-ignore>
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="mb-4 -ml-3 text-muted-foreground"
              >
                <ChevronLeft size={16} className="mr-1" /> Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  {processedDocument.title}
                </h1>
                <StatusBadge status={processedDocument.status} />
              </div>
              <p className="text-muted-foreground mt-2">
                Customer:{" "}
                <span className="font-medium text-foreground">
                  {processedDocument.customerName}
                </span>{" "}
                • Issue Date:{" "}
                <span className="font-medium text-foreground">
                  {new Date(processedDocument.issueDate).toLocaleDateString()}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2" data-html2canvas-ignore>
              <ExportPdfButton documentTitle={processedDocument.title} />
              <DocumentActions
                documentId={processedDocument.id}
                status={processedDocument.status}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="bg-card border border-border/50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Qty</th>
                  <th className="px-6 py-3 text-right">Unit Price</th>
                  <th className="px-6 py-3 text-right">Subtotal</th>
                  <th className="px-6 py-3 text-right">Discount</th>
                  <th className="px-6 py-3 text-right">Tax</th>
                  <th className="px-6 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {processedDocument.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-muted-foreground"
                    >
                      No items in this document.
                    </td>
                  </tr>
                ) : (
                  processedDocument.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-6 py-4 font-medium">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 text-right">{item.quantity}</td>
                      <td className="px-6 py-4 text-right">
                        {item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.subtotal.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-destructive">
                        {item.discountAmount > 0
                          ? item.discountAmount.toFixed(2)
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.taxAmount > 0 ? item.taxAmount.toFixed(2) : "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {item.finalAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {processedDocument.items.length > 0 && (
                <tfoot className="bg-muted/20 font-semibold border-t-2 border-border/50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right">
                      Total
                    </td>
                    <td className="px-6 py-4 text-right">
                      {processedDocument.subtotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-destructive">
                      {processedDocument.discountAmount > 0
                        ? processedDocument.discountAmount.toFixed(2)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      {processedDocument.taxAmount > 0
                        ? processedDocument.taxAmount.toFixed(2)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-lg text-primary">
                      {processedDocument.finalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
