export const getPasswordStrength = (password: string): number => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score += 20;
  if (password.length >= 12) score += 10;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;
  return Math.min(score, 100);
};

export const getStrengthLabel = (
  score: number,
): { label: string; color: string } => {
  if (score === 0) return { label: "", color: "" };
  if (score < 40) return { label: "Weak", color: "bg-destructive" };
  if (score < 60) return { label: "Fair", color: "bg-orange-500" };
  if (score < 80) return { label: "Good", color: "bg-yellow-500" };
  return { label: "Strong", color: "bg-green-500" };
};
