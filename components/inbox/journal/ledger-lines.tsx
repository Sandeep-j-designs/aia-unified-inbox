import React from "react";
import { Plus, Trash2 } from "lucide-react";
import Typography from "@/components/common/typography";
import RupeeInput from "@/components/common/rupee-input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LEDGERS } from "@/config/pages/inbox/journal-masters";
import AllocationCell from "./allocation-cell";
import type { Form, JournalLineError } from "@/components/inbox/v2/store";

/**
 * Ledger Lines.
 *
 * Ported from Prototypes/Journals (components/journal-voucher/ledger-lines).
 *
 * Debit and Credit are two cells holding one choice: typing into either clears
 * the other, so a line can never be both sides of its own entry.
 */

type Line = Form["lines"][number];

/**
 * The table's grid, matched to the AP bill's item table: every column is ruled,
 * the head is grounded and set in muted semibold, and body rows reserve a fixed
 * control row so the primary field lines up across the row whatever sits under
 * it. Written once here rather than repeated on ten cells.
 */
const HEAD_ROW = "bg-accent hover:bg-accent";

// A table cell cannot be a flex container without collapsing the table's own
// layout, so alignment here is text-align, not justify-content.
const HEAD_CELL = cn(
  "border-r border-neutral-gray px-[10px] py-[10px] align-middle",
  "h-[42px] text-sm font-semibold text-muted-foreground whitespace-nowrap"
);

const BODY_ROW = "border-b border-neutral-gray hover:bg-transparent";

const BODY_CELL = "h-[75px] border-r border-neutral-gray px-[10px] py-3 align-middle";

/**
 * Column widths, narrowed from the Journals page's.
 *
 * There they are 232/232/200/200/180/43 and sum to 1087, which a full-width
 * page seats comfortably. This form does not get a full-width page — it sits
 * beside the document the voucher was read from, so its own column is roughly
 * 820px at 1440. At the page's widths the last two columns fell off the right
 * edge, which meant Allocation and the remove control were only reachable by
 * finding a horizontal scrollbar under the table.
 *
 * So: the same order and the same proportions, trimmed to fit, with Line
 * Narration left to absorb whatever is going spare. It is the one column whose
 * content has no natural width — a ledger name, a rupee figure and a cost
 * centre pill all do. `table-fixed` is what hands it the remainder.
 *
 * The floor below is the sum of the fixed columns plus a readable narration.
 * Under that the table scrolls, which is the behaviour the page already had.
 */
const COL = {
  ledger: "w-[190px]",
  narration: "", // takes the remainder
  debit: "w-[140px]",
  credit: "w-[140px]",
  allocation: "w-[150px]",
  actions: "w-[44px]",
};
const TABLE_FLOOR = "min-w-[794px]";

type Props = {
  lines: Line[];
  /** Line indexes carrying a fault, and which cell it belongs to. */
  errors: JournalLineError[];
  costClass: string;
  readOnly?: boolean;
  onLineChange: (index: number, patch: Partial<Line>) => void;
  onAmountChange: (index: number, side: "dr" | "cr", value: number) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
};

