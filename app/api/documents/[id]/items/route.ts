import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ItemSchema } from "@/lib/validations";
import { DocumentStatus } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedDocument(id: string, userId: string) {
  return prisma.document.findFirst({ where: { id, userId } });
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const document = await getOwnedDocument(id, session.userId);
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const items = await prisma.item.findMany({
    where: { documentId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const document = await getOwnedDocument(id, session.userId);
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.status !== DocumentStatus.DRAFT) {
    return NextResponse.json(
      { error: "Items can only be added to draft documents" },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const item = await prisma.item.create({
    data: {
      ...parsed.data,
      documentId: id,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
