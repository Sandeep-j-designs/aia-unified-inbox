import React from "react";
import Typography from "@/components/common/typography";
import { cn } from "@/lib/utils";

/**
 * The three figures a journal voucher actually has.
 *
 * Ported unchanged from Prototypes/Journals (components/journal-voucher/
 * voucher-totals).
 *
 * Not a bill's breakdown. There is no sub-total, no tax, no grand total — the
 * voucher does not arrive at a number, it asserts that two numbers agree, and
 * Difference is the statement of whether they do.
 */

type Totals = {
  totalDebit: number;
  totalCredit: number;
  difference: number;
  isBalanced: boolean;
};

const formatRupees = (value: number) =>
  `₹ ${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const Row = ({
  label,
  value,
  emphasise,
}: {
  label: string;
  value: string;
  emphasise?: boolean;
}) => (
  <div className="flex items-center justify-between gap-4 py-4">
    <Typography variant="p" weight={emphasise ? "semibold" : "normal"}>
      {label}
    </Typography>
    <Typography
      variant="p"
      weight={emphasise ? "semibold" : "normal"}
      className={cn(emphasise && "text-destructive-foreground")}
    >
      {value}
    </Typography>
  </div>
);

const VoucherTotalsPanel = ({ totals }: { totals: Totals }) => {
  // A non-zero difference is the one thing on this panel that is a problem, so
  // it is the one thing that takes a colour.
  const differenceIsProblem = !totals.isBalanced;

  return (
    <section className="rounded-lg bg-section px-6 py-1">
      <Row label="Total Debit" value={formatRupees(totals.totalDebit)} />
      <div className="h-px bg-neutral-gray" />
      <Row label="Total Credit" value={formatRupees(totals.totalCredit)} />
      <div className="h-px bg-neutral-gray" />
      <Row
        label="Difference"
        value={formatRupees(totals.difference)}
        emphasise={differenceIsProblem}
      />
    </section>
  );
};

export default VoucherTotalsPanel;
