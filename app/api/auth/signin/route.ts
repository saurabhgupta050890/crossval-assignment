import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SigninSchema } from "@/lib/validations";
import { createSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = SigninSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { email, password } = result.data;

    // Look up user
    const user = await prisma.user.findUnique({ where: { email } });

    // Use constant-time comparison to avoid timing attacks
    // (compare even if user doesn't exist to prevent email enumeration)
    const dummyHash = "$2b$12$invalidhashinvalidhashinvalidhashinvalidhashinvalid";
    const passwordHash = user?.password ?? dummyHash;
    const valid = await bcrypt.compare(password, passwordHash);

    if (!user || !valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create JWT session cookie
    await createSession(user.id);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/auth/signin]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
