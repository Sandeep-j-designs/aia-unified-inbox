import React, { ReactNode } from "react";
import { CommandGroup, CommandItem } from "../../ui/command";
import { Tooltip } from "@/components/common/tooltip";
import { cn } from "@/lib/utils";
import MultiSelectIcon from "./multi-select-icon";
import OptionIcon from "./option-icon";
import OptionLabel from "./option-label";
import SingleSelectIcon from "./single-select-icon";
import type { ComboBoxOption, ComboBoxOptionGroup } from "@/types/components";

type Props<TValue extends string | number> = {
  isMultiSelect: boolean;
  onClick: (event: React.MouseEvent) => void;
  onSelect: (option: ComboBoxOption<TValue>) => void;
  optionActions?: (option: ComboBoxOption<TValue>) => ReactNode;
  optionGroups?: ComboBoxOptionGroup<TValue>[];
  options: ComboBoxOption<TValue>[];
  selectedValues: TValue[];
  title: string;
};

const ComboBoxOptionItem = <TValue extends string | number>({
  index,
  isMultiSelect,
  isSelected,
  onClick,
  onSelect,
  option,
  optionActions,
  title,
}: {
  index: number;
  isMultiSelect: boolean;
  isSelected: boolean;
  onClick: (event: React.MouseEvent) => void;
  onSelect: (option: ComboBoxOption<TValue>) => void;
  option: ComboBoxOption<TValue>;
  optionActions?: (option: ComboBoxOption<TValue>) => ReactNode;
  title: string;
}) => {
  const titleId = title.toLowerCase().replace(/\s+/g, "-");
  const item = (
    <CommandItem
      // Bloocks Combobox row: 36px, a neutral tint under the cursor, and the
      // selected row in the brand's subtle fill with a check.
      value={String(option.value)}
      data-testid={`${titleId}-option-${index.toString().replace(/\s+/g, "-")}`}
      className={cn(
        "group cursor-pointer gap-2 rounded-md px-3 py-2 text-foreground data-[selected=true]:bg-section data-[selected=true]:text-foreground",
        isSelected &&
          "bg-accent font-medium text-primary data-[selected=true]:bg-accent data-[selected=true]:text-primary",
        option.disabled &&
          "cursor-not-allowed opacity-50 data-[selected=true]:bg-transparent"
      )}
      disabled={option.disabled}
      onSelect={() => {
        onSelect(option);
      }}
      onClick={onClick}
    >
      <MultiSelectIcon isMultiSelect={isMultiSelect} isSelected={isSelected} />
      <OptionIcon icon={option.icon} isSelected={isSelected} />
      <OptionLabel label={option.label} isSelected={isSelected} />

      <SingleSelectIcon isMultiSelect={isMultiSelect} isSelected={isSelected} />
      {optionActions ? (
        <div className={isSelected ? "" : "ml-auto"}>
          {optionActions(option)}
        </div>
      ) : null}
    </CommandItem>
  );

  return (
    <div
      id={`${titleId}-option-${option.value.toString().replace(/\s+/g, "-")}`}
    >
      {option.tooltip ? (
        <Tooltip message={option.tooltip} side="right" align="start">
          <div className={cn(option.disabled && "cursor-not-allowed")}>
            {item}
          </div>
        </Tooltip>
      ) : (
        item
      )}
    </div>
  );
};

const ComboBoxOptionList = <TValue extends string | number>({
  isMultiSelect,
  onClick,
  onSelect,
  optionActions,
  optionGroups,
  options,
  selectedValues,
  title,
}: Props<TValue>) => {
  const renderOption = (option: ComboBoxOption<TValue>, index: number) => (
    <ComboBoxOptionItem
      key={option.value}
      index={index}
      isMultiSelect={isMultiSelect}
      isSelected={selectedValues.includes(option.value)}
      onClick={onClick}
      onSelect={onSelect}
      option={option}
      optionActions={optionActions}
      title={title}
    />
  );

  if (optionGroups?.length) {
    let optionIndex = 0;

    return (
      <>
        {optionGroups.map((group, groupIndex) => (
          <CommandGroup
            key={groupIndex}
            heading={group.label}
            className="p-0 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-caption-1 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-secondary-foreground"
          >
            {group.options.map((option) => renderOption(option, optionIndex++))}
          </CommandGroup>
        ))}
      </>
    );
  }

  return (
    <CommandGroup className="p-0">
      {options.map((option, index) => renderOption(option, index))}
    </CommandGroup>
  );
};

export default ComboBoxOptionList;
