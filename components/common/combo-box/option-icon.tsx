import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  icon?: React.ComponentType<{ className?: string }>;
  isSelected: boolean;
};

const OptionIcon = ({ icon: Icon, isSelected }: Props) =>
  Icon ? (
    <Icon
      className={cn(
        "h-4 w-4 flex-none text-secondary-foreground",
        isSelected ? "text-primary" : ""
      )}
    />
  ) : null;

export default OptionIcon;
