import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader } from "lucide-react";

import { cn } from "@/lib/utils/index";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 box-border whitespace-nowrap rounded-md border-0 text-label-2 font-medium shadow-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        destructive:
          "bg-[var(--palette-red-500)] text-primary-foreground hover:bg-[var(--palette-red-600)] active:bg-[var(--palette-red-700)]",
        outline:
          "border border-border bg-background text-foreground hover:bg-neutral-gray",
        secondary:
          "bg-accent text-primary hover:bg-[color-mix(in_srgb,hsl(var(--accent)),hsl(var(--primary))_15%)]",
        ghost: "bg-transparent text-primary hover:bg-accent",
        link: "rounded-none bg-transparent text-primary underline-offset-4 hover:underline",
        "link-secondary":
          "rounded-none bg-transparent text-muted-foreground underline-offset-4 hover:underline",
      },
      isDestructive: { true: "", false: "" },
      size: {
        default: "px-3 py-2",
        sm: "px-3 py-2 text-label-3",
        lg: "h-10 px-3 py-2",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-8 w-8 p-0 text-label-3",
        "icon-xs": "h-6 w-6 p-0",
        "icon-xss": "h-5 w-5 p-0",
      },
    },
    compoundVariants: [
      {
        isDestructive: true,
        variant: ["default", "primary"],
        className:
          "bg-[var(--palette-red-500)] text-primary-foreground hover:bg-[var(--palette-red-600)] active:bg-[var(--palette-red-700)]",
      },
      {
        isDestructive: true,
        variant: "secondary",
        className:
          "bg-destructive text-[var(--palette-red-500)] hover:bg-[color-mix(in_srgb,hsl(var(--destructive)),var(--palette-red-500)_15%)]",
      },
      {
        isDestructive: true,
        variant: "outline",
        className:
          "border-[var(--palette-red-500)] text-[var(--palette-red-500)] hover:bg-destructive",
      },
      {
        isDestructive: true,
        variant: "ghost",
        className: "text-[var(--palette-red-500)] hover:bg-destructive",
      },
      {
        isDestructive: true,
        variant: ["link", "link-secondary"],
        className: "text-[var(--palette-red-500)]",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  loadingIndicator?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      isDestructive,
      leadingIcon,
      trailingIcon,
      size,
      children,
      loadingIndicator,
      loading = false,
      asChild = false,
      disabled = false,
      onClickCapture,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, isDestructive, className })
        )}
        ref={ref}
        disabled={loading || disabled}
        aria-busy={loading}
        {...props}
        aria-disabled={loading || disabled || undefined}
        onClickCapture={(event) => {
          if (loading || disabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          onClickCapture?.(event);
        }}
      >
        {loading
          ? loadingIndicator || (
              <Loader aria-hidden="true" className="animate-spin" />
            )
          : leadingIcon}
        <Slottable>{children}</Slottable>
        {trailingIcon}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
