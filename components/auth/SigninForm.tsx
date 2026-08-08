"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";

interface SigninFormProps {
  onSwitchToSignup: () => void;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function SigninForm({ onSwitchToSignup }: SigninFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!formData.email || !formData.password) {
      setErrors({ general: "Please fill in all fields" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422 && data.issues) {
          setErrors(data.issues);
        } else {
          setErrors({
            general: data.error || "Something went wrong. Please try again.",
          });
        }
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {errors.general && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {errors.general}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="signin-email">Email address</Label>
        <Input
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          aria-describedby={errors.email ? "signin-email-error" : undefined}
          className={
            errors.email
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }
        />
        {errors.email && (
          <p id="signin-email-error" className="text-xs text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <div className="relative">
          <Input
            id="signin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            aria-describedby={
              errors.password ? "signin-password-error" : undefined
            }
            className={`pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p id="signin-password-error" className="text-xs text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            <LogIn size={16} />
            Sign in
          </>
        )}
      </Button>

      <p className="text-center text-muted-foreground">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-medium text-foreground underline-offset-4 hover:underline transition-colors cursor-pointer"
        >
          Create one
        </button>
      </p>
    </form>
  );
}
