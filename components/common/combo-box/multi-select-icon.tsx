import React from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  isSelected: boolean;
  isMultiSelect: boolean;
};

const MultiSelectIcon = ({ isSelected, isMultiSelect }: Props) =>
  isMultiSelect ? (
    <div
      className={cn(
        "mr-2 flex h-[18px] w-[18px] items-center justify-center rounded-sm border border-primary hover:!border-primary",
        isSelected ? " bg-white text-primary" : "opacity-50 [&_svg]:invisible"
      )}
    >
      <CheckIcon className={cn("h-3 w-3")} />
    </div>
  ) : null;

export default MultiSelectIcon;
