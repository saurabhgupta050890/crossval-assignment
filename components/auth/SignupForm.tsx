"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, UserPlus, Loader2, Check, X } from "lucide-react";
import { getPasswordStrength, getStrengthLabel } from "@/lib/password";

interface SignupFormProps {
  onSwitchToSignin: () => void;
}

interface FormErrors {
  firstName?: string | string[];
  lastName?: string | string[];
  email?: string | string[];
  password?: string | string[];
  confirmPassword?: string | string[];
  general?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const PASSWORD_RULES = [
  { label: "At least 6 characters", test: (p: string) => p.length >= 6 },
  { label: "Contains a letter", test: (p: string) => /[a-zA-Z]/.test(p) },
  { label: "Contains a number", test: (p: string) => /[0-9]/.test(p) },
  {
    label: "Contains a special character",
    test: (p: string) => /[^a-zA-Z0-9]/.test(p),
  },
];

function getErrorMessage(
  error: string | string[] | undefined,
): string | undefined {
  if (!error) return undefined;
  return Array.isArray(error) ? error[0] : error;
}

export default function SignupForm({ onSwitchToSignin }: SignupFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const strength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password],
  );
  const { label: strengthLabel, color: strengthColor } = useMemo(
    () => getStrengthLabel(strength),
    [strength],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="signup-firstName">First name</Label>
          <Input
            id="signup-firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="Jane"
            value={formData.firstName}
            onChange={handleChange}
            disabled={loading}
            className={
              getErrorMessage(errors.firstName)
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }
          />
          {getErrorMessage(errors.firstName) && (
            <p className="text-xs text-destructive">
              {getErrorMessage(errors.firstName)}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-lastName">Last name</Label>
          <Input
            id="signup-lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Doe"
            value={formData.lastName}
            onChange={handleChange}
            disabled={loading}
            className={
              getErrorMessage(errors.lastName)
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }
          />
          {getErrorMessage(errors.lastName) && (
            <p className="text-xs text-destructive">
              {getErrorMessage(errors.lastName)}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email address</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          className={
            getErrorMessage(errors.email)
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }
        />
        {getErrorMessage(errors.email) && (
          <p className="text-xs text-destructive">
            {getErrorMessage(errors.email)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Input
            id="signup-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            className={`pr-10 ${getErrorMessage(errors.password) ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {formData.password.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Password strength</span>
              <span
                className={`font-medium ${
                  strength < 40
                    ? "text-destructive"
                    : strength < 60
                      ? "text-orange-500"
                      : strength < 80
                        ? "text-yellow-600"
                        : "text-green-600"
                }`}
              >
                {strengthLabel}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                style={{ width: `${strength}%` }}
              />
            </div>

            <ul className="space-y-1 pt-1">
              {PASSWORD_RULES.map((rule) => {
                const passed = rule.test(formData.password);
                return (
                  <li
                    key={rule.label}
                    className="flex items-center gap-1.5"
                  >
                    {passed ? (
                      <Check size={12} className="text-green-600 shrink-0" />
                    ) : (
                      <X size={12} className="text-muted-foreground shrink-0" />
                    )}
                    <span
                      className={
                        passed ? "text-green-600" : "text-muted-foreground"
                      }
                    >
                      {rule.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {getErrorMessage(errors.password) && (
          <p className="text-xs text-destructive">
            {getErrorMessage(errors.password)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirmPassword">Confirm password</Label>
        <div className="relative">
          <Input
            id="signup-confirmPassword"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            className={`pr-10 ${getErrorMessage(errors.confirmPassword) ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label={
              showConfirm ? "Hide confirm password" : "Show confirm password"
            }
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {formData.confirmPassword.length > 0 && (
          <p
            className={`flex items-center gap-1 ${
              formData.password === formData.confirmPassword
                ? "text-green-600"
                : "text-destructive"
            }`}
          >
            {formData.password === formData.confirmPassword ? (
              <>
                <Check size={12} /> Passwords match
              </>
            ) : (
              <>
                <X size={12} /> Passwords do not match
              </>
            )}
          </p>
        )}
        {getErrorMessage(errors.confirmPassword) && (
          <p className="text-xs text-destructive">
            {getErrorMessage(errors.confirmPassword)}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Creating account…
          </>
        ) : (
          <>
            <UserPlus size={16} />
            Create account
          </>
        )}
      </Button>

      <p className="text-center text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignin}
          className="font-medium text-foreground underline-offset-4 hover:underline transition-colors cursor-pointer"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
