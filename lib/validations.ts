import { DocumentStatus } from "@prisma/client";
import { z } from "zod";

export const SignupSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be less than 50 characters")
      .trim(),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be less than 50 characters")
      .trim(),
    email: z.email("Please enter a valid email address").trim().toLowerCase(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const SigninSchema = z.object({
  email: z.email("Please enter a valid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type SigninInput = z.infer<typeof SigninSchema>;

export const ItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be positive").default(1),
  unitPrice: z.number().nonnegative("Unit price must be non-negative"),
  discount: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? undefined : val,
    z
      .string()
      .regex(
        /^\d+(\.\d+)?%?$/,
        "Discount must be a non-negative number or percentage, e.g., '20' or '20%'",
      )
      .optional(),
  ),
  tax: z.number().nonnegative("Tax must be non negative").default(0).optional(),
});

export const UpdateItemSchema = ItemSchema.partial();

export const CreateDocumentSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(255, "Title is too long")
      .trim(),
    customerName: z
      .string()
      .min(1, "Customer name is required")
      .max(255, "Customer name is too long")
      .trim(),
    issueDate: z.coerce.date({ error: "Invalid date" }),
    isFinal: z.boolean().optional().default(false),
    items: z.array(ItemSchema).optional().default([]),
  })
  .refine(
    (data) => {
      if (data.isFinal && data.items.length === 0) return false;
      return true;
    },
    {
      message: "A document cannot be finalized without at least one item",
      path: ["items"],
    },
  );

export const UpdateDocumentSchema = z
  .object({
    title: z.string().min(1).max(255).trim().optional(),
    customerName: z.string().min(1).max(255).trim().optional(),
    issueDate: z.coerce.date().optional(),
    isFinal: z.boolean().optional(),
    items: z.array(ItemSchema).optional(),
  })
  .refine(
    (data) => {
      if (
        data.isFinal === true &&
        data.items !== undefined &&
        data.items.length === 0
      )
        return false;
      return true;
    },
    {
      message: "A document cannot be finalized without at least one item",
      path: ["items"],
    },
  );

export type ItemInput = z.infer<typeof ItemSchema>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;

export type ItemOutput = ItemInput & {
  id: string;
  subtotal: number; // qty * unit price
  discountAmount: number; //discount value (if discount is 20% then 20% of subtotal or absolute value)
  afterDiscountAmount: number; //subtotal - discountAmount
  taxAmount: number; // afterDiscountAmount * tax%
  finalAmount: number; //afterDiscountAmount + taxAmount
};

export type DocumentOutput = {
  id: string;
  title: string;
  customerName: string;
  issueDate: string;
  status: DocumentStatus;
  items: ItemOutput[];
  subtotal: number; // sum of all items subtotal
  totalDiscount: number; // sum of all items discountAmount
  totalTax: number; // sum of all items taxAmount
  grandTotal: number; // sum of all items finalAmount
};
