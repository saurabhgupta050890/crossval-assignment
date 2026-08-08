"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SigninForm from "./SigninForm";
import SignupForm from "./SignupForm";

type Tab = "signin" | "signup";

export default function AuthCard() {
  const [activeTab, setActiveTab] = useState<Tab>("signin");

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Branding */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          CrossVal Multirate
        </h1>
        <p className="text-muted-foreground mt-1">
          {activeTab === "signin"
            ? "Welcome - Sign in to your account"
            : "Create your account to get started"}
        </p>
      </div>

      <Card className="shadow-lg border-border/50">
        <CardHeader className="pb-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
            <TabsList variant="line" className="w-full">
              <TabsTrigger value="signin" className="flex-1">
                Sign in
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">
                Create account
              </TabsTrigger>
            </TabsList>

            <CardContent className="px-0 pt-6">
              <TabsContent value="signin">
                <SigninForm onSwitchToSignup={() => setActiveTab("signup")} />
              </TabsContent>

              <TabsContent value="signup">
                <SignupForm onSwitchToSignin={() => setActiveTab("signin")} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
}
