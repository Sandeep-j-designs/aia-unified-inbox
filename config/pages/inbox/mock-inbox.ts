import type { InboxItem } from "@/types/pages/inbox";

/**
 * Unified Inbox — mock data.
 *
 * Ported from the prototype's js/data.js (window.SEED). Shaped exactly as the
 * API is expected to return it, camelCase throughout.
 *
 * DEV: replaced by GET /api/inbox → InboxItem[].
 *      Server-side filtering by status/tab is expected; the prototype filters
 *      client-side because it holds the whole set in memory.
 *
 * Timestamps are fixed ISO strings anchored to 2026-09-10T05:30:00Z rather than
 * `Date.now()` offsets. Module-scope `Date.now()` differs between the server and
 * client render and would produce a hydration mismatch — and an API returns an
 * absolute timestamp anyway.
 */

const GST_REG = "Bangalore HQ · 27AAACC1206D1ZY";
const BATCH_SENDER = "Sandeep B. · batch upload (10 files)";

export const MOCK_INBOX_ITEMS: InboxItem[] = [
  // 1. Standard AP — high confidence, ready to confirm
  {
    id: "INB-2041",
    file: {
      name: "Dell India Pvt Ltd · INV-1182.pdf",
      size: "412 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "accounts@dellindia.com",
      subject: "Invoice INV-1182 from Dell India",
    },
    vendor: "Dell India Pvt Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: {
      confidence: 0.94,
      rationale:
        "Looks like a vendor invoice — supplier GSTIN + 'Tax Invoice' header detected.",
    },
    amount: 76450.0,
    receivedAt: "2026-09-10T03:30:00.000Z",
    status: "needs-review",
    bill: {
      voucherNo: "PUR/25-26/041",
      supplierInvoiceNo: "INV-1182",
      billDate: "12 May 2026",
      dueDate: "11 Jun 2026",
      gstReg: GST_REG,
      costCentre: "Engineering",
      flagged: [],
      items: [
        {
          desc: "i7 Workstation, 32GB RAM, 1TB SSD (x2)",
          ledger: "Fixed Assets - Hardware",
          amount: 64790,
        },
        {
          desc: "Onsite warranty extension — 24 months",
          ledger: "Repairs & Maintenance",
          amount: 11660,
        },
      ],
      taxes: { cgst: 5817.6, sgst: 5817.6 },
      subTotal: 64790,
      grandTotal: 76425.2,
    },
  },

  // 2. AP — low confidence + flagged fields + vendor not in masters
  {
    id: "INB-2042",
    file: { name: "AWS-services-may-2026.pdf", size: "1.2 MB", ext: "pdf" },
    source: {
      channel: "email",
      sender: "billing@aws.amazon.com",
      subject: "Your AWS invoice — May 2026",
    },
    vendor: "Amazon Web Services India",
    voucherType: "Purchase",
    route: "AP",
    ai: {
      confidence: 0.62,
      rationale:
        "Cloud-services bill — likely AP, but vendor not found in masters.",
    },
    amount: 218904.1,
    receivedAt: "2026-09-10T00:30:00.000Z",
    status: "needs-review",
    bill: {
      voucherNo: "PUR/25-26/042",
      supplierInvoiceNo: "AWS-INV-MAY26-0042",
      billDate: "06 May 2026",
      dueDate: "06 Jun 2026",
      gstReg: GST_REG,
      costCentre: null,
      vendorMissing: true,
      flagged: ["supplierInvoiceNo", "costCentre", "vendor"],
      items: [
        {
          desc: "Compute (EC2) — c6i / m7i family",
          ledger: "Cloud Services",
          amount: 142300,
        },
        { desc: "Storage (S3, EBS)", ledger: "Cloud Services", amount: 38450 },
        {
          desc: "Data transfer & misc",
          ledger: "Cloud Services",
          amount: 24960,
        },
      ],
      taxes: { cgst: 0, igst: 13194.1 },
      subTotal: 205710,
      grandTotal: 218904.1,
    },
  },

  // 3. Banking — long-running statement, low confidence
  {
    id: "INB-2043",
    file: { name: "HDFC-50100123456-Apr2026.pdf", size: "624 KB", ext: "pdf" },
    source: { channel: "upload", sender: "Sandeep B.", subject: "—" },
    vendor: "—",
    voucherType: "Receipt / Payment",
    route: "Banking",
    ai: {
      confidence: 0.71,
      rationale:
        "PDF matches HDFC statement layout (acct ending 3456). Date range Apr 1 – Apr 30.",
    },
    amount: 0,
    receivedAt: "2026-09-09T21:30:00.000Z",
    status: "needs-review",
    banking: {
      txnCount: 47,
      dateRange: "01 Apr 2026 – 30 Apr 2026",
      opening: 482310.0,
      closing: 612482.45,
      sample: [
        {
          date: "01-Apr-26",
          narration: "NEFT Cr · ACME PVT LTD",
          dr: null,
          cr: 125000.0,
        },
        {
          date: "03-Apr-26",
          narration: "POS · SPENCER RETAIL",
          dr: 4280.0,
          cr: null,
        },
        {
          date: "07-Apr-26",
          narration: "UPI Dr · STARBUCKS COFFEE",
          dr: 540.0,
          cr: null,
        },
        {
          date: "10-Apr-26",
          narration: "IMPS Cr · Tally Solutions",
          dr: null,
          cr: 18000.0,
        },
        {
          date: "15-Apr-26",
          narration: "Salary Dr · APR SAL BATCH",
          dr: 412000.0,
          cr: null,
        },
      ],
    },
  },

  // 4. AR — a sales invoice we issued, vendor field empty because there isn't one
  {
    id: "INB-2044",
    file: {
      name: "Theta-Hotels — INV-2214.pdf",
      size: "112 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "ar@shakunthalam.co.in",
      subject: "Invoice INV-2214 — Theta Hotels",
    },
    vendor: "—",
    customer: "Theta Hotels Pvt Ltd",
    voucherType: "Sales",
    route: "AR",
    ai: {
      confidence: 0.94,
      rationale:
        "Shakunthalam is named as the supplier and Theta Hotels as the recipient.",
    },
    amount: 486850.0,
    receivedAt: "2026-09-09T18:30:00.000Z",
    status: "needs-review",
    invoice: {
      voucherNo: "SAL/25-26/0214",
      invoiceNo: "INV-2214",
      invoiceDate: "12 May 2026",
      dueDate: "11 June 2026",
      gstReg: "Karnataka HQ",
      costCentre: null,
      customer: "Theta Hotels Pvt Ltd",
      flagged: [],
      items: [
        {
          desc: "Furnace oil — 12 KL @ ₹34,200",
          ledger: "Sales — Petroleum Products",
          amount: 410400.0,
        },
        {
          desc: "Delivery and handling",
          ledger: "Sales — Freight Recovered",
          amount: 2200.0,
        },
      ],
      taxes: { cgst: 37116.0, sgst: 37116.0 },
      subTotal: 412600.0,
      grandTotal: 486832.0,
    },
  },

  // 5. AR — customer not yet in masters, so approving proposes creating it
  {
    id: "INB-2045",
    file: {
      name: "Nandini-Foods — INV-2215.pdf",
      size: "96 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "ar@shakunthalam.co.in",
      subject: "Invoice INV-2215 — Nandini Foods",
    },
    vendor: "—",
    customer: "Nandini Foods LLP",
    voucherType: "Sales",
    route: "AR",
    ai: {
      confidence: 0.88,
      rationale:
        "Shakunthalam is the supplier on this invoice; the recipient is not in your customer masters.",
    },
    amount: 154816.0,
    receivedAt: "2026-09-09T15:30:00.000Z",
    status: "needs-review",
    invoice: {
      voucherNo: "SAL/25-26/0215",
      invoiceNo: "INV-2215",
      invoiceDate: "14 May 2026",
      dueDate: "13 June 2026",
      gstReg: "Karnataka HQ",
      costCentre: null,
      customer: "Nandini Foods LLP",
      flagged: ["customer"],
      items: [
        {
          desc: "Refined sunflower oil — 400 cases",
          ledger: "Sales — Edible Oils",
          amount: 131200.0,
        },
      ],
      taxes: { cgst: 11808.0, sgst: 11808.0 },
      subTotal: 131200.0,
      grandTotal: 154816.0,
      customerMissing: true,
    },
  },

  // 6. JV — internal adjustment
  {
    id: "INB-2046",
    file: { name: "Depreciation-adjustment-Q1.pdf", size: "98 KB", ext: "pdf" },
    source: { channel: "upload", sender: "Sandeep B.", subject: "—" },
    vendor: "—",
    voucherType: "Journal",
    route: "JV",
    ai: {
      confidence: 0.88,
      rationale: "Internal adjustment note — debit/credit entries, no vendor.",
    },
    amount: 184500.0,
    receivedAt: "2026-09-09T10:30:00.000Z",
    status: "needs-review",
    jv: {
      narration:
        "Quarterly depreciation entry — Q1 FY26 — straight-line, hardware pool",
      lines: [
        { ledger: "Depreciation — Hardware", dr: 184500, cr: null },
        { ledger: "Accumulated Depreciation — Hw", dr: null, cr: 184500 },
      ],
    },
  },

  // 7. Ambiguous — no route pre-selected, the disambiguation fork
  {
    id: "INB-2047",
    file: { name: "Petty-cash-recon-Apr.pdf", size: "210 KB", ext: "pdf" },
    source: {
      channel: "whatsapp",
      sender: "+91 98XXX XXX42 (Priya R.)",
      subject: "—",
    },
    vendor: "Multiple",
    voucherType: "—",
    route: null,
    ai: {
      confidence: 0.41,
      rationale:
        "Mixed document — partly looks like vendor receipts, partly like an internal reconciliation.",
    },
    amount: 18420.0,
    receivedAt: "2026-09-09T06:30:00.000Z",
    status: "needs-review",
    ambiguous: true,
    candidates: [
      {
        route: "AP",
        evidence:
          "Page 1 has 4 small vendor receipts — fuel, courier, stationery, snacks.",
      },
      {
        route: "JV",
        evidence:
          "Page 2 has a typed adjustment table balancing petty-cash float.",
      },
    ],
  },

  // 8. Extracting — in flight
  {
    id: "INB-2048",
    file: { name: "Acme-Corp — May-bill.pdf", size: "388 KB", ext: "pdf" },
    source: {
      channel: "email",
      sender: "billing@acmecorp.in",
      subject: "May invoice",
    },
    vendor: "Acme Corp Pvt Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-10T05:28:00.000Z",
    status: "extracting",
  },

  // 9. Failed — OCR could not read the scan
  {
    id: "INB-2049",
    file: { name: "Vendor-Quote-Scan.pdf", size: "2.8 MB", ext: "pdf" },
    source: {
      channel: "email",
      sender: "ops@kappa-tech.co.in",
      subject: "Q for warehouse rack — please process",
    },
    vendor: "Kappa Technologies",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-10T02:30:00.000Z",
    status: "failed",
    failure: {
      type: "scanned-pdf",
      title: "Scanned PDF — text not extractable",
      body: "This appears to be a phone-camera scan. Our OCR could read partial text but couldn't reliably identify line items, GST or amount.",
    },
  },

  // 10. Failed — password protected
  {
    id: "INB-2050",
    file: { name: "Iota-Solutions-Apr.pdf", size: "94 KB", ext: "pdf" },
    source: {
      channel: "email",
      sender: "ar@iotasol.in",
      subject: "Invoice — protected",
    },
    vendor: "Iota Solutions",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-09T23:30:00.000Z",
    status: "failed",
    failure: {
      type: "password-protected",
      title: "Password-protected PDF",
      body: "We couldn't open this file. Ask the vendor to share an unlocked copy, or paste the password and we'll retry.",
    },
  },

  // 11. Duplicate hard-block — same vendor + invoice no already exists
  {
    id: "INB-2051",
    file: {
      name: "Dell India Pvt Ltd · INV-1182 (1).pdf",
      size: "412 KB",
      ext: "pdf",
    },
    source: {
      channel: "drive",
      sender: "Shared drive · auto-import",
      subject: "—",
    },
    vendor: "Dell India Pvt Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: {
      confidence: 0.94,
      rationale:
        "Same as INB-2041 — vendor + invoice no match an existing bill.",
    },
    amount: 76425.2,
    receivedAt: "2026-09-10T04:30:00.000Z",
    status: "duplicate-hard",
    duplicateOf: "INB-2041",
    bill: {
      voucherNo: "PUR/25-26/041",
      supplierInvoiceNo: "INV-1182",
      billDate: "12 May 2026",
      dueDate: "11 Jun 2026",
      gstReg: GST_REG,
      costCentre: "Engineering",
      flagged: [],
      items: [
        {
          desc: "i7 Workstation, 32GB RAM, 1TB SSD (x2)",
          ledger: "Fixed Assets - Hardware",
          amount: 64790,
        },
      ],
      taxes: { cgst: 5817.6, sgst: 5817.6 },
      subTotal: 64790,
      grandTotal: 76425.2,
    },
  },

  // 12. Aged + soft duplicate warning
  {
    id: "INB-2052",
    file: { name: "Sigma-Pkg-Mar26.pdf", size: "320 KB", ext: "pdf" },
    source: {
      channel: "email",
      sender: "ap@sigmapkg.co.in",
      subject: "Invoice for March packaging",
    },
    vendor: "Sigma Packaging Co",
    voucherType: "Purchase",
    route: "AP",
    ai: {
      confidence: 0.84,
      rationale:
        "Vendor bill, identical amount as another bill 6 weeks ago — possible duplicate, soft warning.",
    },
    amount: 42100.0,
    receivedAt: "2026-09-01T05:30:00.000Z",
    status: "duplicate-soft",
    aged: true,
    bill: {
      voucherNo: "PUR/25-26/038",
      supplierInvoiceNo: "SIG/26/0421",
      billDate: "22 Mar 2026",
      dueDate: "21 Apr 2026",
      gstReg: GST_REG,
      costCentre: "Operations",
      flagged: ["dueDate"],
      items: [
        {
          desc: "Corrugated boxes — 250 nos",
          ledger: "Packing Material",
          amount: 28200,
        },
        {
          desc: "Bubble wrap rolls — 8 nos",
          ledger: "Packing Material",
          amount: 6480,
        },
      ],
      taxes: { cgst: 1564.2, sgst: 1564.2 },
      subTotal: 34680,
      grandTotal: 42100.0,
    },
  },

  // 13. Retrying
  {
    id: "INB-2053",
    file: { name: "Lambda-Innov-Apr.pdf", size: "228 KB", ext: "pdf" },
    source: {
      channel: "email",
      sender: "ap@lambda-innov.in",
      subject: "Monthly invoice",
    },
    vendor: "Lambda Innovations",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-10T05:22:00.000Z",
    status: "retrying",
    retryAttempt: 2,
    retryMax: 3,
  },

  /* ---------------- Bulk batch — 10 files uploaded together ---------------- */

  {
    id: "BULK-001",
    file: { name: "Orion-Tech — INV-9911.pdf", size: "388 KB", ext: "pdf" },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "Orion Technologies",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: 0.91, rationale: "—" },
    amount: 28400.0,
    receivedAt: "2026-09-10T05:26:00.000Z",
    status: "needs-review",
    batchTag: "BATCH-Apr26",
    bill: {
      voucherNo: "PUR/25-26/051",
      supplierInvoiceNo: "INV-9911",
      billDate: "14 May 2026",
      dueDate: "13 Jun 2026",
      gstReg: GST_REG,
      costCentre: "Sales",
      flagged: [],
      items: [
        {
          desc: "Annual marketing licence (CRM)",
          ledger: "Software Subscriptions",
          amount: 24067.8,
        },
      ],
      taxes: { cgst: 2166.1, sgst: 2166.1 },
      subTotal: 24067.8,
      grandTotal: 28400.0,
    },
  },
  {
    id: "BULK-002",
    file: {
      name: "Nova-Logistics — May-freight.pdf",
      size: "412 KB",
      ext: "pdf",
    },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "Nova Logistics",
    voucherType: "Purchase",
    route: "AP",
    ai: {
      confidence: 0.74,
      rationale: "Freight bill — vendor matched in masters.",
    },
    amount: 54820.0,
    receivedAt: "2026-09-10T05:26:00.000Z",
    status: "needs-review",
    batchTag: "BATCH-Apr26",
    bill: {
      voucherNo: "PUR/25-26/052",
      supplierInvoiceNo: "NL-2826",
      billDate: "11 May 2026",
      dueDate: "10 Jun 2026",
      gstReg: GST_REG,
      costCentre: "Operations",
      flagged: ["dueDate"],
      items: [
        {
          desc: "Hyderabad → Bangalore — 18 consignments",
          ledger: "Freight Outward",
          amount: 31000,
        },
        {
          desc: "Chennai → Bangalore — 12 consignments",
          ledger: "Freight Outward",
          amount: 15500,
        },
      ],
      taxes: { cgst: 4180, sgst: 4180 },
      subTotal: 46500,
      grandTotal: 54820.0,
    },
  },
  {
    id: "BULK-003",
    file: { name: "Pulse-Media — Q1 retainer.pdf", size: "276 KB", ext: "pdf" },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "Pulse Media Group",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: 0.86, rationale: "—" },
    amount: 124000.0,
    receivedAt: "2026-09-10T05:26:00.000Z",
    status: "needs-review",
    batchTag: "BATCH-Apr26",
    bill: {
      voucherNo: "PUR/25-26/053",
      supplierInvoiceNo: "PM-Q1-2026-018",
      billDate: "01 Apr 2026",
      dueDate: "30 Apr 2026",
      gstReg: GST_REG,
      costCentre: "Marketing",
      flagged: [],
      items: [
        {
          desc: "Q1 FY26 marketing retainer",
          ledger: "Advertising & Promotion",
          amount: 105084.75,
        },
      ],
      taxes: { cgst: 9457.62, sgst: 9457.62 },
      subTotal: 105084.75,
      grandTotal: 124000.0,
    },
  },
  {
    id: "BULK-004",
    file: { name: "Nimbus-Software — May.pdf", size: "344 KB", ext: "pdf" },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "—",
    voucherType: "—",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-10T05:27:00.000Z",
    status: "extracting",
    batchTag: "BATCH-Apr26",
  },
  {
    id: "BULK-005",
    file: { name: "Ridge-Hardware — INV-2284.pdf", size: "510 KB", ext: "pdf" },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "—",
    voucherType: "—",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-10T05:27:00.000Z",
    status: "extracting",
    batchTag: "BATCH-Apr26",
  },
  {
    id: "BULK-006",
    file: {
      name: "Aura-Office-Supplies — Apr.pdf",
      size: "180 KB",
      ext: "pdf",
    },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "—",
    voucherType: "—",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-10T05:27:00.000Z",
    status: "extracting",
    batchTag: "BATCH-Apr26",
  },
  {
    id: "BULK-007",
    file: { name: "Vega-Catering — May 9.pdf", size: "92 KB", ext: "pdf" },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "—",
    voucherType: "—",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-10T05:27:00.000Z",
    status: "extracting",
    batchTag: "BATCH-Apr26",
  },
  {
    id: "BULK-008",
    file: {
      name: "Tundra-Coolers — quote-scan.pdf",
      size: "3.2 MB",
      ext: "pdf",
    },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "Tundra Coolers Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-10T05:27:00.000Z",
    status: "failed",
    batchTag: "BATCH-Apr26",
    failure: {
      type: "scanned-pdf",
      title: "Scanned PDF — text not extractable",
      body: "Phone-camera scan — couldn't reliably read line items or totals.",
    },
  },
  {
    id: "BULK-009",
    file: { name: "Vortex-Cleaning — May.pdf", size: "118 KB", ext: "pdf" },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "Vortex Cleaning Services",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: 0.92, rationale: "—" },
    amount: 18450.0,
    receivedAt: "2026-09-10T05:27:00.000Z",
    status: "needs-review",
    batchTag: "BATCH-Apr26",
    bill: {
      voucherNo: "PUR/25-26/054",
      supplierInvoiceNo: "VCS-1041",
      billDate: "01 May 2026",
      dueDate: "31 May 2026",
      gstReg: GST_REG,
      costCentre: "Facilities",
      flagged: [],
      items: [
        {
          desc: "May office cleaning — full month",
          ledger: "Facilities Expense",
          amount: 15635.59,
        },
      ],
      taxes: { cgst: 1407.2, sgst: 1407.2 },
      subTotal: 15635.59,
      grandTotal: 18450.0,
    },
  },
  {
    id: "BULK-010",
    file: { name: "Cinder-Fuel — May 14.pdf", size: "224 KB", ext: "pdf" },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "Cinder Fuel Stations",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: 0.77, rationale: "—" },
    amount: 9840.0,
    receivedAt: "2026-09-10T05:27:00.000Z",
    status: "needs-review",
    batchTag: "BATCH-Apr26",
    bill: {
      voucherNo: "PUR/25-26/055",
      supplierInvoiceNo: "CFS-99412",
      billDate: "14 May 2026",
      dueDate: "13 Jun 2026",
      gstReg: GST_REG,
      costCentre: "Fleet",
      flagged: [],
      items: [
        {
          desc: "Fleet fuel — Bangalore depot",
          ledger: "Vehicle Running Expense",
          amount: 8338.98,
        },
      ],
      taxes: { cgst: 750.51, sgst: 750.51 },
      subTotal: 8338.98,
      grandTotal: 9840.0,
    },
  },

  /* --------------------------------- Done --------------------------------- */

  {
    id: "INB-2030",
    file: { name: "Zeta-Services-Apr.pdf", size: "172 KB", ext: "pdf" },
    source: { channel: "email", sender: "ar@zeta.co", subject: "—" },
    vendor: "Zeta Services LLP",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: 0.91, rationale: "—" },
    amount: 12600.0,
    receivedAt: "2026-09-08T05:30:00.000Z",
    status: "done",
    doneBy: "Sandeep Balaji",
    doneAt: "2026-09-08T05:30:00.000Z",
    destination: "PUR/25-26/030",
  },
  {
    id: "INB-2031",
    file: { name: "Theta-Hotels — INV-2208.pdf", size: "108 KB", ext: "pdf" },
    source: {
      channel: "email",
      sender: "ar@shakunthalam.co.in",
      subject: "—",
    },
    vendor: "—",
    customer: "Theta Hotels Pvt Ltd",
    voucherType: "Sales",
    route: "AR",
    ai: { confidence: 0.96, rationale: "—" },
    amount: 298628.0,
    receivedAt: "2026-09-06T05:30:00.000Z",
    status: "done",
    doneBy: "Sandeep Balaji",
    doneAt: "2026-09-06T05:30:00.000Z",
    destination: "SAL/25-26/0208",
    invoice: {
      voucherNo: "SAL/25-26/0208",
      invoiceNo: "INV-2208",
      invoiceDate: "28 April 2026",
      dueDate: "28 May 2026",
      gstReg: "Karnataka HQ",
      costCentre: null,
      customer: "Theta Hotels Pvt Ltd",
      flagged: [],
      items: [
        {
          desc: "Furnace oil — 7 KL @ ₹34,200",
          ledger: "Sales — Petroleum Products",
          amount: 239400.0,
        },
      ],
      taxes: { cgst: 21546.0, sgst: 21546.0 },
      subTotal: 239400.0,
      grandTotal: 282492.0,
    },
  },

  /* ------------------------------- Deleted -------------------------------- */

  {
    id: "INB-2020",
    file: { name: "Wrong-attachment.pdf", size: "44 KB", ext: "pdf" },
    source: {
      channel: "email",
      sender: "noreply@vendor.com",
      subject: "Re: order",
    },
    vendor: "—",
    voucherType: "—",
    route: "AP",
    ai: {
      confidence: 0.22,
      rationale: "Couldn't classify — looks like a delivery note, not a bill.",
    },
    amount: null,
    receivedAt: "2026-09-07T05:30:00.000Z",
    status: "deleted",
    deletedBy: "Sandeep Balaji",
    deletedAt: "2026-09-07T05:30:00.000Z",
  },

  /* ------------------------- Conversion-system seeds ----------------------- */

  // CONV-001 — Bill ready for Bill→Invoice; vendor is not in the Customer master
  {
    id: "CONV-001",
    file: {
      name: "Pegasus-Logistics — INV-7702.pdf",
      size: "320 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "ops@pegasus-log.in",
      subject: "Service invoice — May",
    },
    vendor: "Pegasus Logistics Pvt Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: 0.92, rationale: "Vendor invoice." },
    amount: 88500.0,
    receivedAt: "2026-09-10T02:30:00.000Z",
    status: "needs-review",
    bill: {
      voucherNo: "PUR/25-26/061",
      supplierInvoiceNo: "PL-7702",
      billDate: "11 May 2026",
      dueDate: "10 Jun 2026",
      gstReg: GST_REG,
      costCentre: "Operations",
      flagged: [],
      items: [
        {
          desc: "Inter-city freight — 22 consignments",
          ledger: "Freight Inward",
          amount: 75000,
        },
      ],
      taxes: { cgst: 6750, sgst: 6750 },
      subTotal: 75000,
      grandTotal: 88500,
    },
    convertHint: "bill-to-invoice",
  },

  // CONV-002 — JV whose narration names a candidate party, ready for JV→Invoice
  {
    id: "CONV-002",
    file: { name: "Rebill-Rentyx-Mar.pdf", size: "164 KB", ext: "pdf" },
    source: { channel: "upload", sender: "Sandeep B.", subject: "—" },
    vendor: "—",
    voucherType: "Journal",
    route: "JV",
    ai: { confidence: 0.95, rationale: "Internal adjustment note." },
    amount: 41200.0,
    receivedAt: "2026-09-09T23:30:00.000Z",
    status: "needs-review",
    jv: {
      narration:
        "Re-bill: pass-through of warehouse rent paid on behalf of Rentyx Stores Pvt Ltd · Mar 2026 — should be raised as a sales invoice on Rentyx.",
      lines: [
        { ledger: "Rentyx Stores Pvt Ltd (Receivable)", dr: 41200, cr: null },
        { ledger: "Warehouse Rent — Pass-through", dr: null, cr: 41200 },
      ],
    },
    convertHint: "jv-to-invoice",
  },

  // CONV-003 — content hash matches a posted JV, not a bill
  {
    id: "CONV-003",
    file: { name: "Adjustment-rebill-Mar.pdf", size: "188 KB", ext: "pdf" },
    source: { channel: "email", sender: "finance@partner.in", subject: "—" },
    vendor: "Internal — Adjustment",
    voucherType: "Purchase",
    route: "AP",
    ai: {
      confidence: 0.84,
      rationale: "Looks like a bill but content hashes match a posted JV.",
    },
    amount: 41200.0,
    receivedAt: "2026-09-10T01:30:00.000Z",
    status: "duplicate-cross-type",
    crossDupOf: {
      id: "JV/25-26/074",
      type: "Journal Voucher",
      postedBy: "Sandeep B.",
      postedOn: "12 May 2026",
      amount: 41200,
    },
  },

  // CONV-004 — AR re-upload of an invoice already posted, so it lands as a
  // hard-block duplicate: same customer, same invoice number as INB-2031.
  {
    id: "CONV-004",
    file: {
      name: "Theta-Hotels — INV-2208 (re-send).pdf",
      size: "108 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "ar@shakunthalam.co.in",
      subject: "Invoice INV-2208 — please re-process",
    },
    vendor: "—",
    customer: "Theta Hotels Pvt Ltd",
    voucherType: "Sales",
    route: "AR",
    ai: {
      confidence: 0.97,
      rationale: "Shakunthalam is the supplier; recipient is Theta Hotels.",
    },
    amount: 298628.0,
    receivedAt: "2026-09-10T03:30:00.000Z",
    status: "needs-review",
    isReupload: true,
    invoice: {
      voucherNo: "SAL/25-26/0208",
      invoiceNo: "INV-2208",
      invoiceDate: "28 April 2026",
      dueDate: "28 May 2026",
      gstReg: "Karnataka HQ",
      costCentre: null,
      customer: "Theta Hotels Pvt Ltd",
      flagged: [],
      items: [
        {
          desc: "Furnace oil — 7 KL @ ₹34,200",
          ledger: "Sales — Petroleum Products",
          amount: 239400.0,
        },
      ],
      taxes: { cgst: 21546.0, sgst: 21546.0 },
      subTotal: 239400.0,
      grandTotal: 282492.0,
    },
  },

  // CONV-005 — multi-user edit conflict demo
  {
    id: "CONV-005",
    file: { name: "Crescent-Foods — INV-5510.pdf", size: "224 KB", ext: "pdf" },
    source: { channel: "email", sender: "ar@crescent.in", subject: "—" },
    vendor: "Crescent Foods Pvt Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: 0.89, rationale: "—" },
    amount: 33420.0,
    receivedAt: "2026-09-10T04:30:00.000Z",
    status: "needs-review",
    conflictSim: true,
    bill: {
      voucherNo: "PUR/25-26/062",
      supplierInvoiceNo: "CF-5510",
      billDate: "12 May 2026",
      dueDate: "11 Jun 2026",
      gstReg: GST_REG,
      costCentre: "Pantry",
      flagged: [],
      items: [
        {
          desc: "Office pantry supplies — May",
          ledger: "Office Expenses",
          amount: 28322,
        },
      ],
      taxes: { cgst: 2549, sgst: 2549 },
      subTotal: 28322,
      grandTotal: 33420,
    },
  },

  // DONE-001 — already converted Bill→JV, drives the reversal/lineage view
  {
    id: "DONE-001",
    file: {
      name: "Stellar-Refunds — credit-note.pdf",
      size: "142 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "ar@stellar.co.in",
      subject: "Credit note",
    },
    vendor: "Stellar Refunds Pvt Ltd",
    voucherType: "Purchase",
    route: "JV",
    ai: { confidence: 0.91, rationale: "—" },
    amount: 18900.0,
    receivedAt: "2026-09-09T05:30:00.000Z",
    status: "done",
    doneBy: "Sandeep Balaji",
    doneAt: "2026-09-09T05:30:00.000Z",
    lineage: {
      sourceType: "Bill",
      sourceId: "PUR/25-26/047",
      sourcePostedOn: "21 May 2026",
      convertedTo: {
        type: "Journal Voucher",
        id: "JV/25-26/088",
        postedOn: "21 May 2026",
        actor: "Sandeep B.",
      },
    },
  },
];
