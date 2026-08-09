import { z } from "zod";

const BaseItemSchema = z.object({
  quantity: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
  discount: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().regex(/^\d+(\.\d+)?%?$/).optional()
  ),
  tax: z.number().nonnegative().default(0).optional(),
});

const ItemSchema = BaseItemSchema.superRefine((data, ctx) => {
  const subtotal = data.quantity * data.unitPrice;
  if (data.discount) {
    let discountAmount = 0;
    if (data.discount.endsWith("%")) {
      const percentage = parseFloat(data.discount.slice(0, -1));
      discountAmount = subtotal * (percentage / 100);
    } else {
      discountAmount = parseFloat(data.discount);
    }
    if (discountAmount > subtotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Discount cannot exceed the subtotal",
        path: ["discount"],
      });
    }
  }
});

console.log(ItemSchema.safeParse({ quantity: 1, unitPrice: 100, discount: "150" }).success); // false
console.log(ItemSchema.safeParse({ quantity: 1, unitPrice: 100, discount: "150%" }).success); // false
console.log(ItemSchema.safeParse({ quantity: 1, unitPrice: 100, discount: "50" }).success); // true
console.log(ItemSchema.safeParse({ quantity: 1, unitPrice: 100, discount: "50%" }).success); // true

// can we use partial?
// const UpdateItemSchema = ItemSchema.partial(); // Type error
