import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type MasterKind = "ledger" | "vendor";

/**
 * The groups a new ledger can be filed under, from Tally's chart of accounts.
 *
 * Trimmed to the heads a line on a bill, invoice or journal is posted to. The
 * AP sheet's New Ledger dialog carries the full tree with book sub-groups;
 * this is the short form for a bulk edit, not a second chart.
 *
 * DEV: replace with GET /api/accounting-masters/groups.
 */
const LEDGER_GROUPS = [
  "Indirect Expenses",
  "Direct Expenses",
  "Purchase Accounts",
  "Sales Accounts",
  "Indirect Incomes",
  "Direct Incomes",
  "Fixed Assets",
  "Current Assets",
  "Current Liabilities",
  "Duties & Taxes",
];
/** Tally's two answers a new ledger can give; "Undefined" is migration debris. */
const GST_APPLICABILITY = ["Not Applicable", "Applicable"];
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

type Props = {
  kind: MasterKind | null;
  /** What was typed in the dropdown's search box, carried into Name. */
  initialName: string;
  /** Names already in the book, for the uniqueness check. */
  existing: string[];
  onClose: () => void;
  onCreate: (name: string) => void;
};

/**
 * Create a ledger or a vendor from the bulk-edit bar, and stage it for the
 * selection. Like every bulk edit, it is written to the rows on Save or
 * Save & approve.
 *
 * A vendor is a ledger too, filed under Sundry Creditors, so both are one
 * dialog. It asks only what the new master cannot be made without. Anything
 * more (credit period, bank details, TDS) belongs to the master's own page,
 * not to a bulk edit.
 *
 * DEV: prototype-only. On Create, POST /api/accounting-masters/ledgers (a
 * vendor is `{ group: "Sundry Creditors", gstin }`), then stage the returned
 * name for the selection.
 */
const CreateMasterDialog = ({
  kind,
  initialName,
  existing,
  onClose,
  onCreate,
}: Props) => {
  const [name, setName] = useState("");
  const [group, setGroup] = useState(LEDGER_GROUPS[0]);
  const [gst, setGst] = useState(GST_APPLICABILITY[0]);
  const [gstin, setGstin] = useState("");
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!kind) return;
    setName(initialName);
    setGroup(LEDGER_GROUPS[0]);
    setGst(GST_APPLICABILITY[0]);
    setGstin("");
    setTried(false);
  }, [kind, initialName]);

  const noun = kind === "vendor" ? "vendor" : "ledger";
  const trimmed = name.trim();
  const taken = existing.some(
    (value) => value.trim().toLowerCase() === trimmed.toLowerCase()
  );
  const nameError = !trimmed
    ? `Enter a ${noun} name.`
    : taken
      ? `A ${noun} called “${trimmed}” already exists.`
      : "";
  const gstinError =
    kind === "vendor" && gstin.trim() && !GSTIN.test(gstin.trim())
      ? "A GSTIN is 15 characters, like 29ABCDE1234F1Z5."
      : "";

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTried(true);
    if (nameError || gstinError) return;
    onCreate(trimmed);
  };

  return (
    <Dialog open={!!kind} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[480px]">
        <form onSubmit={submit} noValidate className="space-y-5">
          <DialogHeader>
            <DialogTitle>
              {kind === "vendor" ? "Create vendor" : "New ledger"}
            </DialogTitle>
            <DialogDescription>
              It is added to your books, and set on the selected documents when
              you save.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="master-name">Name</Label>
            <Input
              id="master-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={tried && !!nameError}
              aria-describedby={
                tried && nameError ? "master-name-error" : undefined
              }
            />
            {tried && nameError && (
              <p
                id="master-name-error"
                className="text-xs text-destructive-foreground"
              >
                {nameError}
              </p>
            )}
          </div>

          {kind === "ledger" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="master-group">Under</Label>
                <Select value={group} onValueChange={setGroup}>
                  <SelectTrigger id="master-group">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEDGER_GROUPS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="master-gst">GST applicability</Label>
                <Select value={gst} onValueChange={setGst}>
                  <SelectTrigger id="master-gst">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GST_APPLICABILITY.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="master-gstin">GSTIN (optional)</Label>
                <Input
                  id="master-gstin"
                  value={gstin}
                  onChange={(event) =>
                    setGstin(event.target.value.toUpperCase())
                  }
                  maxLength={15}
                  aria-invalid={tried && !!gstinError}
                  aria-describedby={
                    tried && gstinError ? "master-gstin-error" : undefined
                  }
                />
                {tried && gstinError && (
                  <p
                    id="master-gstin-error"
                    className="text-xs text-destructive-foreground"
                  >
                    {gstinError}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <span className="text-sm font-medium">Under</span>
                {/* Not a choice: a vendor is a Sundry Creditors ledger. Said,
                    so the accountant knows where it lands. */}
                <p className="flex h-10 items-center text-sm text-secondary-foreground">
                  Sundry Creditors
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMasterDialog;
