import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AuthCard from "@/components/auth/AuthCard";
import { ModeToggle } from "@/components/mode-toggle";

export default async function Home() {
  const session = await getSession();

  // Authenticated users go straight to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <div className="flex justify-end items-end pr-8 py-2">
        <ModeToggle />
      </div>
      <div className="flex flex-col flex-1 items-center justify-center bg-background py-12">
        <AuthCard />
      </div>
    </div>
  );
}
