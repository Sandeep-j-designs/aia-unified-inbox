import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import {
  Check,
  ArrowRight,
  Copy,
  FileWarning,
  ShieldCheck,
  Trash2,
  ChevronDown,
  FilePlus2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Columns3,
  GripVertical,
  ListFilter,
  Lock,
  Mail,
  Loader2,
  Pin,
  PinOff,
  RotateCcw,
  Search,
  Keyboard,
  Lightbulb,
  Slash,
  Undo2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import FileIcon from "@/components/inbox/common/file-icon";
import JournalVoucher from "@/components/inbox/journal";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import PageTopBar from "@/components/common/page-top-bar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import SidebarLayout from "@/components/sidebar-layout";
// Aliased: `Sheet` in this file already means the AP spreadsheet component.
import {
  Sheet as Drawer,
  SheetContent as DrawerContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ColumnFilter, FilterPanel } from "./filter-panel";
import type { FilterOption } from "./filter-panel";
import Preview from "./preview";
import EditableCell from "./editable-cell";
import InboxKickstart from "./kickstart";
import {
  COLUMN_SIZES,
  DEFAULT_WIDTHS,
  SELECT_WIDTH,
  clampWidth,
  readWidths,
  sizeColumns,
} from "./table-sizing";
import { ApprovedDetails, RecordBanner } from "./record-details";
import Sheet from "./sheet";
import InvoiceSheet from "./invoice-sheet";
import {
  CountPill,
  DateField,
  EditedMark,
  Field,
  FieldCard,
  Notice,
  PageDialog,
  Pill,
  Req,
  Spinner,
  StatusPill,
  tablePillClass,
  T,
} from "./ui";
import {
  actor,
  applyBulkAction,
  BULK_VOUCHER_TYPES,
  type BulkField,
  type BulkResult,
  approve,
  companies,
  configure,
  event,
  Form,
  getState,
  hardMatch,
  ingest,
  demoUploadDocuments,
  beginUploadedExtraction,
  init,
  issue,
  Item,
  manual,
  remove,
  restore,
  retry,
  Route,
  routeNames,
  routes,
  setPermissions,
  setRoute,
  update,
  updatePosted,
  useStore,
  withinNewWindow,
  NEW_TAG_DAYS,
} from "./store";
import { useTallySync } from "@/hooks/pages/inbox/use-tally-sync";
import SyncConfirmModal from "./sync/sync-confirm-modal";
import SyncProgressModal from "./sync/sync-progress-modal";
import { RunRowList } from "./progress-run";
import UploadAnimation from "./upload-animation";
import uploadStyles from "./upload-dialog.module.css";
import Register, { type RegisterSyncState } from "./register";
import SyncResultModal from "./sync/sync-result-modal";
import SyncCloud from "./sync/sync-cloud";
import SyncChromeButton from "./sync/sync-chrome-button";
import {
  gridCellId,
  useGridKeyboard,
} from "@/hooks/pages/inbox/use-grid-keyboard";
import KeyboardShortcuts from "./keyboard-shortcuts";
const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n
  );
const stamp = (s: string) =>
  new Date(s).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
/**
 * The upload cap, named rather than inlined: the modal states it, the list
 * warns against it and the submit button enforces it, and three literals would
 * be three chances for them to disagree.
 */
const MAX_UPLOAD_FILES = 50;
/**
 * A file size a person reads. Every size used to be printed in KB, so an 8MB
 * scan arrived as "8192 KB" — technically the size, and four digits nobody
 * converts at a glance.
 */
const fileSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
const age = (s: string) => {
  const m = Math.max(0, Math.floor((Date.now() - +new Date(s)) / 60000));
  return m < 60
    ? `${m}m ago`
    : m < 1440
      ? `${Math.floor(m / 60)}h ago`
      : `${Math.floor(m / 1440)}d ago`;
};
const tabs = ["All", "Need review", "Approved", "Duplicate"];
/*
  The fourth tab is duplicates, and only duplicates.

  It was "Exception", and it collected Failed alongside Duplicate — two states
  that have nothing to do with each other and are not acted on the same way. A
  duplicate is a document we read correctly and already have; a failure is one
  we could not read at all. Grouping them put a queue of "resolve or dismiss"
  next to a queue of "retry", under a heading that named neither, and the count
  on the tab was the sum of two unrelated backlogs.

  Failed is still a status — extraction can still fail, and those rows still
  carry their own detail screen — it just no longer has a tab of its own; All
  is where it is found.
*/
const matchesTab = (item: Item, tab: string) => {
  if (tab === "All") return item.status !== "Deleted";
  if (tab === "Duplicate") return item.status === "Duplicate";
  if (tab === "Need review") return item.status === "Needs Review";
  return item.status === "Approved";
};
/**
 * The Tally voucher types the AI predicts into, and what Reassign Voucher Type
 * offers.
 *
 * PRD §4.4.2 lists seven and omits Sales, which cannot be right while Accounts
 * Receivable is a route: every AR item the Inbox creates carries "Sales", so
 * the list filtered on a value this list had no way to set, and bulk Reassign
 * offered an accountant seven types none of which was the one the row already
 * had — picking any of them moved a sales invoice off Sales with no way back.
 *
 * Flagged for the PRD rather than worked around here.
 */
const voucherTypes = [
  "Purchase",
  "Sales",
  "Journal",
  "Debit Note",
  "Credit Note",
  "Receipt",
  "Payment",
  "Contra",
];
const EMPTY_STATES: Record<string, { title: string; body: string }> = {
  All: {
    title: "Nothing in the Inbox",
    body: "Bills, invoices and journals arrive here by email, WhatsApp or upload. Approved ones stay on as a record of what was posted.",
  },
  "Need review": {
    title: "Nothing waiting on you",
    body: "You are caught up. New documents appear here as soon as they are read.",
  },
  Approved: {
    title: "No approved documents yet",
    body: "Approve a document and its record appears here, with the voucher it created and the file it came from.",
  },
  Duplicate: {
    title: "No duplicates",
    body: "A document that matches one you already have waits here until you keep it or discard it.",
  },
};
const columns = [
  "File",
  "Source",
  "Vendor",
  "Voucher type",
  "AI Route",
  "GST Registration",
  "Amount",
  "Received",
  "Status",
];
const sourceLabels = { email: "Email", whatsapp: "WhatsApp", upload: "Upload" };

/**
 * What the AI Route column calls each route.
 *
 * The queue names the voucher the document is about to become rather than the
 * ledger group it belongs to: an accountant reading a row is deciding what to
 * post, and "Purchase Voucher" is the thing they post. "Accounts Payable" is
 * where it ends up afterwards, which the module pages already say.
 *
 * Separate from `routeNames`, which stays the name of the module itself — the
 * Post as picker, the registers and the sync modal all name modules.
 */
const aiRouteLabels: Record<Route, string> = {
  AP: "Purchase Voucher",
  AR: "Sales Voucher",
  JV: "Journal Voucher",
};
const columnVisibilityKey = `inbox.columns.v3:${encodeURIComponent(actor)}`;
const defaultColumns = (companyId: string) =>
  columns.filter(
    (c) =>
      c !== "GST Registration" ||
      (companies.find((company) => company.id === companyId)?.branches.length ||
        0) > 1
  );
const RESIZABLE = new Set(columns);
/**
 * Pinning is what locks a column. A pinned column holds the front of the grid,
 * cannot be dragged while pinned — the list in the Columns dropdown
 * keeps a visibility checkbox for every column. Hiding also unpins it.
 *
 * File and Status start pinned because they are what the screen is for: File
 * identifies the row at all, and Status is what the accountant reads to decide
 * whether to open it. Pinning Status also settles the problem the column widths
 * were tuned around — it can no longer be the column pushed off the right edge,
 * because it is no longer on the right.
 */
const DEFAULT_PINNED = ["File", "Status"];
/**
 * Motion for the Columns list. One duration and one curve for the rows sliding
 * aside and for the dragged row settling into its slot, so the drop reads as
 * the same gesture finishing rather than a second, separate animation.
 *
 * The curve is a decelerating ease — quick off the mark, slow into the stop,
 * which is what makes a row look like it was placed rather than teleported.
 */
const SETTLE_MS = 200;
const EASE = "cubic-bezier(0.2, 0, 0, 1)";
/**
 * Fallback row height, for the frame before a row has been measured.
 * 45px — Figma 24421:72764, where every body row is 45 and the header is 40.
 */
const ROW_HEIGHT = 45;
/** Reading layout before paint is the point; on the server there is none. */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
/**
 * A stored column order, made safe to render from. The grid renders from the
 * order, so anything wrong with it is a missing column rather than a cosmetic
 * slip: unknown labels are dropped, duplicates collapsed, and columns the
 * stored order never heard of appended after the ones it did.
 *
 * The pinned columns are then floated to the front, which is the one invariant
 * the rest of the screen relies on: "pinned" and "leading" have to mean the
 * same thing, or the padlocks in the list stop describing the grid.
 */
const normaliseOrder = (raw: unknown, pinned: string[]): string[] => {
  const list = Array.isArray(raw)
    ? raw.filter((c): c is string => typeof c === "string")
    : [];
  const kept = list.filter(
    (c, i) => columns.includes(c) && list.indexOf(c) === i
  );
  const full = [...kept, ...columns.filter((c) => !kept.includes(c))];
  return [
    ...pinned.filter((c) => full.includes(c)),
    ...full.filter((c) => !pinned.includes(c)),
  ];
};
/**
 * Column-keyed multi-select, plus the two ranges that are not lists of values.
 * Keying by column label means the header funnels and the filter panel read and
 * write the same place, so they cannot disagree.
 */
const defaultFilters = {
  search: "",
  from: "",
  to: "",
  min: "",
  max: "",
  cols: {} as Record<string, string[]>,
};
type Filters = typeof defaultFilters;

/** The sortable/filterable value behind a column, for one item. */
const cellValue = (x: Item, column: string): string | number => {
  switch (column) {
    case "File":
      return x.file.name;
    case "Source":
      return x.source;
    case "Vendor":
      return x.form.party;
    case "Voucher type":
      return x.form.voucherType;
    case "AI Route":
      return aiRouteLabels[x.aiRoute];
    case "GST Registration":
      return x.form.gst;
    case "Amount":
      return x.amount;
    case "Received":
      return x.received;
    case "Status":
      return x.status;
    default:
      return "";
  }
};

/** Amount and Received are ranges, so they filter from the panel, not a funnel. */
/**
 * The two columns promoted out of the Filters panel and onto the bar as their
 * own dropdowns (Figma 716:15029). They stay in the panel as well — this is a
 * second way into the same `filters.cols` state, not a separate filter, so the
 * bar, the panel and the column-header funnel can never disagree about what is
 * applied.
 */
const QUICK_FILTERS = ["Source", "AI Route"] as const;
const FILTERABLE = new Set([
  "Source",
  "Vendor",
  "Voucher type",
  "AI Route",
  "GST Registration",
  "Status",
]);
const SORTABLE = new Set(columns);
const ledgerOptions = [
  "General Expenses",
  "Sales",
  "Rent",
  "Bank Charges",
  "Accounts Payable",
  "Accounts Receivable",
  "Cash",
  "Bank",
];

const PAGE_SIZES = [10, 25, 50, 100];

/*
  The three beats of the upload → table handoff, named so the sequence that
  schedules them reads as a sequence rather than as four magic numbers.

  DIALOG_EXIT matches the dialog primitive's own `duration-200`; change one and
  the table's entrance starts against an overlay that is still there.
*/
/** The cap the drop zone states. Files themselves are never sent anywhere. */
const MAX_UPLOAD_MB = 500;

/** Why a simulated upload failed, said once and shown against each file. */
const UPLOAD_FAILURE_REASON =
  "The connection dropped before the file finished.";

/**
 * What to know before choosing a file, from the bulk upload frame.
 *
 * "Bill" in the source copy is "document" here: this queue takes vendor bills,
 * sales invoices and journals, and a guideline that names only one of them
 * reads as a rule about which are allowed.
 */
const UPLOAD_GUIDELINES = [
  "Printed or handwritten documents are welcome.",
  "Use a clear, straight photo or scan for best results.",
  "Keep each document to 12 pages or fewer.",
  "We’ll let you know when your documents are ready to review.",
];

const DIALOG_DWELL_MS = 800;
const DIALOG_EXIT_MS = 200;
const TABLE_ENTER_MS = 420;

/**
 * The URL that opens one document.
 *
 * The id travels in the query, not the path. `/inbox/[id]` is a static page
 * whose paths come from MOCK_INBOX_ITEMS, and the store mints ids that list
 * never saw: POSTED-2041 and ACME-1001 at seed, and a DEMO-<company>-<uuid>
 * for every document the demo upload creates. Pushing one of those at
 * `/inbox/<id>` asks Next for a prerendered page that does not exist, and
 * `fallback: false` answers with the 404 — which is what a click on a bill
 * landed on. Staying on /inbox keeps every open on the one route that is
 * always prerendered, and `router.query.id` reads the same either way, so the
 * detail view below is unchanged.
 *
 * `/inbox/[id]` stays for deep links to the seeded ids that it does cover.
 */
const detailHref = (id: string, extra?: string) =>
  `/inbox?id=${encodeURIComponent(id)}${extra ? `&${extra}` : ""}`;

/** AP's --gutter, applied to every full-width band on the screen. */
/** 24px — the page gutter every band lines up on (Figma 24200:218735). */
const gutter = "px-6";
/**
 * Which of the review form's fields the sheet marks with an asterisk. Taken
 * from the bills sheet's own required set, so a journal asks for the same
 * things in the same way — Cost Centre and its class stay optional there too.
 */
const REQUIRED_FIELDS = new Set([
  "gst",
  "voucherType",
  "voucherNo",
  "invoiceNo",
  "date",
  "due",
  "party",
]);
/** A horizontal band of controls. */
const band = "flex flex-wrap items-center gap-2";
/**
 * One column's filter, promoted onto the bar (Figma 716:15029).
 *
 * The trigger is the frame's Quick Filter: 32px, bordered, muted 14px label and
 * a chevron. The body is `ColumnFilter` — the same searchable multi-select the
 * column-header funnel opens — rather than a second list written to look like
 * it, so "Source" means one thing wherever it is answered.
 *
 * The count sits in the label because the trigger is the only place an applied
 * quick filter shows: the frame's resting state has no room to say "2 of these
 * are on", and a dropdown that silently filters the grid is worse than a wide
 * one.
 */
