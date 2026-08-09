<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:react-agent-rules -->

# React code styles to use in this project

1. Use ternary operators for conditional rendering instead of &&
Example:

```tsx
{condition ? <div>Hello</div> : <div>Bye</div>}
```

Instead of:

```tsx
{condition && <div>Hello</div>}
```

2. Always use shadcn components for UI elements
Example:

```tsx
import { Button } from "@/components/ui/button"
```

3. Use default sizes of text and components unless specified
Example:

```tsx
<Button>Click me</Button>
```

Instead of:

```tsx
<Button size="sm">Click me</Button>
```

4. Use clsx or cva for conditional css classes.
Example:

```tsx
<div
  className={cn("text-2xl", {
    "bg-red-100": status === "DRAFT",
    "bg-green-100": status === "SUBMITTED",
  })}
>
  Hello
</div>
```

Instead of:

```tsx
<div style={{ color: status === "DRAFT" ? "red" : "green" }}>Hello</div>
```

5. For complex conditonal classes, use cva

```tsx
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground hover:bg-secondary",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export { buttonVariants };
```


<!-- END:react-agent-rules -->
