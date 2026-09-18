import React from "react";
import { Check, Copy, FileText, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Item, routeNames } from "./store";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    value
  );
/** What a payable reads as on the books: a credit against the vendor. */
const credit = (value: number) => `${money(value)} Cr`;
const date = (value: string) =>
  value && !Number.isNaN(Date.parse(value))
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : value || "—";

export function RecordBanner({
  tone,
  title,
  children,
  action,
  label,
}: {
  tone: "success" | "warning";
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  label: string;
}) {
  const success = tone === "success";
  const Icon = success ? Check : Copy;
  return (
    <section
      aria-label={title}
      /*
        The banner is the first thing under the header bar, and the bar has a
        border of its own — without the top margin the card's own border landed
        on it and the two read as one collided edge.
      */
      className="mx-5 my-3 flex shrink-0 flex-wrap items-center gap-4 rounded-xl border border-neutral-gray bg-background px-5 py-4 shadow-sm"
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          success
            ? "bg-success-green text-success-green-foreground"
            : "bg-warning text-warning-foreground"
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 basis-80">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              success
                ? "bg-success-green text-success-green-foreground"
                : "bg-warning text-warning-foreground"
            )}
          >
            <Lock className="h-3 w-3" aria-hidden />
            {label}
          </span>
        </div>
        <div className="mt-1 text-xs leading-5 text-secondary-foreground">
          {children}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </section>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-secondary-foreground">{label}</dt>
      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
        {value || "—"}
      </dd>
    </div>
  );
}

