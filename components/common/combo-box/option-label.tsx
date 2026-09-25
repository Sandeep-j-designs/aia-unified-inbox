import React from "react";
import Typography from "@/components/common/typography";
import { cn } from "@/lib/utils";

type Props = {
  label: string | React.ReactNode;
  isSelected: boolean;
};

const OptionLabel = ({ label, isSelected }: Props) => {
  const className = cn(
    "min-w-0 truncate",
    isSelected ? "font-medium text-primary" : "text-foreground"
  );

  if (typeof label !== "string") {
    return <div className={className}>{label}</div>;
  }

  return (
    <Typography variant="body-2" className={className}>
      {label}
    </Typography>
  );
};

export default OptionLabel;