const QuickFilter = ({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className={cn(
          "h-8 shrink-0 gap-2 px-3",
          T.value,
          selected.length ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
        {selected.length ? (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-caption-1 font-semibold tabular-nums text-primary-foreground">
            {selected.length}
          </span>
        ) : null}
        <ChevronDown className="h-3.5 w-3.5 flex-none opacity-80" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-auto p-0">
      <ColumnFilter
        label={label}
        options={options}
        selected={selected}
        onChange={onChange}
      />
    </PopoverContent>
  </Popover>
);
/**
 * `issue()`'s validator labels, as sentences for the Approve tooltip.
 *
 * Only the journal's own blocks are here. The other two things `issue()` can
 * return — no write access, and a hard-block duplicate — are said with more
 * context than a lookup can hold (which route, which matching voucher), so
 * they are written at the call site instead.
 */
const JV_BLOCK_COPY: Record<string, string> = {
  "Required fields missing":
    "Fill the fields marked * in Journal Details before approving.",
  "Journal out of balance":
    "Debits and credits don’t match. Balance the journal to approve.",
  "Ledger required": "Every debit and credit line needs a ledger.",
};

// Keep the upload-led entry point for each company across client navigation.
// Persisted company flags prevent replaying the demo batch after a reload.
const startedInboxCompanies = new Set<string>();

export default function Workspace() {
  const state = useStore(),
    router = useRouter();
  const [kickstartPreview, setKickstartPreview] = useState(
    () =>
      !state.startedCompanies?.includes(state.company) &&
      !startedInboxCompanies.has(state.company)
  );
  useEffect(() => {
    setKickstartPreview(
      !state.startedCompanies?.includes(state.company) &&
        !startedInboxCompanies.has(state.company)
    );
  }, [state.company, state.startedCompanies]);
  const [ready, setReady] = useState(false),
    [dialog, setDialog] = useState(""),
    [tour, setTour] = useState(0),
    /**
     * Whether Approve has been pressed on the journal currently open.
     *
     * The journal's faults are shown on attempt rather than on sight: a
     * voucher the AI has half-filled would otherwise open with both amount
     * cells of every incomplete line already red, which says the accountant
     * did something wrong before they have done anything at all.
     */
    [attempted, setAttempted] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [filters, setFilters] = useState(defaultFilters),
    [tab, setTab] = useState("Need review"),
    [page, setPage] = useState(0),
    [pageSize, setPageSize] = useState(25),
    [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(
      null
    ),
    [visibilityByCompany, setVisibilityByCompany] = useState<
      Record<string, string[]>
    >({}),
    // Which columns show and what order they sit in are separate: hiding a
    // column and showing it again should put it back where the user left it,
    // not at the end, so the order has to survive being deselected.
    [order, setOrder] = useState(() => normaliseOrder(columns, DEFAULT_PINNED)),
    [pinned, setPinned] = useState(DEFAULT_PINNED),
    [widths, setWidths] = useState<Record<string, number>>({});
  const [resizing, setResizing] = useState<string | null>(null);
  const resizeCleanup = useRef<(() => void) | null>(null);
  const gridElement = useRef<HTMLDivElement | null>(null);
  useEffect(() => () => resizeCleanup.current?.(), []);
  const visible =
    visibilityByCompany[state.company] ?? defaultColumns(state.company);
  const setVisible = (next: React.SetStateAction<string[]>) =>
    setVisibilityByCompany((previous) => {
      const current = previous[state.company] ?? defaultColumns(state.company);
      return {
        ...previous,
        [state.company]: typeof next === "function" ? next(current) : next,
      };
    });
  /**
   * The Columns dropdown applies as you go — it is a popover with two reset
   * actions and no Save, so the grid behind it is the preview.
   */
  const [columnsOpen, setColumnsOpen] = useState(false),
    [columnSearch, setColumnSearch] = useState(""),
    /**
     * The whole drag, held as one object so a row can work out where it sits
     * from a single render: which row is up, the slot it started in, the slot
     * it would land in, how far the pointer has taken it, and whether it is
     * still tracking the pointer or running out its drop animation.
     */
    [drag, setDrag] = useState<{
      key: string;
      from: number;
      to: number;
      dy: number;
      height: number;
      settling: boolean;
    } | null>(null);
  const dragging = drag?.key ?? null;
  const columnSearchRef = useRef<HTMLInputElement>(null);
  const columnList = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number>();
  // The drop commits on a timer, so a popover closed mid-flight must not leave
  // it to fire into a list that is no longer there.
  useEffect(() => () => window.clearTimeout(settleTimer.current), []);
  // The register's party filter. Its own state rather than a column filter on
  // `filters.cols`, because the register does not have the Inbox's columns.
  const [registerParty, setRegisterParty] = useState(""),
    [source, setSource] = useState<Item["source"]>("upload"),
    [sender, setSender] = useState(actor),
    [files, setFiles] = useState<Pick<File, "name" | "size">[]>([]),
    [dragOver, setDragOver] = useState(false),
    [busy, setBusy] = useState(false),
    [uploadErrors, setUploadErrors] = useState<string[]>([]),
    [waRegistered, setWaRegistered] = useState(true),
    [environment, setEnvironment] = useState("Production");
  const uploadLock = useRef(false);
  const [uploadStatus, setUploadStatus] = useState<
    ("Queued" | "Uploading" | "Uploaded" | "Failed")[]
  >([]);
  /** The beat between the last file landing and the Inbox taking over. */
  const [handoff, setHandoff] = useState(false);
  /** Set for one beat after the dialog leaves, so the table can enter. */
  const [justUploaded, setJustUploaded] = useState(false);
  const sheetSend = useRef<(type: string) => void>(() => {});
  /**
   * The design system's toaster is already mounted in _app.tsx.
   *
   * Typed, because the Tost component always carries a status circle and a
   * bare `toast()` renders none — every notice on this screen used to arrive
   * as an untyped one, so none of them showed the icon the component is built
   * around. Success is the default: most of these confirm something that
   * worked, and the ones that don't say so at the call site.
   *
   * A second line in `message` becomes the subtitle, matching the component's
   * title-and-subtext variant.
   */
  const notify = (
    message: string,
    kind: "success" | "error" | "warning" | "info" = "success"
  ) => {
    const [title, ...rest] = message.split("\n");
    toast[kind](title, {
      duration: 5500,
      description: rest.length ? rest.join(" ") : undefined,
    });
  };
  useEffect(() => {
    init();
    setReady(true);
    try {
      const saved = sessionStorage.getItem(columnVisibilityKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const valid: Record<string, string[]> = {};
          for (const [companyId, values] of Object.entries(parsed)) {
            if (!Array.isArray(values)) continue;
            const known = columns.filter((c) => values.includes(c));
            if (known.length) valid[companyId] = known;
          }
          setVisibilityByCompany(valid);
        }
      }
      const pn = sessionStorage.getItem("inbox.pinned.v2");
      const storedPins: string[] = pn
        ? JSON.parse(pn).filter((c: unknown) => columns.includes(c as string))
        : DEFAULT_PINNED;
      setPinned(storedPins);
      const od = sessionStorage.getItem("inbox.order.v2");
      // Reconciled against the current column list rather than trusted: a
      // session stored before a column existed would otherwise drop it from the
      // table for good, since the order is what the grid renders from. Read
      // after the pins, because the pins decide what leads it.
      setOrder(normaliseOrder(od ? JSON.parse(od) : columns, storedPins));
      const ws = sessionStorage.getItem(
        `inbox.widths.v4:${encodeURIComponent(actor)}`
      );
      // Store only finite, bounded manual widths. Missing columns use defaults.
      if (ws) setWidths(readWidths(JSON.parse(ws)));
      const fs = sessionStorage.getItem("inbox.filters.v2");
      if (fs) {
        const v = JSON.parse(fs);
        // The stored shape changed when filters became multi-select; merging
        // over the defaults keeps an old session from crashing the screen.
        setFilters({ ...defaultFilters, ...(v.filters ?? {}) });
        // A session stored before the Exception tab became Duplicate lands on
        // Duplicate rather than silently on All — including the older sessions
        // that stored the status itself as the tab name.
        setTab(
          ["Exception", "Failed", "Duplicate"].includes(v.tab)
            ? "Duplicate"
            : v.tab === "Needs Review"
              ? "Need review"
              : tabs.includes(v.tab)
                ? v.tab
                : "All"
        );
      }
    } catch {}
    const handler = () =>
      toast(
        "Browser storage is full. Export the audit log and free space before continuing.",
        { duration: 5500 }
      );
    window.addEventListener("inbox-storage-error", handler);
    return () => window.removeEventListener("inbox-storage-error", handler);
  }, []);
  useEffect(() => {
    if (ready) {
      sessionStorage.setItem(
        columnVisibilityKey,
        JSON.stringify(visibilityByCompany)
      );
      sessionStorage.setItem("inbox.order.v2", JSON.stringify(order));
      sessionStorage.setItem("inbox.pinned.v2", JSON.stringify(pinned));
      if (!resizing)
        sessionStorage.setItem(
          `inbox.widths.v4:${encodeURIComponent(actor)}`,
          JSON.stringify(widths)
        );
      sessionStorage.setItem(
        "inbox.filters.v2",
        JSON.stringify({ filters, tab })
      );
    }
  }, [
    visibilityByCompany,
    order,
    pinned,
    widths,
    filters,
    tab,
    ready,
    resizing,
  ]);
  const resizeColumn = (column: string, value: number) => {
    setWidths((previous) => ({
      ...previous,
      ...colWidths,
      [column]: clampWidth(column, value),
    }));
  };
  const startResize = (column: string, event: React.PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    resizeCleanup.current?.();
    event.currentTarget.setPointerCapture(event.pointerId);
    const pointerId = event.pointerId;
    const before = widths;
    const frozen = { ...widths, ...colWidths };
    const startX = event.clientX;
    const startScroll = gridElement.current?.scrollLeft || 0;
    const oldCursor = document.body.style.cursor;
    const oldSelect = document.body.style.userSelect;
    let frame = 0;
    let latest = colWidth(column);
    setResizing(column);
    setWidths(frozen);
    const publish = () => {
      frame = 0;
      setWidths({ ...frozen, [column]: latest });
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      latest = clampWidth(
        column,
        frozen[column] +
          e.clientX -
          startX +
          (gridElement.current?.scrollLeft || 0) -
          startScroll
      );
      if (!frame) frame = requestAnimationFrame(publish);
    };
    const cleanup = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", key);
      window.removeEventListener("blur", cancel);
      document.body.style.cursor = oldCursor;
      document.body.style.userSelect = oldSelect;
      resizeCleanup.current = null;
    };
    const finish = (cancelled: boolean) => {
      cleanup();
      setWidths(cancelled ? before : { ...frozen, [column]: latest });
      setResizing(null);
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId === pointerId) finish(false);
    };
    const cancel = () => finish(true);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish(true);
      }
    };
    resizeCleanup.current = cleanup;
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", key);
    window.addEventListener("blur", cancel);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };
  /**
   * The "/" on the search field is a promise, so it has to be kept: while the
   * dropdown is open, "/" puts the caret in the column search. Guarded on the
   * event target, or typing a slash into any other field on the screen would
   * yank focus out from under it.
   */
  useEffect(() => {
    if (!columnsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.isContentEditable;
      if (e.key !== "/" || typing) return;
      e.preventDefault();
      columnSearchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [columnsOpen]);
  /**
   * Searching narrows the list, which makes "drop it here" meaningless — the
   * row above the gap may not be the row above it in the real order. So a
   * filtered list is read-only for ordering, and the grips come off.
   */
  const filteringColumns = columnSearch.trim().length > 0;
  const columnMatches = order.filter((c) =>
    c.toLowerCase().includes(columnSearch.trim().toLowerCase())
  );
  /**
   * Pinning moves the column to the back of the pinned block, so pins stack up
   * left to right in the order they were made. Unpinning leaves it exactly
   * where it is — which is the first unpinned slot, where the user last saw it.
   */
  const togglePin = (column: string) => {
    if (pinned.includes(column)) {
      setPinned((p) => p.filter((c) => c !== column));
      return;
    }
    const next = [...pinned, column];
    setPinned(next);
    setOrder((prev) => normaliseOrder(prev, next));
    // A pinned column cannot be hidden, so pinning a hidden one shows it.
    setVisible((v) => (v.includes(column) ? v : [...v, column]));
  };
  const toggleColumn = (column: string, on: boolean) => {
    if (!on && visible.length === 1) return;
    if (!on) setPinned((pins) => pins.filter((c) => c !== column));
    setVisible((v) => {
      if (on) return [...v, column];
      // A table with no columns is not a state worth being able to reach.
      const next = v.filter((c) => c !== column);
      return next.length ? next : v;
    });
  };
  const resetWidths = () => setWidths({});
  const resetColumns = () => {
    setPinned(DEFAULT_PINNED);
    setOrder(normaliseOrder(columns, DEFAULT_PINNED));
    setVisible(defaultColumns(state.company));
    setWidths({});
    setColumnSearch("");
  };
  /** Move `column` to slot `to`, clamped to the unpinned part of the list. */
  const moveColumn = (column: string, to: number) =>
    setOrder((prev) => {
      const from = prev.indexOf(column);
      const target = Math.min(Math.max(to, pinned.length), prev.length - 1);
      if (from < 0 || from === target || pinned.includes(column)) return prev;
      const next = [...prev];
      next.splice(target, 0, next.splice(from, 1)[0]);
      return next;
    });
  /** Row nodes, so a drag can work out which one the pointer is over. */
  const rowNodes = useRef(new Map<string, HTMLElement>());
  /**
   * Drag to reorder. The listeners go on `window` for the same reason the
   * column resize does it — a 28px grip is not something the pointer stays
   * inside once the drag has any speed to it.
   *
   * The order itself is not touched until the pointer comes up. Reordering the
   * array on every crossing is what made this feel abrupt: the row under the
   * cursor and the row being dragged swapped places in one frame, with nothing
   * in between. Instead the list holds still and the drag is expressed purely
   * as transforms — the dragged row tracks the pointer, the rows it has passed
   * slide one slot out of its way, and the array is rewritten once, at the end,
   * to the arrangement already on screen.
   */
  const startRowDrag = (column: string, event: React.PointerEvent) => {
    event.preventDefault();
    const height = rowNodes.current.get(column)?.offsetHeight ?? ROW_HEIGHT;
    const from = order.indexOf(column),
      startY = event.clientY,
      // The pinned block leads the list and nothing may land inside it.
      first = pinned.length,
      last = order.length - 1,
      list = columnList.current,
      startScroll = list?.scrollTop ?? 0;
    let to = from,
      dy = 0;
    setDrag({ key: column, from, to, dy, height, settling: false });
    const move = (e: PointerEvent) => {
      // Measured against the list's own scroll position, so a wheel mid-drag
      // moves the row with the list instead of leaving it behind.
      dy = e.clientY - startY + ((list?.scrollTop ?? 0) - startScroll);
      to = Math.min(Math.max(from + Math.round(dy / height), first), last);
      setDrag({ key: column, from, to, dy, height, settling: false });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
      // A tap on the grip that never moved: nothing to settle.
      if (to === from && Math.abs(dy) < 2) return setDrag(null);
      // Otherwise run the row from wherever the pointer left it to the exact
      // slot it is about to occupy, and only commit once it has landed there.
      // Committing straight from an arbitrary offset is the jump at the end.
      setDrag({
        key: column,
        from,
        to,
        dy: (to - from) * height,
        height,
        settling: true,
      });
      settleTimer.current = window.setTimeout(() => {
        moveColumn(column, to);
        setDrag(null);
      }, SETTLE_MS);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  };
  /**
   * The order also changes without a drag — pinning sends a row to the front,
   * an arrow key moves one a slot, Reset Default rearranges the lot — and every
   * one of those used to teleport. This animates them the same way the drag
   * does, by the old trick: measure where each row was, put it back there with
   * a transform the instant the new layout lands, then release it on the next
   * frame and let the transition carry it to its real place.
   *
   * No dependency array, because the previous positions have to stay current
   * through renders that move nothing — searching the list, for one. The
   * animation itself is gated on the order actually having changed.
   */
  const rowTops = useRef(new Map<string, number>());
  const layoutKey = `${order.join("|")}::${pinned.join("|")}`;
  const lastLayoutKey = useRef(layoutKey);
  useIsomorphicLayoutEffect(() => {
    const reordered = lastLayoutKey.current !== layoutKey;
    lastLayoutKey.current = layoutKey;
    const tops = rowTops.current;
    for (const [key, node] of rowNodes.current) {
      // Includes the row's own transform, which is what makes this agree with
      // the drag: a row settled into place has already been measured there, so
      // committing the order behind it moves nothing and animates nothing.
      const top = node.getBoundingClientRect().top;
      const was = tops.get(key);
      if (
        reordered &&
        !drag &&
        was !== undefined &&
        Math.abs(was - top) > 0.5
      ) {
        node.style.transition = "none";
        node.style.transform = `translateY(${was - top}px)`;
        requestAnimationFrame(() => {
          node.style.transition = `transform ${SETTLE_MS}ms ${EASE}`;
          node.style.transform = "translateY(0px)";
        });
      }
      tops.set(key, top);
    }
    // Closing the popover unmounts the rows; drop them, or reopening would
    // animate every row in from wherever it sat last time.
    for (const key of [...tops.keys()])
      if (!rowNodes.current.has(key)) tops.delete(key);
  });
  /**
   * Where a row sits while a drag is in flight. The dragged row follows the
   * pointer; every row between its old slot and its new one steps one place
   * towards the gap it left behind. Both are transforms, so nothing reflows and
   * the browser can keep the whole thing on the compositor.
   */
  const rowShift = (index: number, isDragged: boolean) => {
    if (!drag) return 0;
    if (isDragged) return drag.dy;
    if (drag.from < drag.to && index > drag.from && index <= drag.to)
      return -drag.height;
    if (drag.from > drag.to && index >= drag.to && index < drag.from)
      return drag.height;
    return 0;
  };
  /**
   * Content width of the grid scroller, measured rather than guessed at from a
   * breakpoint: the sidebar collapses and the preview pane opens and closes, so
   * the space left for the table has no fixed relationship to the viewport.
   * null until the client has measured, which keeps SSR on the natural width.
   */
  const [avail, setAvail] = useState<number | null>(null);
  const observer = useRef<ResizeObserver | null>(null);
  // A callback ref, not useRef + useEffect: the scroller lives inside the list
  // branch, so it mounts and unmounts as the detail view opens, and an effect
  // would need that branch's condition in its dep array to keep up.
  const gridRef = useCallback((el: HTMLDivElement | null) => {
    observer.current?.disconnect();
    observer.current = null;
    gridElement.current = el;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setAvail(el.clientWidth));
    ro.observe(el);
    observer.current = ro;
    setAvail(el.clientWidth);
  }, []);
  useEffect(() => () => observer.current?.disconnect(), []);
  /**
   * What the grid renders: the visible columns, in the order the user arranged
   * them. Everything downstream — widths, headers, cells — reads this, so the
   * two pieces of state can never disagree about the shape of the table.
   */
  const shown = useMemo(
    () => order.filter((c) => visible.includes(c)),
    [order, visible]
  );
  const colWidths = sizeColumns(shown, avail, widths);
  const colWidth = (c: string) => colWidths[c] ?? DEFAULT_WIDTHS[c];
  const tableWidth =
    SELECT_WIDTH + shown.reduce((sum, c) => sum + colWidth(c), 0);
  const company = companies.find((c) => c.id === state.company)!;
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const moduleRoute = routes.includes(router.query.module as Route)
    ? (router.query.module as Route)
    : undefined;
  const item = state.items.find(
    (x) => x.id === id && x.company === state.company
  );
  // Attempting to approve one voucher says nothing about the next, and
  // Approve & Next walks straight into it — so the marks come off at the door.
  useEffect(() => setAttempted(false), [id, item?.route]);
  /**
   * Whether this item is still a decision — the states that fall through to the
   * review surface below, rather than to an approved receipt, a delete notice,
   * an extraction spinner or a failure. "Post as" belongs to the header only
   * while the route is still the accountant's to change, so the same condition
   * that picks the review branch has to gate it up there too.
   */
  /**
   * Which approved record is open for editing. Approved means posted, so the
   * form is a record by default — this is the deliberate step back into it.
   */
  const [editingApproved, setEditingApproved] = useState<string | null>(null);
  const reviewable =
    !!item &&
    !["Approved", "Deleted", "Received", "Extracting", "Failed"].includes(
      item.status
    );
  /**
   * One document on screen means the shell goes: sidebar and top bar both. Any
   * detail view qualifies, not just the reviewable ones — an approved receipt
   * or a failed extraction is still a single document being read, and having
   * the chrome appear and disappear according to status would be worse than
   * either state on its own.
   */
  const fullScreen = !!id && !!item;
  // The duplicate's match target is a voucher from before the Inbox, not a
  // document in it — see `priorVoucher`. It stays openable by id; it just never
  // counts as one of the queue's rows.
  const all = state.items.filter(
    (x) => x.company === state.company && !x.priorVoucher
  );
  /**
   * Tally sync. Scoped to the route when the workspace is showing one module's
   * posted vouchers — that view is the Figma's "Accounts Payable - All Bills"
   * screen, and its Current Module is not a guess.
   */
  const sync = useTallySync({ items: all, route: moduleRoute ?? null });
  const searchInput = useRef<HTMLInputElement | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const filtered = useMemo(
    () =>
      all
        .filter((x) =>
          moduleRoute
            ? x.status === "Approved" && x.route === moduleRoute
            : matchesTab(x, tab)
        )
        // "See what failed" narrows to what Tally rejected on the last run. It
        // sits outside the filter panel because it is about the run, not about
        // the documents, and it clears itself when the next run starts.
        .filter((x) => !sync.reviewingFailures || sync.failedSyncIds.has(x.id))
        .filter(
          (x) =>
            (!filters.from || x.received.slice(0, 10) >= filters.from) &&
            (!filters.to || x.received.slice(0, 10) <= filters.to) &&
            (!filters.min || x.amount >= Number(filters.min)) &&
            (!filters.max || x.amount <= Number(filters.max)) &&
            Object.entries(filters.cols).every(
              ([column, values]) =>
                !values.length || values.includes(String(cellValue(x, column)))
            ) &&
            [x.file.name, x.form.party, x.sender, x.form.invoiceNo].some((s) =>
              s.toLowerCase().includes(filters.search.toLowerCase())
            )
        )
        .sort((a, b) => {
          if (!sort) return 0;
          const av = cellValue(a, sort.key),
            bv = cellValue(b, sort.key);
          const cmp =
            typeof av === "number" && typeof bv === "number"
              ? av - bv
              : String(av).localeCompare(String(bv), undefined, {
                  numeric: true,
                });
          return sort.dir === "asc" ? cmp : -cmp;
        }),
    [
      all,
      moduleRoute,
      tab,
      filters,
      sort,
      sync.reviewingFailures,
      sync.failedSyncIds,
    ]
  );

  /** The rows actually on screen — what a row index in the grid refers to. */
  const pageRows = useMemo(
    () => filtered.slice(page * pageSize, (page + 1) * pageSize),
    [filtered, page, pageSize]
  );
  /**
   * Everything on this company's books for the module being shown, in the
   * register's order — newest first, which is the order a register is read in.
   */
  const moduleItems = useMemo(
    () =>
      moduleRoute
        ? all
            .filter((x) => x.route === moduleRoute)
            .slice()
            .sort((a, b) => b.received.localeCompare(a.received))
        : [],
    [all, moduleRoute]
  );
  /** Where Tally stands on one voucher, in the register's four words. */
  const registerSyncState = (item: Item): RegisterSyncState =>
    sync.inFlightIds.has(item.id)
      ? "syncing"
      : sync.failedSyncIds.has(item.id)
        ? "failed"
        : sync.syncedIds.has(item.id)
          ? "synced"
          : "pending";
  /** Whether the selection has been widened past the page it started on. */
  const allFilteredSelected =
    !!filtered.length && filtered.every((x) => selected.includes(x.id));
  /**
   * What each reassignable field can be set to.
   *
   * Vendors and ledgers are read off the queue itself — the names in play are
   * the ones worth offering — while voucher types and registrations are fixed
   * lists. Same sources the drawer used; they moved, they did not change.
   */
  const bulkOptions = (field: BulkField): string[] => {
    if (field === "Voucher Type") return [...BULK_VOUCHER_TYPES];
    if (field === "GST Registration") return company.branches;
    return [
      ...new Set(
        field === "Vendor"
          ? all.map((x) => x.form.party)
          : [
              ...ledgerOptions,
              ...all.flatMap((x) => x.form.lines.map((line) => line.ledger)),
            ]
      ),
    ]
      .filter(Boolean)
      .sort();
  };

  /** Distinct values for a column, for the funnel and the panel. */
  const optionsFor = (column: string) =>
    [...new Set(all.map((x) => String(cellValue(x, column))))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((v) => ({ value: v, label: v }));

  const colFilter = (column: string) => filters.cols[column] ?? [];
  const setColFilter = (column: string, values: string[]) => {
    setFilters((f) => ({ ...f, cols: { ...f.cols, [column]: values } }));
    setPage(0);
    setSelected([]);
  };
  const toggleSort = (column: string) =>
    setSort((prev) =>
      prev?.key === column
        ? prev.dir === "asc"
          ? { key: column, dir: "desc" }
          : null
        : { key: column, dir: "asc" }
    );
  const activeFilterCount =
    Object.values(filters.cols).reduce((n, v) => n + (v?.length ?? 0), 0) +
    ["from", "to", "min", "max"].filter((k) => filters[k as keyof Filters])
      .length;
  const setFilter = (key: keyof typeof filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(0);
    setSelected([]);
  };
  const open = (x: Item) => {
    configure({ queue: filtered.map((x) => x.id) });
    event("Inbox Item Viewed", x, {
      ai_route: x.aiRoute,
      item_status: x.status,
    });
    void router.push(detailHref(x.id));
  };
  /**
   * Keyboard navigation. Mounted here rather than inside the table because the
   * entry points (`/`, `Shift+/`, `Alt+T`) are page-level: they have to work
   * before the grid has focus, which is the point of them.
   */
  const grid = useGridKeyboard({
    gridRef: gridElement,
    rowCount: pageRows.length,
    colCount: shown.length,
    onOpenShortcuts: () => setShortcutsOpen((v) => !v),
    onFocusSearch: () => searchInput.current?.focus(),
    onActivateRow: (row) => {
      const item = pageRows[row];
      if (item) open(item);
    },
    onSortColumn: (col) => {
      const column = shown[col];
      if (column && SORTABLE.has(column)) toggleSort(column);
    },
    onFilterColumn: (col) => {
      const column = shown[col];
      if (!column || !FILTERABLE.has(column)) return;
      // Click the funnel rather than lifting every popover into controlled
      // state: Radix already owns opening it, placing it and moving focus
      // inside, and a second source of truth for "is this one open" is how
      // two popovers end up open at once.
      gridElement.current
        ?.querySelector<HTMLButtonElement>(
          `[data-filter-trigger="${CSS.escape(column)}"]`
        )
        ?.click();
    },
  });

  /*
    Two different "next". Approve & Next is walking a review queue, so it skips
    to the next thing that still needs a decision. The pager's Next is walking
    the table you opened the record from, whatever those rows are — it used to
    hunt for a reviewable item too, so from an approved record it found none and
    dropped you back on the table instead of moving to the next approved file.
  */
  const nextItem = (reviewableOnly = false) => {
    if (!item) return;
    const queue = getState().queue;
    const ix = queue.indexOf(item.id);
    const ids = ix < 0 ? queue : queue.slice(ix + 1);
    const next = ids
      .map((id) =>
        getState().items.find((x) => x.id === id && x.company === state.company)
      )
      .find(
        (x) =>
          x &&
          (reviewableOnly
            ? ["Needs Review", "Duplicate"].includes(x.status)
            : x.status !== "Deleted")
      );
    void router.push(next ? detailHref(next.id) : "/inbox");
  };
  const approveItem = () => {
    if (!item) return;
    setAttempted(true);
    const error = approve(item.id);
    if (error) {
      /*
        Both of the forms the Inbox renders itself say their own faults in
        place — the journal's imbalance banner and its per-cell "Required
        Field", the invoice's marked income-ledger cells. Repeating those as a
        toast would put the same sentence in two places and point away from the
        cell that fixes it. Anything the form has no way to show still surfaces.
      */
      const shownOnForm = (
        {
          JV: [
            "Debit and credit totals don’t match.",
            "One line is missing its ledger or amount.",
          ],
          AR: ["Every line needs an income ledger."],
          AP: [],
        } as Record<Route, string[]>
      )[item.route].includes(error);
      if (!shownOnForm) notify(error, "error");
      return;
    }
    notify(
      `Approved ${getState().items.find((x) => x.id === item.id)?.form.voucherNo}.`
    );
    nextItem(true);
  };
  /**
   * Closing an edited posted voucher. The flag is raised on what actually
   * changed rather than on the act of opening the form, so re-reading a record
   * and closing it again leaves it alone.
   */
  const finishApprovedEdit = () => {
    if (!item) return;
    const current = getState().items.find((x) => x.id === item.id);
    setEditingApproved(null);
    if (!current) return;
    const changed =
      JSON.stringify(current.form) !== JSON.stringify(current.snapshot);
    if (!changed) {
      notify("Nothing changed, so there is nothing to sync.");
      return;
    }
    /*
      Only a voucher Tally already has can fall behind it. Approved-but-never-
      synced is not "edited after syncing" — it is still just waiting for its
      first run, and the cloud says so.
    */
    if (!sync.syncedIds.has(current.id)) {
      notify("Saved.");
      return;
    }
    if (!current.resyncNeeded) updatePosted(current.id, { resyncNeeded: true });
    /*
      No re-sync flow, and none is needed: the voucher goes back into the
      syncable pool, so the next ordinary run carries it exactly as it would a
      document that had never been across.
    */
    sync.markForResync(current.id);
    notify("Saved. Sync again to update Tally.", "warning");
  };
  const edit = (patch: Partial<Form>) => {
    if (!item) return;
    const next = {
      form: { ...item.form, ...patch },
      edited: [...new Set([...item.edited, ...Object.keys(patch)])],
      firstAttempt: false,
    };
    // A posted voucher only takes edits through the door it was opened with.
    if (approvedEditing) updatePosted(item.id, next);
    else update(item.id, next);
  };
  const matched = item ? hardMatch(item) : undefined;
  const reason = item ? issue(item) : "";
  const approvedEditing =
    !!item && item.status === "Approved" && editingApproved === item.id;
  // Paging to another record closes the one you had open for editing.
  useEffect(() => {
    if (editingApproved && editingApproved !== item?.id)
      setEditingApproved(null);
  }, [item?.id, editingApproved]);
  const canReview =
    item &&
    (["Needs Review", "Duplicate"].includes(item.status) || approvedEditing) &&
    state.permissions.includes(item.route);
  /**
   * Why Approve is unavailable, said to the person it stops.
   *
   * The button used to carry `issue()`'s own return value on a `title`, which
   * failed twice over. A disabled button receives no pointer events, so the
   * native tooltip never fires — the control was inert with no stated reason,
   * and on a hard-block duplicate that is the one thing the screen most owes
   * the accountant. And the strings themselves are the validator's labels,
   * not sentences: "Ledger required", "Not in Needs Review".
   *
   * The clauses mirror the button's own `disabled` expression exactly, in the
   * same order, so the two cannot drift into disagreeing about whether there
   * is anything to explain.
   *
   * A journal's own faults are NOT here. They disable nothing — the voucher
   * answers for them on the form, where the cell that fixes each one is, which
   * a tooltip on a button at the other end of the header cannot point at.
   */
  const blockReason =
    !item || !reviewable
      ? ""
      : !state.permissions.includes(item.route)
        ? `Your role can’t post to ${routeNames[item.route]}. Change the route above, or ask an administrator for access.`
        : matched
          ? `Same invoice number as ${matched.form.voucherNo} for ${item.form.party}. Change the vendor or the invoice number to approve.`
          : "";
  const deleteItem = () => {
    if (!item) return;
    remove(item.id);
    notify("Deleted. The file is kept — restore it from the Deleted tab.");
    nextItem();
  };
  // Production's sidebar entries map onto the three module views this
  // prototype actually has; the rest are real nav in the app but unbuilt here,
  // so they say so rather than routing into a 404.
  const NAV_TO_ROUTE: Record<string, Route> = {
    purchases: "AP",
    sales: "AR",
    // Both the group and its first child land on the same register, so
    // pressing Accounting opens what it contains rather than nothing.
    accounting: "JV",
    "journal-vouchers": "JV",
  };
  const ROUTE_TO_NAV: Record<Route, string> = {
    AP: "purchases",
    AR: "sales",
    // Journals sit under Accounting, which is a group — the entry that reads
    // as current is the child, not the parent.
    JV: "journal-vouchers",
  };
  const navId = moduleRoute ? ROUTE_TO_NAV[moduleRoute] : "inbox";
  const selectNav = (navItemId: string) => {
    if (navItemId === "inbox") {
      setFilters(defaultFilters);
      void router.push("/inbox");
      return;
    }
    if (navItemId === "dashboard") {
      setDialog("dashboard");
      return;
    }
    const route = NAV_TO_ROUTE[navItemId];
    if (route) {
      setFilters(defaultFilters);
      void router.push(`/inbox?module=${route}`);
      return;
    }
    notify("That screen is part of the app, but not this prototype.", "info");
  };
  const changeCompany = (value: string) => {
    configure({ company: value, queue: [] });
    setSelected([]);
    setFilters(defaultFilters);
    setTab("Need review");
    void router.push("/inbox");
  };
  const downloadAudit = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          state.events.filter((e) => e.company === state.company),
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = "inbox-audit.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  };
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const editTableField = (item: Item, field: BulkField, value: string) => {
    const result = applyBulkAction([item.id], field, value);
    if (!result.changed) {
      notify(
        Object.keys(result.reasons).join(" · ") ||
          "This voucher is posted. Use Edit entry to change it.",
        "error"
      );
      return false;
    }
    notify(`${field} updated.`);
    return true;
  };
  const canEditTableItem = (item: Item) =>
    !moduleRoute &&
    ["Needs Review", "Duplicate"].includes(item.status) &&
    state.permissions.includes(item.route);

  const reportBulk = (verb: string, result: BulkResult) => {
    const breakdown = Object.entries(result.reasons)
      .map(([reason, count]) => `${reason}: ${count}`)
      .join("; ");
    notify(
      `${verb} ${result.changed}. Skipped ${result.skipped}${breakdown ? ` — ${breakdown}.` : "."}`,
      result.skipped ? "warning" : "success"
    );
    setSelected([]);
  };
  const bulkApprove = () =>
    reportBulk("Approved", applyBulkAction(selected, "Approve"));
  /*
    Reassignment lands the moment a value is picked.

    It used to open a drawer per field — choose Vendor, search, select, press
    Apply to selected, close — four steps to set one value on rows that were
    already chosen. The bar holds the options itself now, so picking IS the
    action, and the toast is what reports it.
  */
  const applyBulk = (field: BulkField, value: string) =>
    reportBulk("Updated", applyBulkAction(selected, field, value));
  // First intake simulates the full dataset; later selections add one document.
  // Pass files directly: React state may still contain the previous selection.
  const addFiles = (
    incoming: FileList | null,
    intakeSource: Item["source"] = source
  ) => {
    const list = Array.from(incoming || []);
    if (!list.length || uploadLock.current) return;
    if (list.length > MAX_UPLOAD_FILES) {
      notify(`Upload up to ${MAX_UPLOAD_FILES} files at once.`, "warning");
      return;
    }
    if (intakeSource === "whatsapp" && !waRegistered) {
      notify(
        "This phone number is not registered on an AI Accountant account. Register your number before sending documents.",
        "warning"
      );
      return;
    }
    if (!state.permissions.length) {
      notify("You need posting access to upload. Ask an admin.", "error");
      return;
    }
    void upload(list.slice(0, 1), intakeSource);
  };
  const upload = async (
    selectedFiles: File[],
    intakeSource: Item["source"]
  ) => {
    const targetCompany =
      intakeSource === "whatsapp" ? state.waCompany : state.company;
    const firstUpload =
      !state.startedCompanies?.includes(targetCompany) &&
      !startedInboxCompanies.has(targetCompany);
    const samples = firstUpload ? demoUploadDocuments(targetCompany, 35) : [];
    const batch = [
      ...selectedFiles,
      ...samples.map((item) => ({
        name: item.file.name,
        size: (parseFloat(item.file.size) || 240) * 1024,
      })),
    ];
    /*
      Two of the demo documents fail on the way up, by default.

      An upload that has never once failed is not a thing anyone has watched:
      the interesting question this screen answers is what a batch looks like
      when part of it does not land, and a run that is always clean never asks
      it. The picks are positional rather than random so the same upload is the
      same demo twice, and they are spread — one early, one late — so the
      failure is seen arriving and seen surviving the rest of the run.

      Only samples fail. A file the user actually chose is theirs, and losing
      it to a simulation would be the prototype inventing a problem with their
      document.
    */
    const failAt = new Set(
      samples.length
        ? [
            selectedFiles.length + 3,
            selectedFiles.length + Math.floor(samples.length * 0.7),
          ]
        : []
    );

    const receivedIds: string[] = [];
    // Collected here as well as in state: the checks after the loop run in the
    // same tick as the last setState, which has not been applied yet.
    const failures: string[] = [];
    const landed: typeof samples = [];
    const dropped: typeof samples = [];
    uploadLock.current = true;
    setBusy(true);
    setFiles(batch);
    setUploadErrors([]);
    setUploadStatus(batch.map(() => "Queued"));
    setDialog("upload");
    let received = 0;
    try {
      for (const [index, file] of batch.entries()) {
        setUploadStatus((current) =>
          current.map((status, i) => (i === index ? "Uploading" : status))
        );
        let errors: string[];
        try {
          // Keep each transition visible in this prototype, even for tiny files.
          const [result] = await Promise.all([
            selectedFiles[index]
              ? ingest(
                  [selectedFiles[index]],
                  intakeSource,
                  intakeSource === "upload" ? actor : sender,
                  targetCompany,
                  { deferExtraction: true, receivedIds }
                )
              : Promise.resolve<string[]>([]),
            new Promise<void>((resolve) =>
              /*
                One steady beat per file. It used to be `100 + (index % 3) * 45`
                — a 100/145/190 cycle that made the bar stutter forward at three
                different speeds and read as random rather than as progress.
              */
              window.setTimeout(resolve, firstUpload ? 120 : 800)
            ),
          ]);
          errors = failAt.has(index)
            ? [`${file.name}: ${UPLOAD_FAILURE_REASON}`]
            : result;
        } catch (error) {
          errors = [`${file.name}: could not save file. ${String(error)}`];
        }
        if (!errors.length && selectedFiles[index]) received++;
        /*
          A document that did not finish uploading is not in the Inbox. It used
          to be published regardless, because nothing in the batch could fail —
          so the failure would have been a message about a row that was sitting
          in the table behind it.
        */
        const sample = samples[index - selectedFiles.length];
        if (sample) (errors.length ? dropped : landed).push(sample);
        failures.push(...errors);
        setUploadErrors((current) => [...current, ...errors]);
        setUploadStatus((current) =>
          current.map((status, i) =>
            i === index ? (errors.length ? "Failed" : "Uploaded") : status
          )
        );
      }
      if (received) {
        /*
          The handoff, in four beats.

          1  DWELL     the count lands on its final figure and the line under
                       it names where this is going. Without a pause the last
                       document settles and the dialog is already gone, so the
                       run has no ending — just a disappearance.
          2  CLOSE     the dialog plays its own 200ms exit.
          3  HAND OVER the table's entrance starts while the overlay is still
                       clearing, so the two overlap rather than leaving a gap
                       of bare screen between them. It used to start in the
                       same tick as the close, which ran the whole entrance
                       behind a dialog that had not finished leaving — by the
                       time you could see the table it had stopped moving.
          4  RESET     the panel's contents go last. Cleared any sooner and it
                       flips back to the empty drop zone mid-fade, so the last
                       thing seen on the way out is a screen asking for files.

          A failed run gets the same handoff. What it does not get is silence:
          the toast names the count, and the documents that did not make it are
          not in the table behind it.
        */
        const wait = (ms: number) =>
          new Promise<void>((resolve) => window.setTimeout(resolve, ms));

        setHandoff(true);
        await wait(DIALOG_DWELL_MS);

        beginUploadedExtraction(
          targetCompany,
          landed,
          receivedIds,
          dropped.map((item) => item.id)
        );
        startedInboxCompanies.add(targetCompany);
        configure({ tourDone: true });
        if (targetCompany === state.company) setKickstartPreview(false);
        setFilters(defaultFilters);
        setPage(0);
        setTab("All");
        setSort(null);
        setSelected([]);

        /*
          A run that lost documents keeps its panel.

          The table behind it is already live — the batch was published a few
          lines up — so the screen it is going to arrive at has arrived; it is
          just under the overlay. What stays open is the list naming what did
          not make it, and it closes when the reader closes it, not on a timer
          they did not set. Everything else is identical to a clean run, which
          is why only the dismissal differs here.
        */
        if (failures.length) {
          setHandoff(false);
          return;
        }

        setDialog("");
        window.setTimeout(() => setJustUploaded(true), DIALOG_EXIT_MS * 0.6);
        window.setTimeout(
          () => setJustUploaded(false),
          DIALOG_EXIT_MS + TABLE_ENTER_MS
        );
        window.setTimeout(() => {
          setFiles([]);
          setUploadStatus([]);
          setHandoff(false);
        }, DIALOG_EXIT_MS);
      }
    } finally {
      uploadLock.current = false;
      setBusy(false);
    }
  };
  const uploadedCount = uploadStatus.filter((s) => s === "Uploaded").length;
  /*
    The one reason every failure in this batch shares, or "" if they differ.

    Each entry in `uploadErrors` is "<file name>: <reason>", so the reason is
    what follows the first colon. When a batch fails the same way throughout —
    a dropped connection takes everything still in flight — printing that
    sentence under each filename is a column of identical grey text the eye
    stops reading, so it is said once in the heading instead. A mixed batch
    keeps its reasons on the rows, where they belong to a file.
  */
  const failureReasons = [
    ...new Set(
      uploadErrors.map((error) => error.slice(error.indexOf(": ") + 2).trim())
    ),
  ];
  const sharedFailureReason =
    failureReasons.length === 1 ? failureReasons[0] : "";
  /** This file's own reason, for a batch that failed more than one way. */
  const reasonFor = (name: string) => {
    const error = uploadErrors.find((entry) => entry.startsWith(`${name}:`));
    return error ? error.slice(error.indexOf(": ") + 2).trim() : "";
  };
  const failedCount = uploadStatus.filter((s) => s === "Failed").length;
  const settledCount = uploadedCount + failedCount;
  if (!ready)
    return (
      <div className="flex h-screen flex-col bg-background text-foreground">
        <p className={cn(T.value, "p-8")}>Loading Inbox…</p>
      </div>
    );
  const content = (
    <>
      <div className="flex h-full min-h-0 flex-col">
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {!state.permissions.length ? (
            <EmptyState title="Inbox access required">
              <p className={T.value}>
                Your role needs write access to Accounts Payable, Journal or
                Accounts Receivable. Ask an administrator for access.
              </p>
              <p className={T.sub}>
                Prototype permission-nudge treatment; final no-access behavior
                is pending product/security agreement.
              </p>
            </EmptyState>
          ) : id && !item ? (
            <EmptyState title="Item unavailable in this company">
              <Button
                variant="outline"
                className="text-primary"
                onClick={() => void router.push("/inbox")}
              >
                Back to Inbox
              </Button>
            </EmptyState>
          ) : item ? (
            <>
              {/* Document routing and status lead; navigation and actions sit on the right. */}
              <div
                className={cn(
                  band,
                  gutter,
                  "shrink-0 border-b border-neutral-gray bg-background py-3"
                )}
              >
                <PageButton
                  label="Back to Inbox"
                  disabled={false}
                  onClick={() => void router.push("/inbox")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </PageButton>
                {reviewable && (
                  <>
                    <Label
                      htmlFor="inbox-post-as"
                      className="whitespace-nowrap text-sm text-secondary-foreground"
                    >
                      Post as
                    </Label>
                    <Select
                      value={item.route}
                      onValueChange={(v) => setRoute(item.id, v as Route)}
                    >
                      <SelectTrigger
                        id="inbox-post-as"
                        aria-label="Post as"
                        title="Change where this document posts"
                        className={cn(
                          // rounded-md, which is 6px here: --radius is 0.5rem
                          // and md subtracts 2. Matches the back chevron.
                          "h-8 w-auto gap-1.5 rounded-md border-0 bg-accent px-3 shadow-none",
                          "text-sm font-semibold text-accent-foreground",
                          "hover:bg-muted focus:ring-0 focus-visible:ring-2 focus-visible:ring-ring",
                          "[&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:opacity-70"
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {routes
                          .filter((r) => state.permissions.includes(r))
                          .map((r) => (
                            <SelectItem key={r} value={r}>
                              {routeNames[r]}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {/*
                      The reason explains the AI's pick, so it comes off the
                      moment the pick is no longer what the screen shows. It
                      used to sit beside the new route and read as a
                      justification for it: "Accounts Receivable · Your company
                      is the buyer on this vendor invoice", which is an argument
                      for the opposite of what the chip beside it says.
                    */}
                    {item.reason && item.route === item.aiRoute && (
                      <span className={T.sub}>{item.reason}</span>
                    )}
                    {item.route !== item.aiRoute && (
                      <Pill tone="warn">
                        Overridden — AI suggested {routeNames[item.aiRoute]}
                      </Pill>
                    )}
                  </>
                )}
                {!reviewable && <StatusPill status={item.status} />}
                {/*
                  Where Tally stands on this voucher, as a marker rather than a
                  band across the screen. It replaced two full-width banners —
                  "Approved & posted" and "Editing a posted voucher" — that
                  between them said one thing the status pill beside this had
                  already said, and one thing this says on hover.
                */}
                {item.status === "Approved" && (
                  <SyncCloud
                    className="h-4 w-4"
                    side="bottom"
                    state={
                      sync.inFlightIds.has(item.id)
                        ? "syncing"
                        : sync.syncedIds.has(item.id)
                          ? "synced"
                          : // resyncNeeded is only ever raised on a voucher
                            // Tally had, so off the synced set it means the
                            // copy over there is the older one.
                            item.resyncNeeded
                            ? "stale"
                            : "pending"
                    }
                  />
                )}
                <span className="flex-1" />
                {/*
                  The pager reads as one object: arrows flanking the count they
                  move through, the count in the brand at full weight and the
                  arrows in it at low emphasis, so the position is what you read
                  and the controls are what you reach for.

                  Both arrows always render, the first disabled at the head of
                  the queue. Previous used to appear only past the first document,
                  which shifted Next sideways the moment you paged off it.
                */}
                <div className="flex items-center gap-1">
                  <PageButton
                    label="Previous document"
                    disabled={state.queue.indexOf(item.id) <= 0}
                    className="text-primary/40 hover:bg-accent hover:text-primary disabled:opacity-40"
                    onClick={() =>
                      void router.push(
                        detailHref(
                          state.queue[state.queue.indexOf(item.id) - 1]
                        )
                      )
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </PageButton>
                  <span className="whitespace-nowrap text-sm font-semibold text-primary">
                    {router.query.voucher ? "Voucher" : "Documents"}{" "}
                    {Math.max(0, state.queue.indexOf(item.id)) + 1} of{" "}
                    {state.queue.includes(item.id) ? state.queue.length : 1}
                  </span>
                  <PageButton
                    label="Next document"
                    // Wrapped, not passed: the click event is an argument, and
                    // a truthy one would put the pager back on the review-only
                    // walk this button is not doing.
                    disabled={
                      state.queue.indexOf(item.id) >= state.queue.length - 1
                    }
                    className="text-primary/40 hover:bg-accent hover:text-primary disabled:opacity-40"
                    onClick={() => nextItem()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </PageButton>
                </div>
                {/*
                  The actions, at the end of the row that already holds
                  everything else about this document. They had a docked bar of
                  their own along the bottom, which spent a full band of a
                  document-reading screen on two buttons and put the decision
                  as far from the pager as the window allowed.

                  Delete takes the slot Save draft held. Save draft is gone:
                  the sheet already writes a draft on every edit — that is what
                  the snapshot in the PRD v2 bridge does — so the button
                  promised an action that had already happened.
                */}
                {item.status !== "Deleted" && (
                  <>
                    {/*
                      A posted voucher opens as a record; this is the door into
                      the form, and Done editing is the same door closing. Both
                      used to be carried by a banner under this row, one button
                      on a band of its own.
                    */}
                    {item.status === "Approved" && !approvedEditing && (
                      <Button
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        disabled={!state.permissions.includes(item.route)}
                        onClick={() => setEditingApproved(item.id)}
                      >
                        Edit entry
                      </Button>
                    )}
                    <DangerButton onClick={deleteItem}>Delete</DangerButton>
                    {/* Last, where Approve & Next sits in review — the filled
                        button is the way out of the state you are in, and it
                        should not move between the two. */}
                    {approvedEditing && (
                      <Button
                        className="h-8 px-3 text-xs"
                        onClick={finishApprovedEdit}
                      >
                        Done editing
                      </Button>
                    )}
                    {reviewable && (
                      <BlockedReason reason={blockReason}>
                        <Button
                          // h-8/px-3 to sit level with Delete, the route chip
                          // and the pager: it stays the loudest thing in the
                          // row by being the only filled control, not by being
                          // taller.
                          className="h-8 px-3 text-xs"
                          /*
                            A journal's own faults no longer disable this. They
                            are answered on the form — the imbalance banner and
                            the per-cell "Required Field" marks — and a button
                            that cannot be pressed can never reveal them. What
                            still disables it is everything the form has no way
                            to say: no write access, and a hard-block duplicate.
                          */
                          disabled={!canReview || !!matched}
                          onClick={() => {
                            // Both embedded sheets defer to their own
                            // validation — pressing this presses their Create
                            // Bill / Create Invoice, which is what raises the
                            // unresolved-field summary on the form. JV has no
                            // sheet; it is validated by `issue` and answers on
                            // the inbox's own form.
                            if (item.route === "AP" || item.route === "AR")
                              sheetSend.current("approve");
                            else approveItem();
                          }}
                        >
                          Approve &amp; Next
                        </Button>
                      </BlockedReason>
                    )}
                  </>
                )}
              </div>
              {item.status === "Approved" && !approvedEditing ? (
                <>
                  {/*
                    No banner. "Approved & posted" restated the status pill in
                    the header, and its one piece of new information — whether
                    Tally has this copy — is the cloud up there beside the pill.
                    Edit entry went with it, into the action group.
                  */}
                  <div className="min-h-0 flex-1 overflow-auto bg-accent/30">
                    <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[minmax(280px,35%)_1fr]">
                      <div className="lg:sticky lg:top-0 lg:h-[calc(100vh-160px)]">
                        <Preview item={item} />
                      </div>
                      <div className="min-w-0 p-5 lg:pl-1">
                        {item.route === "JV" ? (
                          <JournalVoucher
                            item={item}
                            attempted={false}
                            readOnly
                            onEdit={() => {}}
                          />
                        ) : (
                          <ApprovedDetails item={item} company={company.name} />
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : item.status === "Deleted" ? (
                <EmptyState title="Deleted">
                  <p className={T.value}>
                    This document and its audit history are preserved.
                  </p>
                  <Button
                    variant="outline"
                    className="text-primary"
                    onClick={() => {
                      restore(item.id);
                      notify("Restored to the Inbox.");
                    }}
                  >
                    Restore item
                  </Button>
                </EmptyState>
              ) : ["Received", "Extracting"].includes(item.status) ? (
                <>
                  <EmptyState
                    title={
                      item.status === "Received"
                        ? `Queued: ${item.file.name}`
                        : `Extracting ${item.file.name}`
                    }
                    icon={<Spinner className="h-5 w-5" />}
                  >
                    <p className={T.value}>
                      {item.status === "Received"
                        ? "File received — extraction is about to start."
                        : "We’re parsing the document and predicting route and ledgers."}
                    </p>
                  </EmptyState>
                </>
              ) : item.status === "Failed" ? (
                <>
                  <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(280px,40%)_1fr]">
                    <Preview item={item} />
                    <section className="min-h-0 overflow-auto p-5 lg:pl-2">
                      <div className="mx-auto mt-4 max-w-xl overflow-hidden rounded-2xl border border-neutral-gray bg-background shadow-sm lg:mt-10">
                        <div className="space-y-5 p-7">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-gray bg-accent text-primary">
                            <FileWarning className="h-6 w-6" aria-hidden />
                          </div>
                          <div>
                            <p className="mb-2 text-label-3 font-medium uppercase tracking-widest text-secondary-foreground">
                              Extraction failed
                            </p>
                            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                              Let’s get this document ready
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-secondary-foreground">
                              We couldn’t read all the details. Try again, or
                              use the original document to complete them
                              yourself.
                            </p>
                          </div>
                          <div className="rounded-lg border border-neutral-gray bg-accent/40 p-4">
                            <h3 className="mb-1 text-sm font-semibold">
                              What we couldn’t read
                            </h3>
                            <p className="text-sm leading-6 text-secondary-foreground">
                              {item.error ||
                                item.original.failure?.body ||
                                "The document could not be read reliably. Check that its text and amounts are clearly visible."}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-5 border-t border-neutral-gray px-7 py-6">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="max-w-xs">
                              <h3 className="text-sm font-semibold">
                                Try reading the file again
                              </h3>
                              <p className="mt-1 text-xs leading-5 text-secondary-foreground">
                                Useful if extraction was interrupted.
                              </p>
                            </div>
                            <Button onClick={() => retry(item.id)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Retry extraction
                            </Button>
                          </div>
                          <div className="flex flex-wrap items-start justify-between gap-3 border-t border-neutral-gray pt-5">
                            <div className="max-w-xs">
                              <h3 className="text-sm font-semibold">
                                Enter the details yourself
                              </h3>
                              <p className="mt-1 text-xs leading-5 text-secondary-foreground">
                                Use the document alongside the voucher form.
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => manual(item.id)}
                            >
                              Fill manually
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 border-t border-neutral-gray px-7 py-4 text-xs leading-5 text-secondary-foreground">
                          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                          <span>
                            Your original document is preserved and stays
                            attached.
                          </span>
                        </div>
                      </div>
                    </section>
                  </div>
                </>
              ) : (
                <>
                  {/* Editing a posted voucher says so in the header — the
                      Approved pill, the cloud that turns amber once an edit
                      lands, and Done editing in the action group. It used to
                      take a banner to say the same three things. */}
                  {/* "Post as", its reason and the override flag now live in
                      the header row above, which is the only row this screen
                      has. The confidence percentage is gone with them: it
                      restated what the route and its reason already say. */}
                  {matched && (
                    <RecordBanner
                      tone="warning"
                      title="Duplicate invoice detected"
                      label="Approval blocked"
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 border-neutral-gray shadow-none"
                          onClick={() =>
                            void router.push(
                              detailHref(matched.id, "voucher=1")
                            )
                          }
                        >
                          View {matched.form.voucherNo}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      }
                    >
                      <span className="font-medium text-foreground">
                        {item.form.party} · {item.form.invoiceNo}
                      </span>{" "}
                      matches an existing voucher.
                      <span className="block">
                        Review the match, or correct the vendor or invoice
                        number below.
                      </span>
                    </RecordBanner>
                  )}
                  {item.softRef && (
                    <RecordBanner
                      tone="warning"
                      title="This file was uploaded before"
                      label="Review required"
                    >
                      Matches {item.softRef}. Check the earlier document before
                      approving.
                    </RecordBanner>
                  )}
                  {/*
                    Three layouts, and which one a route gets is decided by one
                    thing: whether its sheet draws the source document itself.

                    AP hands the whole width to its sheet, which is already a
                    document-beside-form split with its own splitter. Wrapping
                    it in a second split was what halved the form and tripped
                    its container query into folding every field into one
                    column.

                    AR's sheet has no document pane — standalone, an invoice is
                    raised rather than read off paper — but an inbox item always
                    has a file behind it, so the inbox supplies the preview and
                    the sheet takes the rest. Resizable rather than fixed,
                    because the invoice's Item Details table is 1702px of
                    columns and no fixed share is going to seat it.

                    JV uses the journal prototype beside a resizable source preview.
                    Its fields respond to the available pane width.

                    This is the rule hooks/pages/inbox/use-inbox-detail.ts
                    already encodes as `isTwoPane`; that module drives
                    components/inbox/detail, which this workspace replaced.
                  */}
                  {item.route === "JV" ? (
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="min-h-0 flex-1"
                    >
                      <ResizablePanel
                        defaultSize={32}
                        minSize={18}
                        className="min-w-0"
                      >
                        <Preview item={item} />
                      </ResizablePanel>
                      <ResizableHandle withHandle />
                      <ResizablePanel
                        defaultSize={68}
                        minSize={40}
                        className="min-w-0"
                      >
                        <div className="h-full min-w-0 overflow-auto">
                          <JournalVoucher
                            key={`${item.id}-${item.route}`}
                            item={item}
                            attempted={attempted}
                            readOnly={!canReview}
                            onEdit={edit}
                          />
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  ) : item.route === "AR" ? (
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="min-h-0 flex-1"
                    >
                      <ResizablePanel
                        defaultSize={32}
                        minSize={18}
                        className="min-w-0"
                      >
                        <Preview item={item} />
                      </ResizablePanel>
                      <ResizableHandle withHandle />
                      <ResizablePanel
                        defaultSize={68}
                        minSize={40}
                        className="flex min-w-0 flex-col"
                      >
                        <InvoiceSheet
                          key={`${item.id}-${item.route}`}
                          item={item}
                          allowEdits={approvedEditing}
                          onApproved={approveItem}
                          onReady={(send) => {
                            sheetSend.current = send;
                          }}
                        />
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  ) : (
                    <div className="flex min-h-0 flex-1 flex-col">
                      <Sheet
                        key={`${item.id}-${item.route}`}
                        item={item}
                        allowEdits={approvedEditing}
                        onApproved={approveItem}
                        onReady={(send) => {
                          sheetSend.current = send;
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          ) : !moduleRoute && (!all.length || kickstartPreview) ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-auto overscroll-none">
              {/* No page title on the empty state — the headline is the title. */}
              <InboxKickstart
                key={company.id}
                companyName={company.name}
                email={`${company.slug}@inbox.aiaccountant.app`}
                maxFiles={MAX_UPLOAD_FILES}
                onCopy={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${company.slug}@inbox.aiaccountant.app`
                    );
                    notify(
                      "Forwarding address copied. Paste it into your email client."
                    );
                    return true;
                  } catch {
                    notify(
                      "Couldn’t copy the address. Select it and copy manually.",
                      "error"
                    );
                    return false;
                  }
                }}
                onWhatsApp={() => setDialog("whatsapp")}
                onUpload={(incoming) => {
                  setSource("upload");
                  setSender(actor);
                  setUploadErrors([]);
                  setFiles([]);
                  setUploadStatus([]);
                  if (incoming) addFiles(incoming, "upload");
                  setDialog("upload");
                }}
              />
            </div>
          ) : moduleRoute ? (
            /*
              Purchases, Sales and Journal Vouchers are registers of posted
              records, not the document queue with a filter on it — see
              ./register. The Inbox's table stays behind for the Inbox.
            */
            <Register
              /*
                Keyed by route: the three registers are the same element in the
                tree, so without this the tab and page you left Purchases on
                came with you to Sales — and "Needs Review" is not even one of
                the tabs Sales has.
              */
              key={moduleRoute}
              route={moduleRoute}
              items={moduleItems}
              syncState={registerSyncState}
              selected={selected}
              onSelectedChange={setSelected}
              onOpen={(x) => {
                configure({ queue: moduleItems.map((row) => row.id) });
                void router.push(
                  detailHref(
                    x.id,
                    x.status === "Approved" ? "voucher=1" : undefined
                  )
                );
              }}
              onDelete={(x) => {
                remove(x.id);
                notify(`Deleted ${x.form.voucherNo || x.file.name}.`);
              }}
              onUnbuilt={(what) =>
                notify(
                  `${what} is part of the app, but not this prototype.`,
                  "info"
                )
              }
              search={filters.search}
              onSearchChange={(value) => setFilter("search", value)}
              /*
                The register's filters ride on the workspace's own filter
                state, so leaving a module and coming back finds the register
                as you left it — and Reset Filters is the one control that
                clears both screens' idea of "filtered".
              */
              filters={{
                party: registerParty,
                from: filters.from,
                to: filters.to,
                min: filters.min,
                max: filters.max,
              }}
              onFilterChange={(key, value) =>
                key === "party"
                  ? setRegisterParty(value)
                  : setFilter(key, value)
              }
              onResetFilters={() => {
                setFilters(defaultFilters);
                setRegisterParty("");
              }}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              pageSizes={PAGE_SIZES}
            />
          ) : (
            <>
              {/* Controls stay outside the table's two-axis scroll area. */}
              {/* The positioning context the floating selection bar hangs off.
                  It wraps the scroller rather than sitting inside it, so the
                  bar stays put while the rows move under it. */}
              <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
                {/* The page's scroller, and the only one on this view. It used to
                  sit on the table region alone, which pinned the title, tabs and
                  filter strip in place and scrolled the rows underneath them —
                  a grid inside a page rather than a page. Moved up here the
                  whole column scrolls, and the table header's `sticky top-0`
                  now resolves against this box, so the header rides up with the
                  rows and stops at the top of the content area.

                  Both axes, deliberately: a sticky header cannot survive an
                  `overflow-x` ancestor of its own — the x scroller would become
                  the scrollport the header sticks to — so the horizontal scroll
                  a widened table needs has to live on this same element. The
                  controls below stay pinned horizontally. Disable native
                  overscroll as well: containment alone still allows the native
                  edge bounce to expose blank space during trackpad scrolling. */}
                <div
                  className={cn(
                    "flex min-h-0 min-w-0 flex-1 flex-col overflow-auto overscroll-none",
                    /*
                      Picks up where the dialog left off: the table rises into
                      place instead of being there the instant the modal is
                      gone. It starts while the overlay is still clearing —
                      see the handoff sequence in `upload` — so the two read as
                      one movement handing over, not as a cut between screens.

                      Transform and opacity only, on the enter curve, and a
                      little longer than the dialog's exit so the table is
                      still arriving as the last of the overlay goes.
                    */
                    justUploaded &&
                      "animate-in fade-in-0 slide-in-from-bottom-3 duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none"
                  )}
                >
                  {/* Title, tabs and strip pinned against the horizontal scroll as ONE
                  block. They have to live inside this scroller to scroll away
                  vertically, and the scroller owns both axes because a sticky
                  table header cannot survive an `overflow-x` ancestor of its
                  own — so they need `left-0` to hold still while the table
                  moves under them. One sticky layer rather than three: each one
                  is a separate thing for the compositor to keep in place per
                  frame, and three of them lagged visibly during a drag, showing
                  a sliver of unpainted background at the right before catching
                  up. Keep this block on its own compositor layer so it stays
                  painted in place during asynchronous horizontal scrolling. */}
                  <div className="sticky left-0 z-20 shrink-0 bg-background will-change-transform">
                    <PageTopBar
                      className={cn(
                        "shrink-0 flex-wrap gap-2 pb-3 pt-5",
                        gutter
                      )}
                      title={
                        moduleRoute
                          ? `${routeNames[moduleRoute]} · Posted vouchers`
                          : "Inbox"
                      }
                      primaryText={moduleRoute ? undefined : "Upload Documents"}
                      primaryIcon={Upload}
                      onPrimaryButtonClick={() => {
                        setSource("upload");
                        setSender(actor);
                        setUploadErrors([]);
                        setFiles([]);
                        setUploadStatus([]);
                        setDialog("upload");
                      }}
                    />
                    {!moduleRoute &&
                      all.some((item) =>
                        ["Received", "Extracting"].includes(item.status)
                      ) && (
                        <div
                          role="status"
                          className="mx-6 mb-3 flex items-center gap-2 rounded-md border border-neutral-gray bg-accent/40 px-3 py-2 text-sm text-secondary-foreground"
                        >
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          Extracting{" "}
                          {
                            all.filter((item) =>
                              ["Received", "Extracting"].includes(item.status)
                            ).length
                          }{" "}
                          documents. Results appear automatically as each
                          document is ready.
                        </div>
                      )}
                    {!moduleRoute && (
                      <Tabs
                        value={tab}
                        onValueChange={(t) => {
                          setTab(t);
                          setPage(0);
                          setSelected([]);
                        }}
                        className="mx-6 shrink-0 overflow-x-auto border-b border-neutral-gray"
                      >
                        <TabsList className="h-auto gap-2 rounded-none bg-transparent p-0">
                          {tabs.map((t) => (
                            <TabsTrigger
                              key={t}
                              value={t}
                              className="gap-2 rounded-none border-b-2 border-transparent px-2.5 py-3 text-sm text-secondary-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none"
                            >
                              {t}
                              <CountPill>
                                {all.filter((x) => matchesTab(x, t)).length}
                              </CountPill>
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    )}
                    <div
                      className={cn(band, gutter, "shrink-0 flex-wrap py-3")}
                    >
                      <div className="relative w-full sm:w-[198px]">
                        <Input
                          ref={searchInput}
                          aria-label="Search Inbox"
                          // 198px and "Search..." per Figma 716:15029. The long
                          // placeholder the box used to carry named the fields it
                          // covers; at this width it only truncates, so what it
                          // searches is the aria-label's job now.
                          placeholder="Search..."
                          value={filters.search}
                          onChange={(e) => setFilter("search", e.target.value)}
                          className={cn("h-8 pr-9", T.cell, "text-foreground")}
                        />
                        {/* The key that gets you here, shown where you would look
                        for it (Figma 24142:49994). It hides once there is text
                        in the box, where it would read as part of the query. */}
                        {!filters.search && (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md bg-section"
                          >
                            <Slash className="h-3 w-3 text-secondary-foreground" />
                          </span>
                        )}
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          {/* Icon-only, 32x32 (Figma 716:15029). The count rides on
                          it as a corner badge rather than inline: without the
                          "Filters" label there is nothing else on the bar that
                          says filters are applied, and a strip with two of them
                          set would otherwise look identical to a clean one. */}
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={
                              activeFilterCount
                                ? `Filters, ${activeFilterCount} applied`
                                : "Filters"
                            }
                            title="Filters"
                            className="relative h-8 w-8 shrink-0 text-primary"
                          >
                            <ListFilter className="h-4 w-4" />
                            {activeFilterCount ? (
                              <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-caption-1 font-semibold tabular-nums text-primary-foreground">
                                {activeFilterCount}
                              </span>
                            ) : null}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="w-auto overflow-hidden p-0"
                        >
                          <FilterPanel
                            categories={[
                              ...[...FILTERABLE].map((column) => ({
                                id: column,
                                label: column,
                                options: optionsFor(column),
                                selected: colFilter(column),
                                onChange: (next: string[]) =>
                                  setColFilter(column, next),
                                activeCount: colFilter(column).length,
                              })),
                              // Date and Amount are two categories, not one. They
                              // are answers to different questions — "what came in
                              // last week" and "what is over ₹1L" — and pairing
                              // them hid whichever one you were not there for.
                              ...(
                                [
                                  [
                                    "Date",
                                    [
                                      ["from", "Received from", "date"],
                                      ["to", "Received to", "date"],
                                    ],
                                  ],
                                  [
                                    "Amount",
                                    [
                                      ["min", "Minimum amount", "number"],
                                      ["max", "Maximum amount", "number"],
                                    ],
                                  ],
                                ] as const
                              ).map(([label, fields]) => ({
                                id: label,
                                label,
                                activeCount: fields.filter(
                                  ([key]) => filters[key as keyof Filters]
                                ).length,
                                custom: (
                                  <div className="flex flex-col gap-4">
                                    {fields.map(([key, fieldLabel, type]) => (
                                      <Field
                                        key={key}
                                        label={fieldLabel}
                                        htmlFor={`filter-${key}`}
                                      >
                                        <Input
                                          id={`filter-${key}`}
                                          type={type}
                                          value={filters[key]}
                                          onChange={(e) =>
                                            setFilter(key, e.target.value)
                                          }
                                        />
                                      </Field>
                                    ))}
                                  </div>
                                ),
                              })),
                            ]}
                          />
                        </PopoverContent>
                      </Popover>
                      {/* The rule separates the two things that open panels from
                      the two that answer a question in place (Figma
                      716:15029). */}
                      <span className="h-6 w-px flex-none bg-neutral-gray" />
                      {QUICK_FILTERS.map((column) => (
                        <QuickFilter
                          key={column}
                          label={column}
                          options={optionsFor(column)}
                          selected={colFilter(column)}
                          onChange={(next) => setColFilter(column, next)}
                        />
                      ))}
                      {/* Set by "See what failed" on a partial or failed run, and
                      the only way out is to dismiss it — it is not one of the
                      filters, so Reset Filters must not silently take it off. */}
                      {sync.reviewingFailures && (
                        <Button
                          variant="secondary"
                          className="h-8 gap-2"
                          onClick={sync.clearFailureReview}
                        >
                          Didn&rsquo;t reach Tally
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <span className="flex-1" />
                      {/*
                    Reset sits with Columns at the end of the bar, not with the
                    filters it clears (Figma 24415:71283). Ghost, because it is
                    an undo: it only matters once something has been set, and a
                    bordered button competing with Columns would read as a third
                    filter rather than the way out of the first two.
                  */}
                      {/* Only once there is something to undo — `resetFilters` is a
                      prop on the Figma component, not a fixture. The search box
                      counts: Reset clears it too, so a bar that showed nothing
                      to reset and then wiped the query would be lying. */}
                      {(activeFilterCount > 0 || filters.search) && (
                        <Button
                          variant="ghost"
                          // Red per Figma 716:15029, which asks for
                          // status-error-text-700 (#a80f0f). Taking the project's
                          // --destructive-foreground (#C11212) instead: that token is
                          // the AA-corrected one, and hardcoding the frame's hex
                          // would put a sixth unmanaged status red in the file.
                          className={cn(
                            "h-[29px] gap-2 px-0 hover:bg-transparent",
                            T.value,
                            "text-destructive-foreground hover:text-destructive-foreground"
                          )}
                          onClick={() => {
                            setFilters(defaultFilters);
                            setSelected([]);
                            setPage(0);
                          }}
                        >
                          <Undo2 className="h-3 w-3" />
                          Reset Filters
                        </Button>
                      )}
                      <Popover
                        open={columnsOpen}
                        onOpenChange={(next) => {
                          setColumnsOpen(next);
                          if (!next) setColumnSearch("");
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            // px-[15px] and 12px grey text: it names a panel rather
                            // than performing an action, so it does not take the
                            // brand (Figma 24156:151930).
                            className={cn(
                              "h-8 gap-2 px-[15px]",
                              T.cell,
                              "text-muted-foreground"
                            )}
                          >
                            <Columns3 className="h-4 w-4" />
                            Columns
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="end"
                          className="w-[340px] p-0"
                          // The grid behind the popover is the preview, so a drag
                          // that leaves the panel must not read as "dismiss".
                          onPointerDownOutside={(e) =>
                            dragging && e.preventDefault()
                          }
                        >
                          <div className="space-y-2.5 px-3 pb-2.5 pt-3">
                            <p className="text-sm font-semibold text-foreground">
                              Columns
                            </p>
                            <div className="relative">
                              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-foreground" />
                              <Input
                                ref={columnSearchRef}
                                aria-label="Search columns"
                                placeholder="Search…"
                                className="h-9 pl-8 pr-10"
                                value={columnSearch}
                                onChange={(e) =>
                                  setColumnSearch(e.target.value)
                                }
                              />
                              <Kbd className="absolute right-2 top-1/2 -translate-y-1/2">
                                /
                              </Kbd>
                            </div>
                          </div>
                          {/*
                        The list holds every column, hidden ones included: the
                        order is a property of the column and not of the current
                        selection, so unchecking something and checking it again
                        has to put it back where you left it.
                      */}
                          <div
                            ref={columnList}
                            className="max-h-[330px] overflow-y-auto border-y border-neutral-gray py-1"
                          >
                            {columnMatches.length === 0 ? (
                              <p className={cn(T.sub, "px-3 py-8 text-center")}>
                                No column matches “{columnSearch.trim()}”.
                              </p>
                            ) : (
                              columnMatches.map((c, i) => {
                                const locked = pinned.includes(c);
                                const checked = visible.includes(c);
                                const isDragged = drag?.key === c;
                                return (
                                  <div
                                    key={c}
                                    ref={(node) => {
                                      if (node) rowNodes.current.set(c, node);
                                      else rowNodes.current.delete(c);
                                    }}
                                    style={{
                                      transform: `translateY(${rowShift(i, isDragged)}px)`,
                                      // The dragged row is pinned to the pointer, so
                                      // it must not ease — easing a value that is
                                      // already being updated every frame just adds
                                      // lag. Everything else eases, and so does the
                                      // dragged row once it is settling into place.
                                      transition:
                                        isDragged && !drag?.settling
                                          ? "none"
                                          : `transform ${SETTLE_MS}ms ${EASE}`,
                                      willChange: drag
                                        ? "transform"
                                        : undefined,
                                    }}
                                    className={cn(
                                      "relative flex items-center gap-2.5 px-3 py-2",
                                      isDragged
                                        ? // Lifted off the list: opaque, so the rows
                                          // sliding under it stay hidden, and above
                                          // them in the stacking order.
                                          "z-10 rounded-md bg-background shadow-lg ring-1 ring-neutral-gray"
                                        : !drag && "hover:bg-accent/60"
                                    )}
                                  >
                                    {locked || filteringColumns ? (
                                      // Holds the grip's place so every label starts
                                      // on the same x, draggable row or not.
                                      <span className="h-4 w-4 flex-none" />
                                    ) : (
                                      <button
                                        type="button"
                                        aria-label={`Reorder ${c}`}
                                        onPointerDown={(e) =>
                                          startRowDrag(c, e)
                                        }
                                        // Arrow keys do the same job for anyone not
                                        // using a pointer: a drag handle with no
                                        // keyboard equivalent makes the order
                                        // unreachable, not just awkward.
                                        onKeyDown={(e) => {
                                          if (
                                            e.key !== "ArrowUp" &&
                                            e.key !== "ArrowDown"
                                          )
                                            return;
                                          e.preventDefault();
                                          moveColumn(
                                            c,
                                            order.indexOf(c) +
                                              (e.key === "ArrowDown" ? 1 : -1)
                                          );
                                        }}
                                        className="flex-none cursor-grab touch-none rounded text-secondary-foreground hover:text-foreground active:cursor-grabbing"
                                      >
                                        <GripVertical className="h-4 w-4" />
                                      </button>
                                    )}
                                    <Checkbox
                                      id={`col-${c}`}
                                      checked={checked}
                                      disabled={checked && visible.length === 1}
                                      onCheckedChange={(next) =>
                                        toggleColumn(c, !!next)
                                      }
                                    />
                                    <Label
                                      htmlFor={`col-${c}`}
                                      className={cn(
                                        "flex-1 truncate text-sm font-normal",
                                        locked
                                          ? "text-foreground"
                                          : "cursor-pointer",
                                        !locked &&
                                          !checked &&
                                          "text-secondary-foreground"
                                      )}
                                    >
                                      {c}
                                    </Label>
                                    <button
                                      type="button"
                                      onClick={() => togglePin(c)}
                                      aria-label={
                                        locked ? `Unpin ${c}` : `Pin ${c}`
                                      }
                                      aria-pressed={locked}
                                      title={
                                        locked
                                          ? "Unpin — lets the column be reordered"
                                          : "Pin — moves the column to the front"
                                      }
                                      className={cn(
                                        "flex-none rounded p-0.5",
                                        locked
                                          ? "text-primary"
                                          : "text-secondary-foreground hover:text-foreground"
                                      )}
                                    >
                                      {locked ? (
                                        <PinOff className="h-4 w-4" />
                                      ) : (
                                        <Pin className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                          <div className="flex items-center px-1.5 py-1.5">
                            <Button
                              variant="ghost"
                              className="flex-1 gap-2 text-secondary-foreground"
                              onClick={resetWidths}
                            >
                              <RotateCcw className="h-4 w-4" />
                              Reset widths
                            </Button>
                            <Button
                              variant="ghost"
                              className="flex-1 gap-2 text-secondary-foreground"
                              onClick={resetColumns}
                            >
                              <RotateCcw className="h-4 w-4" />
                              Reset Default
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                      {/*
                    The shortcuts drawer, opened from its own button at the end
                    of the toolbar (Figma 24156:151931). Controlled, because
                    Shift+/ opens it too and a panel that only its trigger could
                    open would make the shortcut a lie.
                  */}
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Keyboard shortcuts"
                        title="Keyboard shortcuts"
                        className="h-8 w-8 text-primary"
                        onClick={() => setShortcutsOpen(true)}
                      >
                        <Keyboard className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {/*
                  table-fixed, not the default table-auto: under auto layout a
                  set width is only a hint, and a long filename would widen its
                  column back out the moment you let go of the handle.
                */}
                  <div
                    ref={gridRef}
                    role="grid"
                    aria-label="Inbox documents"
                    aria-rowcount={pageRows.length + 1}
                    aria-colcount={shown.length}
                    // One tab stop for the whole grid, with the cursor moved by
                    // the arrow keys — the roving pattern. The cell itself never
                    // takes DOM focus; activedescendant is what tells a screen
                    // reader which one the cursor is on.
                    tabIndex={0}
                    aria-activedescendant={grid.activeDescendant}
                    onKeyDown={grid.onGridKeyDown}
                    // No scrolling of its own any more — the column above owns it.
                    // Left as a focusable region because the grid's keyboard
                    // navigation is bound here.
                    // The active cell already draws the keyboard focus ring.
                    // Ringing this horizontally scrollable wrapper produced a
                    // full-height blue line at the viewport edge, which looked
                    // like a broken column divider when keyboard mode started.
                    className="min-w-0 focus-visible:outline-none"
                  >
                    <Table
                      style={{ width: tableWidth }}
                      // role="none" on the table, role="grid" on the div that
                      // holds the focus and the cursor. Two nested grid-ish
                      // roles would make the rows belong to the inner one, and
                      // the inner one is not what aria-activedescendant is on.
                      // The rows and cells below re-declare their roles because
                      // role="none" here drops the implicit ones with it.
                      role="none"
                      className="table-fixed border-separate border-spacing-0 [&_td]:border-b [&_td]:border-r [&_td]:border-neutral-gray [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-neutral-gray [&_th:last-child]:border-r-0"
                    >
                      <TableHeader
                        role="rowgroup"
                        className="sticky top-0 z-10 bg-[#fbfbfe] [&_tr]:shadow-none [&_th]:border-b [&_th]:border-t [&_th]:border-neutral-gray"
                      >
                        <TableRow role="row" aria-rowindex={1}>
                          <TableHead
                            role="columnheader"
                            style={{ width: SELECT_WIDTH }}
                            className="h-10 px-3 py-0 align-middle"
                          >
                            {/* This page, and only this page. Reaching across
                              pages is what the bar's "Select all" button is
                              for, because it is a different claim and has to
                              be made on purpose. */}
                            <Checkbox
                              aria-label="Select every document on this page"
                              checked={
                                !!pageRows.length &&
                                pageRows.every((x) => selected.includes(x.id))
                              }
                              onCheckedChange={(checked) =>
                                setSelected(
                                  checked ? pageRows.map((x) => x.id) : []
                                )
                              }
                            />
                          </TableHead>
                          {shown.map((c) => (
                            <TableHead
                              key={c}
                              role="columnheader"
                              id={gridCellId(-1, shown.indexOf(c))}
                              aria-colindex={shown.indexOf(c) + 1}
                              // Absent, not "none", when the column is not
                              // sortable: aria-sort on a column that cannot be
                              // sorted offers the user a control that is not
                              // there.
                              aria-sort={
                                !SORTABLE.has(c)
                                  ? undefined
                                  : sort?.key !== c
                                    ? "none"
                                    : sort.dir === "asc"
                                      ? "ascending"
                                      : "descending"
                              }
                              style={{ width: colWidth(c) }}
                              // Row -1 is the header in the grid's coordinate
                              // space, so arrowing up out of the first value
                              // lands on the column that names it.
                              data-grid-row={-1}
                              data-grid-col={shown.indexOf(c)}
                              // 40px tall, pl-3 / pr-2 (Figma 24421:72539).
                              //
                              // py-0 and a fixed h-10 rather than the spec's
                              // py-3: the row is the max of its cells, so any one
                              // cell with a tall control in it grows all of them
                              // past 40. Height-then-centre pins the box and puts
                              // the same 12px above and below a 16px line.
                              //
                              // Dividers come from the rules on <Table>.
                              className={cn(
                                "relative h-10 whitespace-nowrap py-0 pl-3 pr-2 align-middle",
                                T.head,
                                grid.isCursor(-1, shown.indexOf(c)) &&
                                  "ring-2 ring-inset ring-primary"
                              )}
                            >
                              <div
                                className={cn(
                                  // h-4: the 40px header is 12 + 16 + 12, so the
                                  // content row has to be exactly one 16px line.
                                  // The icon buttons overflow it on purpose —
                                  // they keep a 16px hit area without growing the
                                  // cell (Figma 24421:72539).
                                  "flex h-4 min-w-0 items-center gap-1",
                                  c === "Amount" && "justify-end"
                                )}
                              >
                                <span className="truncate" title={c}>
                                  {c}
                                </span>
                                {SORTABLE.has(c) ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleSort(c)}
                                    aria-label={`Sort by ${c}`}
                                    className="grid h-5 w-5 flex-none place-items-center rounded-md hover:bg-muted"
                                  >
                                    {sort?.key === c ? (
                                      sort.dir === "asc" ? (
                                        <ArrowUp className="h-3 w-3 text-primary" />
                                      ) : (
                                        <ArrowDown className="h-3 w-3 text-primary" />
                                      )
                                    ) : (
                                      <ArrowUpDown className="h-3 w-3 text-secondary-foreground" />
                                    )}
                                  </button>
                                ) : null}
                                {FILTERABLE.has(c) ? (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button
                                        type="button"
                                        // Space on the header cell finds the
                                        // funnel through this.
                                        data-filter-trigger={c}
                                        aria-label={`Filter ${c}`}
                                        className={cn(
                                          "grid h-5 w-5 flex-none place-items-center rounded-md hover:bg-muted",
                                          colFilter(c).length
                                            ? "text-primary"
                                            : "text-secondary-foreground"
                                        )}
                                      >
                                        <ListFilter className="h-3 w-3" />
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      align="start"
                                      className="w-auto p-0"
                                    >
                                      <ColumnFilter
                                        label={c}
                                        options={optionsFor(c)}
                                        selected={colFilter(c)}
                                        onChange={(v) => setColFilter(c, v)}
                                      />
                                    </PopoverContent>
                                  </Popover>
                                ) : null}
                              </div>
                              {RESIZABLE.has(c) ? (
                                // Sits over the cell's right border. Double-click
                                // puts the column back to its default width.
                                <span
                                  role="separator"
                                  aria-orientation="vertical"
                                  aria-label={`Resize ${c}`}
                                  tabIndex={0}
                                  aria-valuemin={COLUMN_SIZES[c].min}
                                  aria-valuemax={COLUMN_SIZES[c].max}
                                  aria-valuenow={colWidth(c)}
                                  aria-valuetext={`${colWidth(c)} pixels`}
                                  title={`${colWidth(c)} px · Drag or use arrow keys to resize. Double-click or Enter to reset.`}
                                  onPointerDown={(e) => startResize(c, e)}
                                  onDoubleClick={() => {
                                    if (Object.keys(widths).length)
                                      resizeColumn(c, DEFAULT_WIDTHS[c]);
                                  }}
                                  onKeyDown={(e) => {
                                    const step = e.shiftKey ? 40 : 10;
                                    const next =
                                      e.key === "ArrowRight"
                                        ? colWidth(c) + step
                                        : e.key === "ArrowLeft"
                                          ? colWidth(c) - step
                                          : e.key === "Home"
                                            ? COLUMN_SIZES[c].min
                                            : e.key === "End"
                                              ? COLUMN_SIZES[c].max
                                              : e.key === "Enter"
                                                ? DEFAULT_WIDTHS[c]
                                                : null;
                                    if (next !== null) {
                                      e.preventDefault();
                                      resizeColumn(c, next);
                                    }
                                  }}
                                  className={cn(
                                    "group absolute top-0 z-20 flex h-full w-[10px] cursor-col-resize touch-none items-stretch justify-center focus-visible:outline-none",
                                    c === shown[shown.length - 1]
                                      ? "right-0"
                                      : "-right-[5px]"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "w-[2px] transition-colors group-hover:bg-primary group-focus-visible:bg-primary",
                                      resizing === c
                                        ? "bg-primary"
                                        : "bg-transparent"
                                    )}
                                  />
                                </span>
                              ) : null}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody role="rowgroup">
                        {pageRows.map((x, rowIndex) => (
                          <TableRow
                            key={x.id}
                            role="row"
                            // +2, not +1: row 1 is the header.
                            aria-rowindex={rowIndex + 2}
                            aria-selected={selected.includes(x.id)}
                            onClick={() => open(x)}
                            className="cursor-pointer"
                          >
                            <TableCell
                              role="gridcell"
                              onClick={(e) => e.stopPropagation()}
                              className="h-[50px] px-3 py-0 align-middle"
                            >
                              <Checkbox
                                aria-label={`Select ${x.file.name}`}
                                checked={selected.includes(x.id)}
                                onCheckedChange={(checked) =>
                                  setSelected((ids) =>
                                    checked
                                      ? [...ids, x.id]
                                      : ids.filter((id) => id !== x.id)
                                  )
                                }
                              />
                            </TableCell>
                            {shown.map((c, colIndex) => (
                              <TableCell
                                key={c}
                                role="gridcell"
                                id={gridCellId(rowIndex, colIndex)}
                                aria-colindex={colIndex + 1}
                                // The range, not the checkbox column: this is
                                // "inside the copied block", which is a
                                // different question from whether the row is
                                // ticked for a bulk action.
                                aria-selected={grid.isSelected(
                                  rowIndex,
                                  colIndex
                                )}
                                data-grid-row={rowIndex}
                                data-grid-col={colIndex}
                                // Figma 603:1640 / 603:1658: both variants are 50px.
                                // The fixed inner box caps intrinsic table height;
                                // a height on <td> alone is only a minimum.
                                className={cn(
                                  "h-[50px] overflow-hidden px-3 py-0 align-middle",
                                  T.cell,
                                  // Range first, cursor second: the cursor sits
                                  // inside its own selection and has to win.
                                  grid.isSelected(rowIndex, colIndex) &&
                                    "bg-accent",
                                  grid.isCursor(rowIndex, colIndex) &&
                                    "ring-2 ring-inset ring-primary"
                                )}
                              >
                                <div className="flex h-[49px] min-w-0 flex-col justify-center overflow-hidden [&>.inline-flex]:self-start">
                                  {c === "File" ? (
                                    <div className="flex min-w-0 items-center gap-2.5">
                                      <FileIcon ext="pdf" />
                                      <div className="min-w-0">
                                        <span className="flex min-w-0 items-center gap-1.5">
                                          <strong
                                            className="truncate font-medium text-primary"
                                            title={x.file.name}
                                          >
                                            {x.file.name}
                                          </strong>
                                          {/* Whether Tally has this one yet. */}
                                          {sync.inFlightIds.has(x.id) ? (
                                            <SyncCloud state="syncing" />
                                          ) : sync.syncedIds.has(x.id) ? (
                                            <SyncCloud state="synced" />
                                          ) : null}
                                        </span>
                                        <span className="mt-1 block truncate text-caption-1 font-medium text-secondary-foreground">
                                          {x.file.size}
                                        </span>
                                      </div>
                                    </div>
                                  ) : c === "Source" ? (
                                    <div className="min-w-0 space-y-1">
                                      <div className="flex min-w-0 items-center gap-1.5">
                                        <Pill
                                          className={cn(
                                            tablePillClass,
                                            "shrink-0"
                                          )}
                                          title={sourceLabels[x.source]}
                                        >
                                          {sourceLabels[x.source]}
                                        </Pill>
                                        <span
                                          className="min-w-0 truncate"
                                          title={x.sender}
                                        >
                                          {x.sender || "—"}
                                        </span>
                                      </div>
                                      {x.source === "email" && (
                                        <p
                                          className="truncate text-caption-1 font-medium text-secondary-foreground"
                                          title={`→ ${x.routingAddress}`}
                                        >
                                          → {x.routingAddress}
                                        </p>
                                      )}
                                    </div>
                                  ) : ["Received", "Extracting"].includes(
                                      x.status
                                    ) &&
                                    [
                                      "Vendor",
                                      "Voucher type",
                                      "AI Route",
                                      "GST Registration",
                                      "Amount",
                                    ].includes(c) ? (
                                    <span className="text-secondary-foreground">
                                      —
                                    </span>
                                  ) : c === "Vendor" ? (
                                    <EditableCell
                                      onClosed={grid.refocusGrid}
                                      label={
                                        x.route === "AR"
                                          ? "Customer name"
                                          : "Vendor name"
                                      }
                                      open={activeCell === `${x.id}:party`}
                                      onOpenChange={(open) =>
                                        setActiveCell(
                                          open ? `${x.id}:party` : null
                                        )
                                      }
                                      value={x.form.party}
                                      options={all
                                        .filter(
                                          (candidate) =>
                                            candidate.route === x.route
                                        )
                                        .map(
                                          (candidate) => candidate.form.party
                                        )
                                        .filter(Boolean)
                                        .sort()}
                                      editable={canEditTableItem(x)}
                                      onChange={(value) =>
                                        editTableField(x, "Vendor", value)
                                      }
                                    />
                                  ) : c === "Voucher type" ? (
                                    <EditableCell
                                      onClosed={grid.refocusGrid}
                                      label="Voucher type"
                                      open={
                                        activeCell === `${x.id}:voucherType`
                                      }
                                      onOpenChange={(open) =>
                                        setActiveCell(
                                          open ? `${x.id}:voucherType` : null
                                        )
                                      }
                                      value={x.form.voucherType}
                                      options={BULK_VOUCHER_TYPES}
                                      editable={canEditTableItem(x)}
                                      onChange={(value) =>
                                        editTableField(x, "Voucher Type", value)
                                      }
                                    />
                                  ) : c === "AI Route" ? (
                                    // max-w-full and a truncating child, so a
                                    // column narrower than the route name ellipses
                                    // the text inside an intact pill instead of
                                    // slicing the pill's ground off at the border.
                                    // This is what lets the floor sit under the
                                    // widest label rather than on top of it.
                                    <Pill
                                      className={cn(
                                        tablePillClass,
                                        "max-w-full"
                                      )}
                                      maxWidth="100%"
                                      title={aiRouteLabels[x.aiRoute]}
                                    >
                                      <span className="min-w-0 truncate">
                                        {aiRouteLabels[x.aiRoute]}
                                      </span>
                                    </Pill>
                                  ) : c === "GST Registration" ? (
                                    <EditableCell
                                      onClosed={grid.refocusGrid}
                                      label="GST registration"
                                      open={activeCell === `${x.id}:gst`}
                                      onOpenChange={(open) =>
                                        setActiveCell(
                                          open ? `${x.id}:gst` : null
                                        )
                                      }
                                      value={x.form.gst}
                                      options={company.branches}
                                      editable={canEditTableItem(x)}
                                      onChange={(value) =>
                                        editTableField(
                                          x,
                                          "GST Registration",
                                          value
                                        )
                                      }
                                    />
                                  ) : c === "Amount" ? (
                                    <div
                                      className="truncate text-right tabular-nums"
                                      title={money(x.amount)}
                                    >
                                      {money(x.amount)}
                                    </div>
                                  ) : c === "Received" ? (
                                    <div
                                      className="space-y-1 font-medium"
                                      title={stamp(x.received)}
                                    >
                                      <time
                                        dateTime={x.received}
                                        className="block truncate text-xs"
                                      >
                                        {stamp(x.received)}
                                      </time>
                                      <span className="block truncate text-caption-1 font-medium text-secondary-foreground">
                                        {age(x.received)}
                                      </span>
                                    </div>
                                  ) : (
                                    <StatusPill
                                      status={x.status}
                                      className={tablePillClass}
                                    />
                                  )}
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {!filtered.length &&
                      /*
                    Three different nothings, and they used to be one.

                    A narrowed queue is the only one of them the user can undo,
                    so it is the only one that carries an action — and it has to
                    be tested first, because a filter that excludes everything
                    looks exactly like an empty tab from the row count alone.

                    Then the company that has never received a document: the
                    state of the whole queue rather than of the tab in front of
                    it, so Needs Review and Duplicate both say the same true
                    thing and point at the channels.

                    Everything else is a tab that is legitimately empty, which
                    is a fact and not a prompt.
                  */
                      (() => {
                        const narrowed =
                          activeFilterCount > 0 || !!filters.search;
                        if (narrowed)
                          return (
                            <EmptyState title="No documents match these filters">
                              <p className={T.value}>
                                {tab === "All"
                                  ? "Nothing in the Inbox matches."
                                  : `Nothing in ${tab} matches. Another tab may hold what you’re looking for.`}
                              </p>
                              <Button
                                variant="outline"
                                className="text-primary"
                                onClick={() => {
                                  setFilters(defaultFilters);
                                  setSelected([]);
                                  setPage(0);
                                }}
                              >
                                Reset all
                              </Button>
                            </EmptyState>
                          );
                        if (moduleRoute)
                          return (
                            <EmptyState
                              title={`No posted ${routeNames[moduleRoute]} vouchers`}
                            >
                              <p className={T.value}>
                                Approving a document in the Inbox with this
                                route posts the voucher and lists it here.
                              </p>
                            </EmptyState>
                          );
                        if (!all.length)
                          return (
                            <EmptyState title="Nothing received yet">
                              <p className={T.value}>
                                Forward a document to this company’s address,
                                send one from a registered WhatsApp number, or
                                upload a file. Every document lands in the Inbox
                                first.
                              </p>
                              <Button
                                variant="outline"
                                className="text-primary"
                                onClick={() => setDialog("intake")}
                              >
                                Receive documents
                              </Button>
                            </EmptyState>
                          );
                        // `tab` is restored from sessionStorage unchecked, so a
                        // session stored under a tab name that no longer exists
                        // would index this to undefined and take the screen down.
                        const empty = EMPTY_STATES[tab] ?? EMPTY_STATES.All;
                        return (
                          <EmptyState title={empty.title}>
                            <p className={T.value}>{empty.body}</p>
                          </EmptyState>
                        );
                      })()}
                  </div>
                </div>
                {/*
                Over the table, not under it.

                The bar used to be `sticky bottom-0` inside this column, which
                is a row of layout however few rows are selected — the table
                gave up a band of itself to hold it. Absolute inside the
                relative wrapper, it floats above the last rows instead, and
                the wrapper takes no pointer events so the rows behind it stay
                reachable everywhere the bar is not.
              */}
                {selected.length > 0 && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-4">
                    <div
                      role="toolbar"
                      aria-label="Selected document actions"
                      className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-primary/30 bg-background px-4 py-3 text-foreground shadow-xl"
                    >
                      <strong className="whitespace-nowrap py-2 pr-1 text-sm font-semibold">
                        {selected.length}{" "}
                        {selected.length === 1 ? "document" : "documents"}{" "}
                        selected
                      </strong>
                      {/*
                      The checkbox in the header speaks for the page it is on;
                      this speaks for the filter. Two different claims, so two
                      different controls — a header checkbox that silently
                      reached across pages was the more dangerous of them.
                    */}
                      {filtered.length > pageRows.length && (
                        <Button
                          variant="outline"
                          size="sm"
                          // Taken reads as a pressed state, not as a second
                          // primary: Approve is the only filled button on this
                          // bar and a rival for it would blunt both.
                          className={cn(
                            "whitespace-nowrap text-primary",
                            allFilteredSelected && "border-primary bg-accent"
                          )}
                          onClick={() =>
                            setSelected(
                              allFilteredSelected
                                ? pageRows.map((x) => x.id)
                                : filtered.map((x) => x.id)
                            )
                          }
                        >
                          {allFilteredSelected && (
                            <Check className="h-4 w-4" aria-hidden />
                          )}
                          {allFilteredSelected ? "Selected all" : "Select all"}{" "}
                          {filtered.length}
                        </Button>
                      )}
                      <span
                        aria-hidden
                        className="h-6 w-px flex-none bg-neutral-gray"
                      />
                      {BULK_FIELDS.map((field) => (
                        <BulkReassign
                          key={field}
                          field={field}
                          options={bulkOptions(field)}
                          onPick={(value) => applyBulk(field, value)}
                        />
                      ))}
                      <Button size="sm" onClick={bulkApprove}>
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                      <BulkButton
                        onClick={() => {
                          reportBulk(
                            "Deleted",
                            applyBulkAction(selected, "Delete")
                          );
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </BulkButton>
                      {tab === "Deleted" && (
                        <BulkButton
                          onClick={() => {
                            selected.forEach(restore);
                            setSelected([]);
                          }}
                        >
                          Restore
                        </BulkButton>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Clear selection"
                        onClick={() => setSelected([])}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <Footer>
                <div className="flex items-center gap-2">
                  <span className={cn(T.cell, "text-foreground")}>
                    Rows per page:
                  </span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v));
                      setPage(0);
                    }}
                  >
                    <SelectTrigger
                      aria-label="Rows per page"
                      className={cn(
                        "h-auto w-[72px] rounded-md border-border px-2 py-1",
                        T.cell,
                        "text-foreground"
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-0 sm:gap-1">
                  <PageButton
                    label="First page"
                    disabled={page === 0}
                    onClick={() => setPage(0)}
                  >
                    <ChevronsLeft />
                  </PageButton>
                  <PageButton
                    label="Previous page"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft />
                  </PageButton>
                  <span
                    className={cn(T.cell, "px-2 tabular-nums text-foreground")}
                  >
                    {filtered.length
                      ? `${page * pageSize + 1} - ${Math.min((page + 1) * pageSize, filtered.length)} of ${filtered.length}`
                      : "0 of 0"}
                  </span>
                  <PageButton
                    label="Next page"
                    disabled={(page + 1) * pageSize >= filtered.length}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight />
                  </PageButton>
                  <PageButton
                    label="Last page"
                    disabled={(page + 1) * pageSize >= filtered.length}
                    onClick={() =>
                      setPage(
                        Math.max(0, Math.ceil(filtered.length / pageSize) - 1)
                      )
                    }
                  >
                    <ChevronsRight />
                  </PageButton>
                </div>
              </Footer>
            </>
          )}
        </main>
      </div>
      <PageDialog
        open={!state.tourDone && !kickstartPreview}
        title={
          [
            "Your review queue has moved",
            "Receive documents in one place",
            "Review the AI route",
            "Approve with an audit trail",
          ][tour]
        }
        description={
          [
            "Bill review now lives in Inbox. Accounts Payable keeps posted bills only. Your open bills are in Needs Review.",
            "Forward email, send from a registered WhatsApp number, or upload files. Each company has its own queue.",
            "Check Accounts Payable, Journal or Accounts Receivable. You can change the route before approving.",
            "Approve & Next follows your filtered queue. Approved records are read-only and retain their source file.",
          ][tour]
        }
      >
        <div className={cn(band, "mt-6")}>
          <span className={T.sub}>Step {tour + 1} of 4</span>
          <span className="flex-1" />
          {tour > 0 && (
            <Button
              variant="outline"
              className="text-primary"
              onClick={() => setTour((t) => t - 1)}
            >
              Back
            </Button>
          )}
          <Button
            onClick={() =>
              tour === 3 ? configure({ tourDone: true }) : setTour((t) => t + 1)
            }
          >
            {tour === 3 ? "Start reviewing" : "Next"}
          </Button>
        </div>
      </PageDialog>
      <PageDialog
        open={dialog === "intake" || dialog === "whatsapp"}
        title={
          dialog === "whatsapp" ? "Send via WhatsApp" : "Receive documents"
        }
        onClose={() => setDialog("")}
      >
        {dialog !== "whatsapp" && (
          <>
            <section className="space-y-3">
              <h2 className={T.section}>Forward by email</h2>
              <p className={T.value}>
                Each attachment becomes one Inbox item. Sender and subject are
                retained.
              </p>
              <div className={band}>
                <code className="rounded-md border border-neutral-gray bg-section px-2.5 py-1.5 text-xs text-foreground">
                  {company.slug}@inbox.aiaccountant.app
                </code>
                <Button
                  variant="outline"
                  className="text-primary"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      `${company.slug}@inbox.aiaccountant.app`
                    );
                    notify("Forwarding address copied.");
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className={T.sub}>
                Local demonstration. Production address provisioning uses a
                random suffix.
              </p>
              <Button
                variant="outline"
                className="text-primary"
                onClick={() => {
                  configure({
                    emailSuffix: {
                      ...state.emailSuffix,
                      [company.id]: crypto.randomUUID(),
                    },
                  });
                  notify(
                    "Demo forwarding address regenerated. Production email provisioning requires the backend."
                  );
                }}
              >
                Regenerate address (admin)
              </Button>
            </section>
            <Separator className="my-6 bg-neutral-gray" />
          </>
        )}
        <section className="space-y-3">
          {dialog !== "whatsapp" && (
            <h2 className={T.section}>Send via WhatsApp</h2>
          )}
          <Select value={environment} onValueChange={setEnvironment}>
            <SelectTrigger
              aria-label="WhatsApp environment"
              className="h-9 w-[180px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Production">Production</SelectItem>
              <SelectItem value="UAT">UAT</SelectItem>
            </SelectContent>
          </Select>
          <p className={cn(T.value, "text-foreground")}>
            {environment === "Production"
              ? "+91 63665 75567"
              : "+91 81233 89976"}
          </p>
          <p className={T.value}>
            Only phone numbers registered on an AI Accountant account can send
            documents. For multiple companies, choose a company on the first
            document. The selection persists until you send a company-switch
            message; it does not expire.
          </p>
          <div className={band}>
            <Button
              variant="outline"
              className="text-primary"
              onClick={() => {
                setSource("whatsapp");
                setSender("+91 90000 00001");
                setFiles([]);
                setUploadStatus([]);
                setUploadErrors([]);
                setDialog("upload");
              }}
            >
              Try WhatsApp intake
            </Button>
            <Button
              variant="outline"
              className="text-primary"
              onClick={() => {
                setSource("email");
                setSender("vendor@example.com");
                setFiles([]);
                setUploadStatus([]);
                setUploadErrors([]);
                setDialog("upload");
              }}
            >
              Try email intake
            </Button>
          </div>
        </section>
      </PageDialog>
      <PageDialog
        open={dialog === "upload"}
        /*
          The title carries the state, so the body no longer has to: "Bulk
          upload" plus a count plus a sentence saying the same thing was three
          lines for one fact.
        */
        title={
          source !== "upload"
            ? `Demo ${source} intake`
            : !files.length
              ? "Upload documents"
              : settledCount < files.length
                ? `Uploading ${files.length} document${files.length === 1 ? "" : "s"}`
                : failedCount
                  ? `Uploaded ${uploadedCount} of ${files.length}`
                  : "Upload complete"
        }
        // The formats and the cap moved into the drop zone, where they are read
        // at the moment of choosing rather than above the thing being chosen.
        // What stays here is the one rule that sends you somewhere else — and
        // only while you are still choosing, since it cannot act on it after.
        description={
          files.length
            ? undefined
            : "Bank and credit card statements belong in Banking reconciliation, not the Inbox."
        }
        /*
          Closing is what ends a finished run. The batch is cleared here rather
          than when the run stops, because on a failed run the list of what did
          not make it is the reason the panel is still open — clearing it with
          the dialog still up would empty the thing being read.
        */
        onClose={() => {
          if (busy) return;
          setDialog("");
          window.setTimeout(() => {
            setFiles([]);
            setUploadStatus([]);
            setUploadErrors([]);
            setHandoff(false);
          }, DIALOG_EXIT_MS);
        }}
      >
        <div className="space-y-4">
          {source !== "upload" && (
            <Field label="Sender" htmlFor="intake-sender">
              <Input
                id="intake-sender"
                disabled={busy}
                value={sender}
                onChange={(e) => setSender(e.target.value)}
              />
            </Field>
          )}
          {source === "whatsapp" && (
            <>
              <Label className="flex cursor-pointer items-center gap-2.5 text-sm font-normal">
                <Checkbox
                  checked={waRegistered}
                  disabled={busy}
                  onCheckedChange={(checked) => setWaRegistered(!!checked)}
                />
                Number is registered on an AI Accountant account
              </Label>
              <Field label="Company (persists until changed)">
                <Select
                  value={state.waCompany}
                  disabled={busy}
                  onValueChange={(v) => configure({ waCompany: v })}
                >
                  <SelectTrigger aria-label="WhatsApp company" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}
          {/*
            A label wrapping a visually-hidden input, so the whole panel is the
            control: the browser's own file button is the one element on this
            screen the design system cannot reach, and dressing it with `file:`
            pseudo-elements left a native widget sitting inside a designed one.
            Hidden rather than `display:none` — a hidden input keeps its place
            in the tab ring, and the label's focus-within is what shows it.
          */}
          {!files.length && (
            <>
              {/*
                The drop zone, at the size it is worth: a tall dashed field with
                the icon and the rules side by side, rather than a thin strip of
                centred text. Built from the bulk upload frame.
              */}
              <label
                className={cn(
                  uploadStyles.dropZone,
                  dragOver && uploadStyles.dragging
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  addFiles(e.dataTransfer.files);
                }}
              >
                <span className={uploadStyles.artwork} aria-hidden="true">
                  <span className={uploadStyles.paperBack} />
                  <span className={uploadStyles.paper}>
                    <FilePlus2 size={25} strokeWidth={1.4} />
                    <i />
                    <i />
                  </span>
                  <span className={uploadStyles.uploadBadge}>
                    <Upload size={18} />
                  </span>
                </span>
                <span className={uploadStyles.dropTitle}>
                  {dragOver ? (
                    "Release to add your documents"
                  ) : (
                    <>Drag your documents here</>
                  )}
                </span>
                <span className={uploadStyles.browse}>
                  or{" "}
                  <span>
                    browse files <ArrowRight size={13} />
                  </span>
                </span>
                <span className={uploadStyles.formats}>
                  <span>PDF</span>
                  <span>JPG</span>
                  <span>PNG</span>
                  <span className={uploadStyles.limit}>
                    Up to {MAX_UPLOAD_MB} MB
                  </span>
                </span>
                <input
                  aria-label="Choose documents"
                  type="file"
                  disabled={busy}
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    // Cleared so re-picking the same file fires change again —
                    // otherwise removing a file and choosing it back does nothing.
                    e.target.value = "";
                  }}
                  className="sr-only"
                />
              </label>
              {/*
                What the reader needs to know before they choose, not after
                they are wrong: what it can read, what it reads best, where the
                limit is and how long it takes.
              */}
              <section
                aria-label="Upload guidelines"
                className={uploadStyles.guidelines}
              >
                <h3 className={uploadStyles.guidelinesTitle}>
                  <Lightbulb className="h-4 w-4" aria-hidden />A few tips for a
                  smooth upload
                </h3>
                <ul className={uploadStyles.tips}>
                  {UPLOAD_GUIDELINES.map((line) => (
                    <li key={line} className={uploadStyles.tip}>
                      <span aria-hidden className={uploadStyles.tipDot} />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
          {files.length > 0 && (
            <section className="space-y-3">
              {/*
                The same drawing the Tally sync run uses: a count that is the
                headline, and the documents themselves naming what has landed.
                A batch of files going across one at a time is one event, so it
                gets one shape wherever it happens.
              */}
              {/*
                The headline counts what landed, not what finished.

                Settled would have the bar full and the number level with the
                total on a run that lost two documents — a complete-looking
                count over an error list. Uploaded is the figure the title and
                the toast use, so all three agree, and the gap between it and
                the total is the failure, visible without reading anything.
              */}
              <UploadAnimation
                uploaded={uploadedCount}
                total={files.length}
                failed={failedCount}
                active={busy}
              />
              {/* The list still follows every settle, a failure included — it
                  is the row in flight it is chasing, not the count.

                  Fixed height rather than max-height: growing to fit the first
                  four rows moved the panel's bottom edge — and everything
                  under it — four times in the first half-second of a run. The
                  box is the size it will end up at from the first frame. */}
              {/*
                While it runs, every document. Once it has stopped with
                failures, only those.

                The running list is what you watch; a finished one is a wall of
                green ticks with the two rows that matter scrolled somewhere
                inside it. A count alone ("2 failed") names none of them, which
                leaves the reader to work out what is missing from a table of
                thirty-four.

                The running list is pinned at 180px so it cannot grow under the
                reader mid-run. This one is not: the run has stopped, two
                failures are two rows, and holding the taller box open would be
                180px of empty panel below them.
              */}
              {busy || !failedCount ? (
                <RunRowList
                  className="h-[180px]"
                  settled={settledCount}
                  rows={files.map((f, i) => {
                    const status = uploadStatus[i] || "Queued";
                    return {
                      id: `${f.name}-${f.size}-${i}`,
                      label: f.name,
                      state:
                        status === "Uploaded"
                          ? "done"
                          : status === "Failed"
                            ? "failed"
                            : status === "Uploading"
                              ? "active"
                              : "queued",
                    };
                  })}
                />
              ) : (
                <section
                  aria-label="Documents that did not upload"
                  className="max-h-[180px] overflow-y-auto rounded-lg border border-neutral-gray"
                >
                  <h3 className="sticky top-0 border-b border-neutral-gray bg-background px-3 py-2 text-xs font-semibold text-foreground">
                    {failedCount} didn’t upload
                    {/* One reason for the whole batch is said once. Repeating
                        the same sentence under every filename is a column of
                        identical grey text that the eye stops reading. */}
                    {sharedFailureReason ? (
                      <span className="font-normal text-secondary-foreground">
                        {" — "}
                        {sharedFailureReason}
                      </span>
                    ) : null}
                  </h3>
                  <ul>
                    {files.map((f, i) =>
                      uploadStatus[i] === "Failed" ? (
                        <li
                          key={`${f.name}-${f.size}-${i}`}
                          className="flex items-start gap-3 border-b border-neutral-gray px-3 py-2.5 last:border-b-0"
                        >
                          <XCircle
                            className="mt-0.5 h-[18px] w-[18px] flex-none text-status-error"
                            aria-hidden
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm text-foreground">
                              {f.name}
                            </span>
                            {sharedFailureReason ? null : (
                              <span className={cn(T.sub, "block")}>
                                {reasonFor(f.name)}
                              </span>
                            )}
                          </span>
                        </li>
                      ) : null
                    )}
                  </ul>
                </section>
              )}
              <div
                role="status"
                aria-live="polite"
                className="flex items-baseline justify-between gap-4"
              >
                <p className={T.sub}>
                  {busy && failedCount > 0
                    ? `${failedCount} failed`
                    : busy || failedCount
                      ? `${fileSize(files.reduce((sum, f) => sum + f.size, 0))} total`
                      : null}
                </p>
                {/* At the end, the place this is handing you to — and on a run
                    that stopped short, where the rest of it went. */}
                <p className={cn(T.sub, "min-w-0 truncate text-right")}>
                  {handoff
                    ? "Extracting in the Inbox…"
                    : !busy && failedCount
                      ? `${uploadedCount} extracting in the Inbox`
                      : null}
                </p>
              </div>
            </section>
          )}
          {/* A run that stopped short is the only one that ends on buttons. A
              clean one has already left. */}
          {!!files.length && !busy && !!failedCount && (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFiles([]);
                  setUploadStatus([]);
                  setUploadErrors([]);
                }}
              >
                Upload more
              </Button>
              <Button
                onClick={() => {
                  setDialog("");
                  window.setTimeout(() => {
                    setFiles([]);
                    setUploadStatus([]);
                    setUploadErrors([]);
                  }, DIALOG_EXIT_MS);
                }}
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </PageDialog>
      <PageDialog
        open={dialog === "demo"}
        title="Prototype settings"
        description="Choose the modules this role can post to. These are local scenarios, not production access controls."
        onClose={() => setDialog("")}
      >
        <div className="space-y-1">
          {routes.map((r) => (
            <Label
              className="flex cursor-pointer items-center gap-2.5 rounded-md p-2 text-sm font-normal hover:bg-accent"
              key={r}
            >
              <Checkbox
                checked={state.permissions.includes(r)}
                onCheckedChange={(checked) =>
                  setPermissions(
                    checked
                      ? [...state.permissions, r]
                      : state.permissions.filter((v) => v !== r)
                  )
                }
              />
              {routeNames[r]}
            </Label>
          ))}
        </div>
        <div className={cn(band, "mt-5")}>
          <Button
            variant="outline"
            className="text-primary"
            onClick={() => {
              configure({ tourDone: false });
              setTour(0);
              setDialog("");
            }}
          >
            Replay launch guide
          </Button>
          {/*
            The launch tag has no other way to be seen in both of its states —
            a prototype is always on day zero, so without this the fifteenth
            day is undemonstrable. Backdating past the window is what retires
            it and hands the Inbox entry back to its count.
          */}
          <Button
            variant="outline"
            className="text-primary"
            onClick={() => {
              const isNew = withinNewWindow(state.launchedAt);
              configure({
                launchedAt: new Date(
                  Date.now() - (isNew ? (NEW_TAG_DAYS + 1) * 86400_000 : 0)
                ).toISOString(),
              });
              notify(
                isNew
                  ? `Launch backdated past ${NEW_TAG_DAYS} days. The Inbox entry shows its Needs Review count again.`
                  : `Launch reset to today. The Inbox entry carries the NEW tag for ${NEW_TAG_DAYS} days.`
              );
            }}
          >
            {withinNewWindow(state.launchedAt)
              ? "Retire NEW tag"
              : "Restore NEW tag"}
          </Button>
        </div>
        <p className={cn(T.sub, "mt-4")}>
          Production connections are not configured. Files, vouchers and audit
          events are stored locally.
        </p>
      </PageDialog>
      <PageDialog
        open={dialog === "audit"}
        title="Audit history and event outbox"
        description="Local transition history and PRD telemetry events. No events are sent to Mixpanel."
        onClose={() => setDialog("")}
      >
        <div className="mb-4">
          <Button
            variant="outline"
            className="text-primary"
            onClick={downloadAudit}
          >
            Export JSON
          </Button>
        </div>
        <div className="max-h-[400px] overflow-auto rounded-md border border-neutral-gray">
          {state.events
            .filter((e) => e.company === state.company)
            .slice()
            .reverse()
            .map((e) => (
              <details
                key={e.id}
                className="border-b border-neutral-gray p-2.5 last:border-b-0"
              >
                <summary className="cursor-pointer text-xs text-foreground">
                  {e.event} · {e.itemId}{" "}
                  <span className={T.sub}>
                    {stamp(e.at)} · {e.actor}
                  </span>
                </summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-md bg-section p-2.5 text-label-3 leading-4 text-secondary-foreground">
                  {JSON.stringify(e.properties, null, 2)}
                </pre>
              </details>
            ))}
        </div>
      </PageDialog>
      <PageDialog
        open={dialog === "dashboard"}
        title="Launch dashboard"
        description="Local prototype metrics; extraction latency and query performance need production measurement."
        onClose={() => setDialog("")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {routes.map((r) => {
            const approved = all.filter(
              (x) => x.status === "Approved" && x.route === r
            );
            return (
              <div
                className="rounded-lg border border-neutral-gray bg-section p-5"
                key={r}
              >
                <h2 className={T.section}>{routeNames[r]}</h2>
                <p className="mt-2 text-lg font-bold tabular-nums text-foreground">
                  {approved.length}{" "}
                  <span className={cn(T.sub, "font-normal")}>approved</span>
                </p>
                <p className={T.sub}>
                  {approved.length
                    ? Math.round(
                        (approved.filter((x) => x.route === x.aiRoute).length /
                          approved.length) *
                          100
                      )
                    : 0}
                  % route acceptance
                </p>
              </div>
            );
          })}
        </div>
        <dl className="mt-5 space-y-2">
          <Stat label="Permission redirects">
            {all.filter((x) => x.aiRoute !== x.topChoice).length}
          </Stat>
          <Stat label="First-attempt approvals">
            {
              all.filter((x) => x.status === "Approved" && x.firstAttempt)
                .length
            }
          </Stat>
          <Stat label="Channel mix">
            {["email", "whatsapp", "upload"]
              .map((s) => `${s}: ${all.filter((x) => x.source === s).length}`)
              .join(" · ")}
          </Stat>
        </dl>
        <div className="mt-5">
          <Button
            variant="outline"
            className="text-primary"
            onClick={() => setDialog("audit")}
          >
            Inspect bulk and recovery events
          </Button>
        </div>
      </PageDialog>
    </>
  );

  /*
    Reviewing one document drops the SIDEBAR but keeps the top bar. The review
    surface is a document beside a form that the accountant resizes, and the
    sidebar's width was taken from the half they were reading — but the bar is
    50px and it is where Sync lives, and a sync is not a property of the screen
    you happen to be on. Losing the control the moment you opened a document
    meant you had to navigate away from your work to start one.

    The chevron at the head of the header row is still the way back; the bar
    adds no second navigation, it carries the app-level actions.

    Deciding this here rather than inside SidebarLayout is deliberate — that
    component is a stub mirroring production's props contract and is deleted at
    handoff, so it must not grow a prop production does not have.
  */
  const syncButton = (
    <SyncChromeButton
      onClick={sync.openConfirm}
      isSyncing={sync.isRunning}
      connection={sync.connection}
    />
  );
  /**
   * Mounted in both shells, not just the list. A run started from the list and
   * then followed into a document must keep reporting — closing the shell it
   * was launched from is not the same as cancelling it.
   */
  const syncModals = (
    <>
      {/*
        445px — the width the panel was drawn at (Figma 24496:57272). Full
        height, because the list is twelve rows and a reference you scroll is
        better than one that is cut off.
      */}
      <Drawer open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DrawerContent
          side="right"
          className="w-full gap-0 overflow-y-auto border-neutral-gray p-0 sm:max-w-[445px]"
        >
          <KeyboardShortcuts />
        </DrawerContent>
      </Drawer>
      <SyncConfirmModal
        open={sync.phase === "confirm"}
        onOpenChange={(open) =>
          open ? sync.openConfirm() : sync.closeConfirm()
        }
        currentModule={sync.currentModule}
        includedModules={sync.includedModules}
        selectedKeys={sync.selectedKeys}
        onToggleModule={sync.toggleModule}
        connection={sync.connection}
        selectedCount={sync.selectedCount}
        onConfirm={sync.start}
      />
      <SyncProgressModal
        open={sync.phase === "running"}
        docs={sync.docs}
        settledCount={sync.settledCount}
        modules={sync.runModules}
        moduleProgress={sync.moduleProgress}
        onStop={sync.stop}
        onContinueInBackground={sync.continueInBackground}
      />
      <SyncResultModal
        open={sync.phase === "result"}
        run={sync.run}
        onDone={sync.dismissResult}
        onReviewFailures={sync.reviewFailures}
      />
    </>
  );

  /* Reviewing a document is the one screen with no app top bar. Everything that
     bar carried belongs to moving between documents, not to reading the one on
     screen: the company is fixed for the length of a cohort, a sync cannot run
     against a record being edited, and the way out is the back arrow the page
     bar already has. The list view keeps the bar via SidebarLayout below. */
  return fullScreen ? (
    <div className="flex h-screen min-h-0 flex-col bg-background text-foreground">
      {content}
      {syncModals}
    </div>
  ) : (
    <SidebarLayout
      inboxCount={all.filter((x) => x.status === "Needs Review").length}
      inboxNew={withinNewWindow(state.launchedAt)}
      activeNavId={navId}
      onNavSelect={selectNav}
      onGuide={() => {
        configure({ tourDone: false });
        setTour(0);
      }}
      companies={companies.map((c) => ({ id: c.id, name: c.name }))}
      companyId={state.company}
      onCompanyChange={changeCompany}
      companyAction={syncButton}
    >
      {content}
      {syncModals}
    </SidebarLayout>
  );
}

/* ------------------------------------------------------------ local chrome */

/**
 * Explains a disabled control, or gets out of the way.
 *
 * With no reason this renders its child and nothing else, so an enabled
 * Approve is exactly the button it always was — no wrapper span in the flex
 * row, no tooltip that opens on an action that is available anyway.
 *
 * With one, the child is wrapped: a disabled button swallows nothing because
 * it receives nothing, so the hover has to be caught by an element above it.
 * That element takes `tabIndex` too — a disabled button is skipped by the tab
 * ring, and a reason only a mouse can reach is not a reason a keyboard user
 * has been given.
 */
const BlockedReason = ({
  reason,
  children,
}: {
  reason: string;
  children: React.ReactNode;
}) =>
  reason ? (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-flex rounded-md">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-[280px]">
          {reason}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <>{children}</>
  );

/** AP's .btn--danger — quiet until you reach for it. */
const DangerButton = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <Button
    variant="outline"
    onClick={onClick}
    className="h-8 border-current px-3 text-xs text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground"
  >
    {children}
  </Button>
);

/** Secondary action inside the floating selection toolbar. */
const BulkButton = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <Button variant="outline" size="sm" onClick={onClick} isDestructive>
    {children}
  </Button>
);

/** The four fields a selection can be reassigned on, in the bar's order. */
const BULK_FIELDS: BulkField[] = [
  "Vendor",
  "GST Registration",
  "Voucher Type",
  "Ledger",
];

/**
 * One reassignable field, as a dropdown on the selection bar.
 *
 * Always searchable: vendors and ledgers run to hundreds of names, and the two
 * short lists lose nothing by carrying a box they do not need — a set of
 * triggers that open two different kinds of panel is a worse trade than one
 * spare input.
 *
 * Picking applies immediately, so the popover closes on select and the toast
 * reports what landed. There is no Apply: the rows were chosen before this was
 * opened, and a second confirmation would be confirming the first one.
 */
const BulkReassign = ({
  field,
  options,
  onPick,
}: {
  field: BulkField;
  options: string[];
  onPick: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="whitespace-nowrap text-primary"
        >
          {field}
          <ChevronDown className="h-4 w-4 opacity-70" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-64 p-0">
        <Command>
          <CommandInput
            aria-label={`Search ${field}`}
            placeholder={`Search ${field.toLowerCase()}…`}
          />
          <CommandList className="max-h-64">
            <CommandEmpty>
              No matching {field.toLowerCase()} found.
            </CommandEmpty>
            {options.map((value) => (
              <CommandItem
                key={value}
                value={value}
                onSelect={() => {
                  setOpen(false);
                  onPick(value);
                }}
              >
                {value}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const PageButton = ({
  label,
  disabled,
  onClick,
  children,
  className,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
  /** For the cohort pager, which wants the brand at low emphasis, not grey. */
  className?: string;
}) => (
  <Button
    variant="ghost"
    size="icon"
    aria-label={label}
    title={label}
    className={cn(
      "h-7 w-7 text-secondary-foreground hover:bg-section hover:text-primary",
      className
    )}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </Button>
);

/**
 * Publishes its own height as --inbox-footer-h.
 *
 * The embedded bill sheet pins two things to the viewport bottom — its line-item
 * bulk bar and its toast stack — from a time when it owned the whole window. In
 * the inbox this band belongs to the footer, so both would sit on top of Delete
 * and Approve & Next. The sheet's CSS offsets them by this variable rather than
 * a number, so the clearance survives anything that changes the footer's height.
 */
const Footer = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const publish = () =>
      document.documentElement.style.setProperty(
        "--inbox-footer-h",
        `${Math.round(el.getBoundingClientRect().height)}px`
      );
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => {
      ro.disconnect();
      // Nothing is pinned above a footer that is no longer on screen.
      document.documentElement.style.removeProperty("--inbox-footer-h");
    };
  }, []);
  return (
    <div
      ref={ref}
      className={cn(
        band,
        gutter,
        // py-1.5: the pagination band is 6px vertical (Figma 24156:149264).
        "shrink-0 flex-wrap justify-between border-t border-neutral-gray bg-background py-1.5"
      )}
    >
      {children}
    </div>
  );
};

const EmptyState = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <div className="m-auto flex max-w-[750px] flex-col items-center gap-3 p-14 text-center">
    {icon}
    <h1 className={T.title}>{title}</h1>
    {children}
  </div>
);

const Stat = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-baseline justify-between gap-4">
    <dt className={T.value}>{label}</dt>
    <dd className="text-sm font-semibold tabular-nums text-foreground">
      {children}
    </dd>
  </div>
);

/* -------------------------------------------------------------- review form */

function ReviewForm({
  item,
  onEdit,
  readOnly = false,
}: {
  item: Item;
  onEdit: (p: Partial<Form>) => void;
  readOnly?: boolean;
}) {
  const [mode, setMode] = useState("Item Mode");
  const f = readOnly ? item.snapshot || item.form : item.form;
  /**
   * Every field on this form is a string. `costClassEnabled` is the one member
   * of `Form` that is not, and it belongs to the journal, which has its own
   * form now — so it is excluded here rather than special-cased at each cell.
   */
  type TextField = Exclude<keyof Omit<Form, "lines">, "costClassEnabled">;
  const fields: [TextField, string, string][] = [
    ["gst", "GST Registration", "text"],
    ["voucherType", "Voucher Type", "text"],
    ["voucherNo", "Voucher No", "text"],
    [
      "invoiceNo",
      item.route === "AR" ? "Invoice No" : "Supplier Invoice No",
      "text",
    ],
    ["date", item.route === "AR" ? "Invoice Date" : "Bill Date", "date"],
    ["due", "Due Date", "date"],
    ["party", item.route === "AR" ? "Customer Name" : "Vendor Name", "text"],
    ["costClass", "Cost Centre Class", "text"],
    ["costCentre", "Cost Centre", "text"],
  ];
  const editLine = (index: number, patch: Partial<Form["lines"][number]>) =>
    onEdit({
      lines: f.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    });
  return (
    <div>
      {!readOnly && (
        <div className={cn(band, "px-5 pt-5")}>
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList>
              {["Item Mode", "Accounting Mode"].map((m) => (
                <TabsTrigger key={m} value={m}>
                  {m}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}
      {/*
        Panelled and laid out like the sheet's own field cards, so the approved
        record reads as the same product as the sheet the bill was approved on.

        This form no longer serves the journal. A JV opens
        components/inbox/journal, which is a port of the Journals prototype's
        own screen — so everything here is a bill, and the Dr/Cr branches this
        component used to carry are gone with them.
      */}
      <div className="p-5">
        <FieldCard title="Bill Details">
          {fields.map(([key, label, type]) => (
            <Field
              key={key}
              htmlFor={`f-${key}`}
              label={
                REQUIRED_FIELDS.has(key) ? (
                  <>
                    <Req />
                    {label}
                  </>
                ) : (
                  label
                )
              }
              hint={item.edited.includes(key) ? <EditedMark /> : undefined}
            >
              {key === "gst" ? (
                <Select
                  value={f[key]}
                  disabled={readOnly}
                  onValueChange={(v) => onEdit({ [key]: v })}
                >
                  <SelectTrigger id={`f-${key}`} className="h-9">
                    <SelectValue placeholder="Select registration" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      ...new Set(
                        [
                          f.gst,
                          ...companies.find((c) => c.id === item.company)!
                            .branches,
                        ].filter(Boolean)
                      ),
                    ].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : key === "voucherType" ? (
                <Select
                  value={f[key]}
                  disabled={readOnly}
                  onValueChange={(v) => onEdit({ [key]: v })}
                >
                  <SelectTrigger id={`f-${key}`} className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      ...new Set(
                        [...voucherTypes, "Sales", f.voucherType].filter(
                          Boolean
                        )
                      ),
                    ].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : type === "date" ? (
                <DateField
                  id={`f-${key}`}
                  value={f[key]}
                  disabled={readOnly}
                  onChange={(iso) => onEdit({ [key]: iso })}
                />
              ) : (
                <Input
                  id={`f-${key}`}
                  type={type}
                  readOnly={readOnly}
                  value={f[key]}
                  onChange={(e) => onEdit({ [key]: e.target.value })}
                />
              )}
            </Field>
          ))}
        </FieldCard>
      </div>
      {/* On the sheet's ground too, so the lines read as a section of the same
          form rather than a table dropped below it. */}
      <div className="px-5 pb-5">
        <section className="space-y-4 rounded-md bg-section p-5">
          <h2 className={T.section}>
            {mode === "Accounting Mode" ? "Accounting entries" : "Line items"}
          </h2>
          <div className="overflow-x-auto rounded-md border border-neutral-gray bg-background">
            <Table>
              <TableHeader className="bg-section">
                <TableRow>
                  <TableHead className="text-xs font-medium">Ledger</TableHead>
                  <TableHead className="text-xs font-medium">
                    Description
                  </TableHead>
                  <TableHead className="text-xs font-medium">Amount</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {f.lines.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Input
                        aria-label={`Ledger ${i + 1}`}
                        list="ledgers"
                        value={l.ledger}
                        readOnly={readOnly}
                        onChange={(e) =>
                          editLine(i, { ledger: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        aria-label={`Description ${i + 1}`}
                        value={l.description}
                        readOnly={readOnly}
                        onChange={(e) =>
                          editLine(i, { description: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="w-[110px]">
                        <Input
                          aria-label={`Amount ${i + 1}`}
                          type="number"
                          min="0"
                          step=".01"
                          className="truncate text-right tabular-nums"
                          value={l.amount}
                          readOnly={readOnly}
                          onChange={(e) =>
                            editLine(i, { amount: Number(e.target.value) })
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove line ${i + 1}`}
                          className="h-8 w-8 text-secondary-foreground hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() =>
                            onEdit({ lines: f.lines.filter((_, n) => n !== i) })
                          }
                        >
                          ×
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <datalist id="ledgers">
            {ledgerOptions.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </datalist>
          {!readOnly && (
            <Button
              variant="outline"
              className="text-primary"
              onClick={() =>
                onEdit({
                  lines: [
                    ...f.lines,
                    {
                      description: "",
                      ledger: "",
                      amount: 0,
                      dr: 0,
                      cr: 0,
                      costCentre: "",
                    },
                  ],
                })
              }
            >
              Add line
            </Button>
          )}
          <p className="text-right text-sm font-semibold tabular-nums text-foreground">
            Total {money(f.lines.reduce((s, l) => s + l.amount, 0))}
          </p>
          <Field
            label="Narration"
            htmlFor="f-narration"
            hint={
              item.edited.includes("narration") ? <EditedMark /> : undefined
            }
          >
            <Textarea
              id="f-narration"
              rows={3}
              readOnly={readOnly}
              value={f.narration}
              onChange={(e) => onEdit({ narration: e.target.value })}
            />
          </Field>
        </section>
      </div>
    </div>
  );
}
