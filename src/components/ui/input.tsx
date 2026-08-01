import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  /** "text" = letters only (no digits/symbols), "number" = digits only */
  validate?: "text" | "number";
};

const TEXT_ONLY = /[^\p{L}\s'’.\-]/gu;
const DIGITS_ONLY = /[^\d]/g;
const DECIMAL_ONLY = /[^\d.]/g;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, validate, onChange, inputMode, ...props }, ref) => {
    const numeric = validate === "number" || type === "tel" || type === "number";
    const textual = validate === "text";

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (numeric || textual) {
          const raw = e.target.value;
          let next = raw;
          if (numeric) {
            next = type === "number" ? raw.replace(DECIMAL_ONLY, "") : raw.replace(DIGITS_ONLY, "");
          } else if (textual) {
            next = raw.replace(TEXT_ONLY, "");
          }
          if (next !== raw) e.target.value = next;
        }
        onChange?.(e);
      },
      [numeric, textual, type, onChange],
    );

    return (
      <input
        type={type}
        inputMode={inputMode ?? (numeric ? "numeric" : undefined)}
        onChange={handleChange}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
