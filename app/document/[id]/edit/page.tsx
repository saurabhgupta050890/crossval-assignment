import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DocumentForm } from "@/components/documents/DocumentForm";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";
import SignOutButton from "@/components/auth/SignOutButton";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { processDocumentCalculations } from "@/lib/calculations";
import { DocumentStatus } from "@prisma/client";
import { DocumentOutput } from "@/lib/validations";

export const metadata = {
  title: "Edit Document — CrossVal Multirate",
};

export default async function EditDocumentPage({
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

  if (document.status === DocumentStatus.FINALIZED) {
    redirect(`/document/${document.id}`);
  }

  const processedDocument = processDocumentCalculations(document);

  const initialData: DocumentOutput = {
    ...processedDocument,
    issueDate: processedDocument.issueDate.toISOString(),
    totalDiscount: processedDocument.discountAmount,
    totalTax: processedDocument.taxAmount,
    grandTotal: processedDocument.finalAmount,
  };

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

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-8">
        <div>
          <Link href={`/document/${document.id}`}>
            <Button
              variant="ghost"
              className="mb-4 -ml-3 text-muted-foreground"
            >
              <ChevronLeft size={16} className="mr-1" /> Back to Document
            </Button>
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Edit Document
          </h1>
          <p className="text-muted-foreground mt-2">
            Update the details and items for this draft document.
          </p>
        </div>

        <Separator />

        <DocumentForm initialData={initialData} isEdit />
      </main>
    </div>
  );
}