const LedgerLines = ({
  lines,
  errors,
  costClass,
  readOnly,
  onLineChange,
  onAmountChange,
  onAddLine,
  onRemoveLine,
}: Props) => {
  const errorAt = (index: number, kind: "amount" | "ledger") =>
    errors.some((e) => e.index === index && e.kind === kind);

  return (
    <section>
      <Typography variant="h6" weight="medium" className="mb-4">
        Ledger Lines
      </Typography>

      {/* Square, and open at the top: the head's own ground is the table's top
          edge, so a rule above it would draw a line the AP items table does not
          have either. */}
      <div className="overflow-x-auto border border-t-0 border-neutral-gray">
        <Table className={cn("w-full table-fixed border-collapse", TABLE_FLOOR)}>
          <TableHeader>
            <TableRow className={HEAD_ROW}>
              <TableHead className={cn(HEAD_CELL, COL.ledger)}>
                Ledger Account
              </TableHead>
              <TableHead className={cn(HEAD_CELL, COL.narration)}>
                Line Narration
              </TableHead>
              <TableHead className={cn(HEAD_CELL, COL.debit, "text-right")}>
                Debit (₹)
              </TableHead>
              <TableHead className={cn(HEAD_CELL, COL.credit, "text-right")}>
                Credit (₹)
              </TableHead>
              <TableHead className={cn(HEAD_CELL, COL.allocation)}>
                Allocation
              </TableHead>
              {!readOnly ? (
                <TableHead
                  className={cn(HEAD_CELL, COL.actions, "border-r-0")}
                />
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line, index) => {
              const amountError = errorAt(index, "amount");
              const ledgerError = errorAt(index, "ledger");
              return (
                <TableRow key={index} className={BODY_ROW}>
                  <TableCell className={BODY_CELL}>
                    <Select
                      value={line.ledger || undefined}
                      disabled={readOnly}
                      onValueChange={(value) =>
                        onLineChange(index, { ledger: value })
                      }
                    >
                      <SelectTrigger
                        aria-label="Ledger account"
                        className={cn(
                          ledgerError &&
                            "border-destructive-foreground focus:ring-0"
                        )}
                      >
                        <SelectValue placeholder="Select Ledger" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          ...new Set(
                            [
                              line.ledger,
                              ...LEDGERS.map((l) => l.name),
                            ].filter(Boolean)
                          ),
                        ].map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {ledgerError ? (
                      <Typography
                        variant="sm"
                        className="mt-1 text-destructive-foreground"
                      >
                        Required Field
                      </Typography>
                    ) : null}
                  </TableCell>

                  <TableCell className={BODY_CELL}>
                    <Input
                      aria-label="Line narration"
                      placeholder="Enter Line Narration"
                      readOnly={readOnly}
                      value={line.description}
                      onChange={(event) =>
                        onLineChange(index, { description: event.target.value })
                      }
                    />
                  </TableCell>

                  <TableCell className={BODY_CELL}>
                    <RupeeInput
                      aria-label="Debit"
                      value={line.dr}
                      disabled={readOnly}
                      hasError={amountError}
                      onChange={(value) => onAmountChange(index, "dr", value)}
                    />
                    {amountError ? (
                      <Typography
                        variant="sm"
                        className="mt-1 text-right text-destructive-foreground"
                      >
                        Required Field
                      </Typography>
                    ) : null}
                  </TableCell>

                  <TableCell className={BODY_CELL}>
                    <RupeeInput
                      aria-label="Credit"
                      value={line.cr}
                      disabled={readOnly}
                      hasError={amountError}
                      onChange={(value) => onAmountChange(index, "cr", value)}
                    />
                    {amountError ? (
                      <Typography
                        variant="sm"
                        className="mt-1 text-right text-destructive-foreground"
                      >
                        Required Field
                      </Typography>
                    ) : null}
                  </TableCell>

                  <TableCell className={BODY_CELL}>
                    <AllocationCell
                      value={line.costCentre}
                      hasAmount={!!(line.dr || line.cr)}
                      costClass={costClass}
                      readOnly={readOnly}
                      onChange={(costCentre) =>
                        onLineChange(index, { costCentre })
                      }
                    />
                  </TableCell>

                  {!readOnly ? (
                    // px-0 and a 32px button: under `table-fixed` this column
                    // is held at 44px, and the cell's usual 10px of side
                    // padding would leave a 40px control 24px to sit in.
                    <TableCell className={cn(BODY_CELL, "border-r-0 px-0")}>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove line"
                        className="mx-auto h-8 w-8"
                        onClick={() => onRemoveLine(index)}
                      >
                        <Trash2 className="h-4 w-4 text-secondary-foreground" />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {!readOnly ? (
        <Button variant="ghost" size="sm" className="mt-3" onClick={onAddLine}>
          <Plus className="h-4 w-4" />
          Add Ledger Line
        </Button>
      ) : null}
    </section>
  );
};

export default LedgerLines;
