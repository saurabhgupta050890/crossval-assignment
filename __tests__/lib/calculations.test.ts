import { describe, it, expect } from "vitest";
import {
  processItem,
  processDocumentCalculations,
} from "../../lib/calculations";
import type { Item, Document } from "@prisma/client";
import { DocumentStatus } from "@prisma/client";

describe("processItem", () => {
  it("should calculate correct amounts without discount and tax", () => {
    const item: Item = {
      id: "item1",
      description: "Item 1",
      unitPrice: 100,
      quantity: 2,
      discount: null,
      tax: null,
      documentId: "doc1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = processItem(item);

    expect(result.subtotal).toBe(200);
    expect(result.discountAmount).toBe(0);
    expect(result.afterDiscountAmount).toBe(200);
    expect(result.taxAmount).toBe(0);
    expect(result.finalAmount).toBe(200);
  });

  it("should calculate correct amounts with percentage discount", () => {
    const item: Item = {
      id: "item1",
      description: "Item 1",
      unitPrice: 100,
      quantity: 2,
      discount: "10%",
      tax: null,
      documentId: "doc1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = processItem(item);

    expect(result.subtotal).toBe(200);
    expect(result.discountAmount).toBe(20);
    expect(result.afterDiscountAmount).toBe(180);
    expect(result.taxAmount).toBe(0);
    expect(result.finalAmount).toBe(180);
  });

  it("should calculate correct amounts with fixed discount", () => {
    const item: Item = {
      id: "item1",
      description: "Item 1",
      unitPrice: 100,
      quantity: 2,
      discount: "30",
      tax: null,
      documentId: "doc1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = processItem(item);

    expect(result.subtotal).toBe(200);
    expect(result.discountAmount).toBe(30);
    expect(result.afterDiscountAmount).toBe(170);
    expect(result.taxAmount).toBe(0);
    expect(result.finalAmount).toBe(170);
  });

  it("should calculate correct amounts with tax", () => {
    const item: Item = {
      id: "item1",
      description: "Item 1",
      unitPrice: 100,
      quantity: 2,
      discount: null,
      tax: 15, // 15%
      documentId: "doc1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = processItem(item);

    expect(result.subtotal).toBe(200);
    expect(result.discountAmount).toBe(0);
    expect(result.afterDiscountAmount).toBe(200);
    expect(result.taxAmount).toBe(30); // 15% of 200
    expect(result.finalAmount).toBe(230);
  });

  it("should calculate correct amounts with both discount and tax", () => {
    const item: Item = {
      id: "item1",
      description: "Item 1",
      unitPrice: 100,
      quantity: 2,
      discount: "10%", // 20
      tax: 10, // 10%
      documentId: "doc1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = processItem(item);

    expect(result.subtotal).toBe(200);
    expect(result.discountAmount).toBe(20);
    expect(result.afterDiscountAmount).toBe(180);
    expect(result.taxAmount).toBe(18); // 10% of 180
    expect(result.finalAmount).toBe(198);
  });

  it("should cap the discount at the subtotal", () => {
    const item: Item = {
      id: "item1",
      description: "Item 1",
      unitPrice: 100,
      quantity: 2,
      discount: "300", // More than subtotal (200)
      tax: null,
      documentId: "doc1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = processItem(item);

    expect(result.subtotal).toBe(200);
    expect(result.discountAmount).toBe(200); // capped at subtotal
    expect(result.afterDiscountAmount).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.finalAmount).toBe(0);
  });
});

describe("processDocumentCalculations", () => {
  it("should correctly aggregate item amounts for a document", () => {
    const items: Item[] = [
      {
        id: "item1",
        description: "Item 1",
        unitPrice: 100,
        quantity: 2, // 200
        discount: "10%", // 20
        tax: 10, // 18
        documentId: "doc1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }, // final: 198
      {
        id: "item2",
        description: "Item 2",
        unitPrice: 50,
        quantity: 1, // 50
        discount: "10", // 10
        tax: 5, // 5% of 40 = 2
        documentId: "doc1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }, // final: 42
    ];

    const document: Document & { items: Item[] } = {
      id: "doc1",
      title: "Test Doc",
      customerName: "Customer 1",
      issueDate: new Date(),
      status: DocumentStatus.DRAFT,
      userId: "user1",
      createdAt: new Date(),
      updatedAt: new Date(),
      items,
    };

    const result = processDocumentCalculations(document);

    expect(result.subtotal).toBe(250); // 200 + 50
    expect(result.discountAmount).toBe(30); // 20 + 10
    expect(result.afterDiscountAmount).toBe(220); // 180 + 40
    expect(result.taxAmount).toBe(20); // 18 + 2
    expect(result.finalAmount).toBe(240); // 198 + 42
    expect(result.items.length).toBe(2);
    expect(result.items[0].finalAmount).toBe(198);
    expect(result.items[1].finalAmount).toBe(42);
  });

  it("should handle documents with no items", () => {
    const document: Document & { items: Item[] } = {
      id: "doc1",
      title: "Test Doc",
      customerName: "Customer 1",
      issueDate: new Date(),
      status: DocumentStatus.DRAFT,
      userId: "user1",
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    };

    const result = processDocumentCalculations(document);

    expect(result.subtotal).toBe(0);
    expect(result.discountAmount).toBe(0);
    expect(result.afterDiscountAmount).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.finalAmount).toBe(0);
    expect(result.items.length).toBe(0);
  });
});
