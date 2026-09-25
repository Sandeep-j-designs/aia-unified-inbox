import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import React from "react";

type Props = {
  isMultiSelect: boolean;
  isSelected: boolean;
};

const SingleSelectIcon = ({ isMultiSelect, isSelected }: Props) =>
  !isMultiSelect && isSelected ? (
    <div className="ml-auto flex-none">
      <CheckIcon className={cn("h-4 w-4 text-primary")} />
    </div>
  ) : null;

export default SingleSelectIcon;
