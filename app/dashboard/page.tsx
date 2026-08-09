import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import SignOutButton from "../../components/auth/SignOutButton";
import { ModeToggle } from "@/components/mode-toggle";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentsTable } from "@/components/documents/DocumentsTable";
import { GenerateReportButton } from "@/components/documents/GenerateReportButton";

export const metadata = {
  title: "Dashboard — CrossVal Multirate",
};

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const [user, totalDocuments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
    }),
    prisma.document.count({ where: { userId: session.userId } }),
  ]);

  if (!user) {
    redirect("/");
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-foreground">
              CrossVal Multirate
            </span>
            <Badge variant="secondary" className="text-xs">
              Documents
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Welcome, {user.firstName}! 👋
          </h1>

          <div className="flex items-center gap-2">
            <GenerateReportButton totalDocuments={totalDocuments} />
            <Link href="/document/create">
              <Button>
                <Plus size={16} className="mr-2" /> Add Document
              </Button>
            </Link>
          </div>
        </div>

        <Separator />

        <DocumentsTable />
      </main>
    </div>
  );
}
