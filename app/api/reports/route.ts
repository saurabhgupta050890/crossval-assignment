import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processDocumentCalculations } from "@/lib/calculations";

export const GET = withAuth(async (req, session) => {
  const { searchParams } = req.nextUrl;

  // Default: last 30 days
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setDate(defaultStart.getDate() - 30);

  const rawStart = searchParams.get("startDate");
  const rawEnd = searchParams.get("endDate");

  const startDate = rawStart ? new Date(rawStart) : defaultStart;
  const endDate = rawEnd ? new Date(rawEnd) : now;

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid startDate or endDate. Use ISO 8601 format." },
      { status: 400 },
    );
  }

  if (startDate > endDate) {
    return NextResponse.json(
      { error: "start date must be before end date." },
      { status: 400 },
    );
  }

  // Clamp endDate to end-of-day so issueDate queries are inclusive
  const endDateInclusive = new Date(endDate);
  endDateInclusive.setHours(23, 59, 59, 999);

  const documents = await prisma.document.findMany({
    where: {
      userId: session.userId,
      issueDate: {
        gte: startDate,
        lte: endDateInclusive,
      },
    },
    include: {
      items: true,
    },
  });

  // Aggregate totals
  let totalDocuments = 0;
  let sumGrandTotal = 0;
  let sumTotalTax = 0;
  let sumTotalDiscount = 0;

  for (const doc of documents) {
    totalDocuments++;
    const calc = processDocumentCalculations(doc);
    sumGrandTotal += calc.finalAmount;
    sumTotalTax += calc.taxAmount;
    sumTotalDiscount += calc.discountAmount;
  }

  // Build CSV
  const fmt = (n: number) => n.toFixed(2);
  const dateLabel = (d: Date) => d.toISOString().split("T")[0];

  const csvLines = [
    "Metric,Value",
    `Report Period,${dateLabel(startDate)} to ${dateLabel(endDateInclusive)}`,
    `Number of Documents,${totalDocuments}`,
    `Sum of Grand Totals,${fmt(sumGrandTotal)}`,
    `Sum of Total Tax,${fmt(sumTotalTax)}`,
    `Sum of Total Discount,${fmt(sumTotalDiscount)}`,
  ];

  const csv = csvLines.join("\r\n");

  const fileName = `report_${dateLabel(startDate)}_${dateLabel(endDateInclusive)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
});

