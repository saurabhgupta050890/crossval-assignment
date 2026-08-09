import { cva } from "class-variance-authority";
import { DocumentStatus } from "@prisma/client";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase",
  {
    variants: {
      status: {
        [DocumentStatus.FINALIZED]:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
        [DocumentStatus.DRAFT]:
          "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
      },
    },
    defaultVariants: {
      status: DocumentStatus.DRAFT,
    },
  }
);

const statusDotVariants = cva("size-1.5 rounded-full shrink-0", {
  variants: {
    status: {
      [DocumentStatus.FINALIZED]: "bg-emerald-500",
      [DocumentStatus.DRAFT]: "bg-amber-400",
    },
  },
  defaultVariants: {
    status: DocumentStatus.DRAFT,
  },
});

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={statusBadgeVariants({ status })}>
      <span className={statusDotVariants({ status })} />
      {status}
    </span>
  );
}
