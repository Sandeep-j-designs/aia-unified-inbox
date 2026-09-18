import * as React from "react";
import { cn } from "@/lib/utils";
import Typography from "../common/typography";
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    const autoComplete = props.autoComplete ?? "off";

    return (
      <div className="flex flex-col w-full">
        <input
          autoComplete={autoComplete}
          data-slot="input"
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-body-3 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-body-3 file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            "data-[invalid=true]:border-destructive-foreground data-[invalid=true]:focus:border-destructive-foreground data-[invalid=true]:hover:border-destructive-foreground",
            error
              ? "border-destructive-foreground focus:border-destructive-foreground hover:border-destructive-foreground"
              : "",
            className
          )}
          ref={ref}
          {...props}
        />
        {error ? (
          <Typography
            variant="sm"
            className="text-destructive-foreground mt-0.5 leading-0"
          >
            {error}
          </Typography>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
