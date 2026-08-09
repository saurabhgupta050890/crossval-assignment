import type { Document, Item } from "@prisma/client";
import type { ItemOutput } from "./validations";
import Decimal from "decimal.js";

export const processItem = (item: Item): ItemOutput => {
  const { discount, quantity, unitPrice, tax } = item;
  const subtotal = Decimal(quantity).times(unitPrice).toDecimalPlaces(2);

  let discountAmount = Decimal(0);

  // max discount cannot be more than subtotal
  if (discount?.includes("%")) {
    discountAmount = Decimal.min(
      Decimal(subtotal).times(Decimal(discount.slice(0, -1)).div(100)),
      subtotal,
    ).toDecimalPlaces(2);
  } else {
    discountAmount = Decimal.min(
      Decimal(discount ?? 0),
      subtotal,
    ).toDecimalPlaces(2);
  }

  const afterDiscountAmount = Decimal(subtotal)
    .minus(discountAmount)
    .toDecimalPlaces(2);

  const taxAmount = afterDiscountAmount
    .times(Decimal(tax ?? 0).div(100))
    .toDecimalPlaces(2);

  const finalAmount = afterDiscountAmount.plus(taxAmount).toDecimalPlaces(2);

  return {
    ...item,
    discount: item.discount ?? undefined,
    tax: item.tax ?? undefined,
    subtotal: subtotal.toNumber(),
    discountAmount: discountAmount.toNumber(),
    afterDiscountAmount: afterDiscountAmount.toNumber(),
    taxAmount: taxAmount.toNumber(),
    finalAmount: finalAmount.toNumber(),
  };
};

export const processDocumentCalculations = (
  document: Document & {
    items: Item[];
  },
) => {
  const items: ItemOutput[] = document.items.map((item) => processItem(item));

  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const discountAmount = items.reduce(
    (acc, item) => acc + item.discountAmount,
    0,
  );
  const afterDiscountAmount = items.reduce(
    (acc, item) => acc + item.afterDiscountAmount,
    0,
  );
  const taxAmount = items.reduce((acc, item) => acc + item.taxAmount, 0);
  const finalAmount = items.reduce((acc, item) => acc + item.finalAmount, 0);

  return {
    ...document,
    items,
    subtotal,
    discountAmount,
    afterDiscountAmount,
    taxAmount,
    finalAmount,
  };
};
