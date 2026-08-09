import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpdateItemSchema } from "@/lib/validations";
import { DocumentStatus } from "@prisma/client";

type RouteParams = { id: string; itemId: string };

async function getOwnedDocument(id: string, userId: string) {
  return prisma.document.findFirst({ where: { id, userId } });
}

export const GET = withAuth<RouteParams>(async (_req, session, { params }) => {
  const { id, itemId } = await params;
  const document = await getOwnedDocument(id, session.userId);
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId, documentId: id },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(item);
});

export const PATCH = withAuth<RouteParams>(async (req, session, { params }) => {
  const { id, itemId } = await params;
  const document = await getOwnedDocument(id, session.userId);
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.status !== DocumentStatus.DRAFT) {
    return NextResponse.json(
      { error: "Items can only be modified in draft documents" },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  try {
    const updated = await prisma.item.update({
      where: { id: itemId, documentId: id },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
});

export const DELETE = withAuth<RouteParams>(
  async (_req, session, { params }) => {
    const { id, itemId } = await params;
    const document = await getOwnedDocument(id, session.userId);
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    if (document.status !== DocumentStatus.DRAFT) {
      return NextResponse.json(
        { error: "Items can only be deleted from draft documents" },
        { status: 409 },
      );
    }

    try {
      await prisma.item.delete({
        where: { id: itemId, documentId: id },
      });
      return new NextResponse(null, { status: 204 });
    } catch {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
  },
);
