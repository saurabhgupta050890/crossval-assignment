import { describe, it, expect } from "vitest";
import { getPasswordStrength, getStrengthLabel } from "../../lib/password";

describe("getPasswordStrength", () => {
  it("should return 0 for an empty string", () => {
    expect(getPasswordStrength("")).toBe(0);
  });

  it("should calculate score correctly for a weak password", () => {
    // length < 6, no uppercase, no numbers, no special chars -> score 10 for lowercase
    expect(getPasswordStrength("abc")).toBe(10);
  });

  it("should calculate score correctly for a fair password", () => {
    // length >= 6 (20), lowercase (10), uppercase (20) -> 50
    expect(getPasswordStrength("Abcdef")).toBe(50);
  });

  it("should calculate score correctly for a good password", () => {
    // length >= 6 (20), lowercase (10), uppercase (20), numbers (20) -> 70
    expect(getPasswordStrength("Abcdef1")).toBe(70);
  });

  it("should calculate score correctly for a strong password", () => {
    // length >= 12 (20+10), lowercase (10), uppercase (20), numbers (20), special chars (20) -> 100
    expect(getPasswordStrength("Abcdef123456!")).toBe(100);
  });

  it("should cap the score at 100", () => {
    expect(getPasswordStrength("Abcdefghijklmnop123456!@#$%^&*")).toBe(100);
  });
});

describe("getStrengthLabel", () => {
  it("should return empty label and color for score 0", () => {
    expect(getStrengthLabel(0)).toEqual({ label: "", color: "" });
  });

  it("should return Weak and destructive color for score < 40", () => {
    expect(getStrengthLabel(39)).toEqual({ label: "Weak", color: "bg-destructive" });
    expect(getStrengthLabel(10)).toEqual({ label: "Weak", color: "bg-destructive" });
  });

  it("should return Fair and orange color for score < 60", () => {
    expect(getStrengthLabel(40)).toEqual({ label: "Fair", color: "bg-orange-500" });
    expect(getStrengthLabel(59)).toEqual({ label: "Fair", color: "bg-orange-500" });
  });

  it("should return Good and yellow color for score < 80", () => {
    expect(getStrengthLabel(60)).toEqual({ label: "Good", color: "bg-yellow-500" });
    expect(getStrengthLabel(79)).toEqual({ label: "Good", color: "bg-yellow-500" });
  });

  it("should return Strong and green color for score >= 80", () => {
    expect(getStrengthLabel(80)).toEqual({ label: "Strong", color: "bg-green-500" });
    expect(getStrengthLabel(100)).toEqual({ label: "Strong", color: "bg-green-500" });
  });
});
