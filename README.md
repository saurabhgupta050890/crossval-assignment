### CrossVal Assigment 

- Name: Multi-Rate Pricing Calculator
- Assignment: https://drive.google.com/drive/folders/1u_Y5v5hZz1m2QerSQAs5tlEzBatkSyhG
- Live application: https://crossval-assignment-c0wynbfuv-saurabhgupta050890s-projects.vercel.app/

### Prerequisites

- Node.js >= 20
- pnpm >= 9 (other package managers like yarn or npm can also be used but remove pnpm files first)

### Tech Stack:
- Next.js (App Router)
- TypeScript
- TailwindCSS
- ShadCN UI
- Prisma + SQLite (Database)
- Decimal.js

## How to run on local

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

First, install the dependencies:

```bash
npm i
# or
yarn
# or 
pnpm i
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Business Logic & Rules

### Calculation and Rounding Policy
All monetary calculations are performed using precise decimal arithmetic (`decimal.js`) to prevent floating-point inaccuracies. Every intermediate step is rounded to exactly 2 decimal places before proceeding to the next step. All calculations are handled in a centralized library at `/lib/calculations.ts`. 

1. **Subtotal** = `Round(Quantity * Unit Price, 2)`
2. **Discount Amount** = `Round(Calculated Discount, 2)`
3. **After Discount Amount** = `Round(Subtotal - Discount Amount, 2)`
4. **Tax Amount** = `Round(After Discount Amount * (Tax % / 100), 2)`
5. **Final Amount** = `Round(After Discount Amount + Tax Amount, 2)`

**Worked Example**:
- Quantity: 3
- Unit Price: $10.15
- Discount: 10%
- Tax: 5%

- Subtotal: `3 * 10.15` = `$30.45`
- Discount Amount: `30.45 * (10 / 100)` = `3.045` -> rounded to `$3.05`
- After Discount: `30.45 - 3.05` = `$27.40`
- Tax Amount: `27.40 * (5 / 100)` = `1.370` -> rounded to `$1.37`
- Final Amount: `27.40 + 1.37` = `$28.77`

### Discount Clamping Logic
To prevent negative totals, discounts are strictly clamped (capped) at the item's subtotal.
- If a flat discount of $50 is applied to a $30 subtotal, the effective discount amount is clamped to $30.
- If a percentage discount exceeds 100%, it is effectively clamped to 100% of the subtotal.

### API Validations
Strict validation rules are enforced at the API layer (using Zod):
- **Document Level**: Title and Customer Name must be between 1 and 255 characters.
- **Item Level**: 
  - Quantity must be strictly positive (`> 0`).
  - Unit Price and Tax must be non-negative (`>= 0`).
  - Discount must be a valid non-negative number or percentage string (e.g., `"20"` or `"20%"`).
- **Finalization**: A document cannot be marked as `FINALIZED` unless it contains at least one item.

### Finalize & Immutability Rules
Once a document is marked as `FINALIZED` (status update via the API), it becomes immutable. 
- The document's core details (title, customer name, date) can no longer be edited.
- Items cannot be added, updated, or removed from a finalized document.
- API endpoints strictly enforce a `409 Conflict` response if any modification is attempted on a `FINALIZED` document.
- A `FINALIZED` document can be deleted

## Assumptions and Tradeoffs
- **Derived Data is Not Persisted**: We do not store computed values (subtotals, tax amounts, final totals) in the database. Instead, these are dynamically recalculated on the fly during API GET requests. This prevents data anomalies and simplifies the database schema, at the tradeoff of slightly more compute overhead on reads.
- **Database Precision**: Because SQLite does not have a native `Decimal` data type, monetary inputs are stored as `Float`. To mitigate precision loss, all critical financial calculations are lifted out of the database layer and handled strictly in the application layer using `decimal.js`.
- **Currency Agnostic**: The application assumes a standard 2-decimal currency system for all calculations. It does not assume a specific currency and does not display one. 