export function ApprovedDetails({
  item,
  company,
}: {
  item: Item;
  company: string;
}) {
  const f = item.snapshot || item.form;
  const journal = item.route === "JV";
  const ar = item.route === "AR" ? item.arSnapshot || item.arSheet : undefined;
  const subtotal = f.lines.reduce((sum, line) => sum + line.amount, 0);
  const adjustments = Math.round((item.amount - subtotal) * 100) / 100;
  /*
    The tax block as it came off the document. Both sides of the invoice carry
    one — a bill's GST is input, a sales invoice's is output — and neither is
    recomputed here; these are the figures the extraction read.
  */
  const taxes = item.original?.bill?.taxes || item.original?.invoice?.taxes;
  const taxHeads = taxes
    ? (
        [
          ["CGST", taxes.cgst],
          ["SGST", taxes.sgst],
          ["IGST", taxes.igst],
        ] as const
      ).filter(([, amount]) => !!amount)
    : [];
  const taxTotal = taxHeads.reduce((sum, [, amount]) => sum + (amount || 0), 0);
  const taxSide = item.route === "AR" ? "Output" : "Input";
  /*
    Tally's bill-wise allocation. A purchase entered against a supplier invoice
    it has not seen before opens a new reference under that invoice's number,
    payable on the due date — one row, because one bill is what an inbox
    document is. Part-payments and settled references would come from the
    ledger, which this prototype does not carry.
  */
  const allocation =
    item.route === "AP" && f.invoiceNo
      ? {
          refType: "New Ref",
          refName: f.invoiceNo,
          due: f.due,
          amount: item.amount,
        }
      : undefined;
  return (
    <article
      aria-label="Approved voucher details"
      className="min-w-0 space-y-5"
    >
      <section className="overflow-hidden rounded-xl border border-neutral-gray bg-background">
        <header className="border-b border-neutral-gray p-6">
          <div className="mb-5 flex items-center gap-2 text-xs font-medium text-secondary-foreground">
            <FileText className="h-4 w-4" aria-hidden />
            {routeNames[item.route]}
            <span className="ml-auto rounded-md bg-accent px-2 py-1 text-primary">
              {f.voucherType}
            </span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="mb-1 text-xs text-secondary-foreground">
                Voucher {f.voucherNo}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {f.party || f.voucherType}
              </h1>
              <p className="mt-2 text-xs text-secondary-foreground">
                {company}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-secondary-foreground">
                {journal ? "Total debit" : "Voucher total"}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                {money(
                  journal ? f.lines.reduce((s, l) => s + l.dr, 0) : item.amount
                )}
              </p>
              <p className="mt-1 text-[11px] text-secondary-foreground">
                INR · Indian Rupee
              </p>
            </div>
          </div>
        </header>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-6 p-6 xl:grid-cols-3">
          <Detail
            label={
              journal
                ? "Voucher date"
                : item.route === "AR"
                  ? "Invoice date"
                  : "Bill date"
            }
            value={date(f.date)}
          />
          <Detail
            label={
              journal
                ? "Reference number"
                : item.route === "AR"
                  ? "Invoice number"
                  : "Supplier invoice"
            }
            value={f.invoiceNo}
          />
          <Detail
            label={journal ? "Reference date" : "Due date"}
            value={date(f.due)}
          />
          <Detail label="GST registration" value={f.gst} />
          <Detail label="Cost centre" value={f.costCentre} />
          <Detail label="Cost centre class" value={f.costClass} />
          {/* The document this voucher was read off, named the way the bills
              screen names it. */}
          <Detail label="Bill document" value={item.file?.name} />
          {/*
            Nothing has been paid against a voucher the moment it posts, so the
            outstanding balance is the whole of it. Part-payments live in the
            ledger, which this prototype does not read.
          */}
          {!journal && (
            <Detail label="Outstanding amount" value={credit(item.amount)} />
          )}
        </dl>
      </section>
      <section className="overflow-hidden rounded-xl border border-neutral-gray bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-sm font-semibold">
            {journal ? "Journal entries" : "Line items"}
          </h2>
          <span className="text-xs text-secondary-foreground">
            {f.lines.length} {f.lines.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-neutral-gray bg-accent/40 text-xs text-secondary-foreground">
              <tr>
                {/* Description and ledger are two columns, as on the bills
                    screen — a line's own wording and the account it lands in
                    are different facts, and stacking them read as one. */}
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">
                  {journal ? "Ledger" : "Ledger name"}
                </th>
                <th className="px-4 py-3 font-medium">Cost centre</th>
                <th className="px-6 py-3 text-right font-medium">
                  {journal ? "Debit" : "Amount"}
                </th>
                {journal && (
                  <th className="px-6 py-3 text-right font-medium">Credit</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-gray">
              {f.lines.map((line, index) => (
                <tr key={index}>
                  <td className="px-6 py-4">{line.description || "—"}</td>
                  <td className="px-4 py-4 font-medium">
                    {line.ledger || "—"}
                  </td>
                  <td className="px-4 py-4 text-xs text-secondary-foreground">
                    {line.costCentre || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums">
                    {money(journal ? line.dr : line.amount)}
                  </td>
                  {journal && (
                    <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums">
                      {money(line.cr)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-neutral-gray bg-accent/40">
              {!journal && (adjustments !== 0 || taxHeads.length > 0) && (
                <>
                  <tr>
                    <th
                      colSpan={3}
                      className="px-6 pt-4 text-xs font-normal text-secondary-foreground"
                    >
                      Sub total
                    </th>
                    <td className="px-6 pt-4 text-right text-xs tabular-nums">
                      {money(subtotal)}
                    </td>
                  </tr>
                  {/*
                    GST by head, as the bills screen states it. It used to be a
                    single "Taxes & adjustments" figure, which is the one line
                    of a bill an accountant checks head by head.
                  */}
                  {taxHeads.length > 0 ? (
                    <>
                      <tr>
                        <th
                          colSpan={3}
                          className="px-6 pt-3 text-xs font-medium"
                        >
                          GST
                        </th>
                        <td className="px-6 pt-3 text-right text-xs font-medium tabular-nums">
                          {money(taxTotal)}
                        </td>
                      </tr>
                      {taxHeads.map(([head, amount]) => (
                        <tr key={head}>
                          <th
                            colSpan={3}
                            className="px-6 pl-10 pt-2 text-left text-xs font-normal text-secondary-foreground"
                          >
                            {taxSide} {head}
                          </th>
                          <td className="px-6 pt-2 text-right text-xs tabular-nums text-secondary-foreground">
                            {money(amount || 0)}
                          </td>
                        </tr>
                      ))}
                    </>
                  ) : (
                    <tr>
                      <th
                        colSpan={3}
                        className="px-6 pt-3 text-xs font-normal text-secondary-foreground"
                      >
                        Taxes &amp; adjustments
                      </th>
                      <td className="px-6 pt-3 text-right text-xs tabular-nums">
                        {money(adjustments)}
                      </td>
                    </tr>
                  )}
                </>
              )}
              <tr>
                <th colSpan={3} className="px-6 py-4 text-xs font-medium">
                  {journal ? "Total" : "Grand total"}
                </th>
                <td className="whitespace-nowrap px-6 py-4 text-right font-semibold tabular-nums">
                  {money(
                    journal
                      ? f.lines.reduce((s, l) => s + l.dr, 0)
                      : item.amount
                  )}
                </td>
                {journal && (
                  <td className="whitespace-nowrap px-6 py-4 text-right font-semibold tabular-nums">
                    {money(f.lines.reduce((s, l) => s + l.cr, 0))}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
        {ar && (
          <div className="border-t border-neutral-gray px-6 py-4 text-xs text-secondary-foreground">
            Sales ledger: {ar.salesLedger || "—"}
          </div>
        )}
        {ar && (
          <details className="border-t border-neutral-gray px-6 py-4">
            <summary className="cursor-pointer text-xs font-medium text-primary">
              Item and tax breakdown
            </summary>
            <div className="mt-4 space-y-4">
              {ar.items
                .filter((row) => row.amount || row.description || row.item)
                .map((row) => (
                  <div
                    key={row.id}
                    className="rounded-lg border border-neutral-gray p-4"
                  >
                    <p className="text-sm font-medium">
                      {row.item || row.description || "Item"}
                    </p>
                    {row.item && row.description && (
                      <p className="mt-1 text-xs text-secondary-foreground">
                        {row.description}
                      </p>
                    )}
                    <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      <Detail label="Quantity" value={String(row.quantity)} />
                      <Detail label="Unit rate" value={money(row.unitRate)} />
                      <Detail label="Discount" value={`${row.discount}%`} />
                      <Detail label="Tax" value={row.tax} />
                      <Detail label="Godown" value={row.godown} />
                      <Detail label="Cost centre" value={row.costCentre} />
                    </dl>
                  </div>
                ))}
              {ar.ledgers
                .filter((row) => row.amount || row.ledger)
                .map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap justify-between gap-2 text-xs"
                  >
                    <span>
                      {row.ledger || "Ledger"} · {row.description || "—"} ·{" "}
                      {row.tax || "No tax"} ·{" "}
                      {row.costCentre || "No cost centre"}
                    </span>
                    <span className="tabular-nums">{money(row.amount)}</span>
                  </div>
                ))}
              {ar.taxes
                .filter((row) => row.amount || row.ledger)
                .map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap justify-between gap-2 text-xs"
                  >
                    <span>
                      {row.ledger || "Tax"} ·{" "}
                      {row.costCentre || "No cost centre"}
                    </span>
                    <span className="tabular-nums">{money(row.amount)}</span>
                  </div>
                ))}
            </div>
          </details>
        )}
        {f.narration && f.narration !== "—" && (
          <div className="border-t border-neutral-gray px-6 py-4">
            <h3 className="text-xs text-secondary-foreground">Narration</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {f.narration}
            </p>
          </div>
        )}
      </section>
      {allocation && (
        <section className="overflow-hidden rounded-xl border border-neutral-gray bg-background">
          <div className="px-6 py-4">
            <h2 className="text-sm font-semibold">Bill allocation</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-neutral-gray bg-accent/40 text-xs text-secondary-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Ref type</th>
                  <th className="px-4 py-3 font-medium">Ref name</th>
                  <th className="px-4 py-3 font-medium">Due date</th>
                  <th className="px-6 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-6 py-4">{allocation.refType}</td>
                  <td className="px-4 py-4">{allocation.refName}</td>
                  <td className="px-4 py-4">{date(allocation.due)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums">
                    {credit(allocation.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
      <div className="flex items-start gap-3 px-1 pb-4 text-xs leading-5 text-secondary-foreground">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-success-green-foreground"
          aria-hidden
        />
        <p>
          Approved by{" "}
          <span className="font-medium text-foreground">
            {item.doneBy || "Unknown approver"}
          </span>
          {item.doneAt && (
            <>
              {" "}
              on {date(item.doneAt)} at{" "}
              {new Date(item.doneAt).toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </>
          )}
          .<br />
          This is the posted record. To change it, use Edit entry.
        </p>
      </div>
    </article>
  );
}
