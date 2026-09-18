import React from "react";
import Typography from "@/components/common/typography";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  COST_CENTRE_CLASSES,
  JOURNAL_VOUCHER_TYPES,
} from "@/config/pages/inbox/journal-masters";
import { DateField, EditedMark } from "@/components/inbox/v2/ui";
import type { Form } from "@/components/inbox/v2/store";

/**
 * Voucher Details.
 *
 * Ported from Prototypes/Journals (components/journal-voucher/voucher-details),
 * with three differences that belong to the Inbox rather than to the design:
 *
 *  - GST Registration offers the CURRENT COMPANY's branches. The Inbox already
 *    knows them, the list has a column reading off them and the bulk Reassign
 *    panel writes to them; a second source would be a second answer.
 *  - Each field carries the Inbox's "Edited by you" mark (PRD §4.6), since
 *    every value here may have been filled by the AI and changed since.
 *  - Dates use the design system's DateField rather than `input[type=date]`,
 *    which is the one control on the bill sheet beside it that renders as the
 *    browser's own widget.
 *
 * There is deliberately no party field. A journal posts against ledgers, not
 * against a vendor or a customer — which is what separates it from every other
 * voucher the Inbox creates.
 */

type Props = {
  form: Form;
  attempted?: boolean;
  branches: string[];
  edited: string[];
  readOnly?: boolean;
  onChange: (patch: Partial<Form>) => void;
};

const FieldLabel = ({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <Label htmlFor={htmlFor} className="mb-1.5 flex gap-1 font-normal">
    {required ? (
      <span aria-hidden className="text-destructive-foreground">
        *
      </span>
    ) : null}
    {children}
  </Label>
);

const VoucherDetails = ({
  form,
  attempted,
  branches,
  edited,
  readOnly,
  onChange,
}: Props) => {
  const mark = (key: keyof Form) =>
    edited.includes(key as string) ? <EditedMark /> : null;

  const requiredError = (key: "gst" | "voucherType" | "voucherNo" | "date") =>
    attempted && !form[key].trim() ? (
      <p role="alert" className="mt-1 text-xs text-destructive-foreground">
        Required Field
      </p>
    ) : null;

  return (
    <section className="rounded-lg bg-section p-6">
      <Typography variant="h6" weight="medium" className="mb-5">
        Voucher Details
      </Typography>

      <div className="journal-details-grid grid grid-cols-1 gap-x-9 gap-y-5">
        <div>
          <FieldLabel htmlFor="jv-gst" required>
            GST Registration (My Branch)
          </FieldLabel>
          <Select
            value={form.gst || undefined}
            disabled={readOnly}
            onValueChange={(value) => onChange({ gst: value })}
          >
            <SelectTrigger id="jv-gst">
              <SelectValue placeholder="Select Location" />
            </SelectTrigger>
            <SelectContent>
              {[...new Set([form.gst, ...branches].filter(Boolean))].map(
                (branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          {requiredError("gst")}
          {mark("gst")}
        </div>

        <div>
          <FieldLabel htmlFor="jv-voucher-type" required>
            Voucher Type
          </FieldLabel>
          <Select
            value={form.voucherType}
            disabled={readOnly}
            onValueChange={(value) => onChange({ voucherType: value })}
          >
            <SelectTrigger id="jv-voucher-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                ...new Set(
                  [...JOURNAL_VOUCHER_TYPES, form.voucherType].filter(Boolean)
                ),
              ].map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {requiredError("voucherType")}
          {mark("voucherType")}
        </div>

        <div>
          <FieldLabel htmlFor="jv-voucher-no" required>
            Voucher No
          </FieldLabel>
          <Input
            id="jv-voucher-no"
            placeholder="Enter Voucher No"
            readOnly={readOnly}
            value={form.voucherNo}
            onChange={(event) => onChange({ voucherNo: event.target.value })}
          />
          {requiredError("voucherNo")}
          {mark("voucherNo")}
        </div>

        <div>
          <FieldLabel htmlFor="jv-voucher-date" required>
            Voucher Date
          </FieldLabel>
          <DateField
            id="jv-voucher-date"
            value={form.date}
            disabled={readOnly}
            onChange={(iso) => onChange({ date: iso })}
          />
          {requiredError("date")}
          {mark("date")}
        </div>

        <div>
          {/* Optional, as the frames mark it: a journal's reference is its
              external handle, not its identity. The Inbox stores it in the
              same field a bill uses for the supplier invoice number. */}
          <FieldLabel htmlFor="jv-reference-no">Reference Number</FieldLabel>
          <Input
            id="jv-reference-no"
            placeholder="Enter Reference No."
            readOnly={readOnly}
            value={form.invoiceNo}
            onChange={(event) => onChange({ invoiceNo: event.target.value })}
          />
          {mark("invoiceNo")}
        </div>

        <div>
          <FieldLabel htmlFor="jv-reference-date">Reference Date</FieldLabel>
          <DateField
            id="jv-reference-date"
            value={form.due}
            disabled={readOnly}
            onChange={(iso) => onChange({ due: iso })}
          />
          {mark("due")}
        </div>

        {/* Cost centre is a voucher-level setting here. Which centre each line
            takes is the table's Allocation column — the class chosen here is
            what that column's picker offers.

            Spanning two columns, which costs nothing: this is the seventh field
            in a three-column grid, so it sits alone on the last row with both
            of those columns already empty. What it buys is the label row. The
            switch is captioned on both sides, and at the ~222px a single column
            gives in this pane — the standalone page has half again as much —
            "Cost Centre Class" and "Cost Centre" each broke across two lines,
            which turned a one-line control into a four-line one and made the
            two captions read as four separate words.

            The Select does NOT take the extra width: it is held to one column
            below, so it still lines up with the six fields above it. */}
        <div className="journal-cost-class">
          <div className="mb-1.5 flex flex-wrap items-center gap-3">
            <Label htmlFor="jv-cost-class" className="font-normal">
              Cost Centre Class
            </Label>
            <Switch
              id="jv-cost-class-toggle"
              checked={form.costClassEnabled}
              disabled={readOnly}
              aria-label="Enable cost centre class"
              onCheckedChange={(enabled) =>
                /*
                  Turning the class off drops the class and nothing else. It does
                  not clear allocations already made on lines — the frames show a
                  line offering "Cost Centre +" while this toggle is off, so the
                  two are independent.
                */
                onChange({
                  costClassEnabled: enabled,
                  costClass: enabled ? form.costClass : "",
                })
              }
            />
            <Label htmlFor="jv-cost-class" className="font-normal">
              Cost Centre
            </Label>
          </div>
          <Select
            value={form.costClass || undefined}
            disabled={readOnly || !form.costClassEnabled}
            onValueChange={(value) => onChange({ costClass: value })}
          >
            {/* One column wide, inside a cell that is two: half of the pair,
                less half the 36px (gap-x-9) that runs between them. */}
            <SelectTrigger
              id="jv-cost-class"
              className="journal-cost-class-select"
            >
              <SelectValue placeholder="Select Cost Centre Class" />
            </SelectTrigger>
            <SelectContent>
              {COST_CENTRE_CLASSES.map((klass) => (
                <SelectItem key={klass.id} value={klass.name}>
                  {klass.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {mark("costClass")}
        </div>
      </div>
    </section>
  );
};

export default VoucherDetails;
