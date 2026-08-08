import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SignupSchema } from "@/lib/validations";
import { createSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = SignupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { firstName, lastName, email, password } = result.data;

    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password (bcrypt with 12 rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user — store only the hash, never the raw password
    const user = await prisma.user.create({
      data: { firstName, lastName, email, password: passwordHash },
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
    });

    // Create JWT session cookie
    await createSession(user.id);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/auth/signup]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
