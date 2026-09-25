import React, { useEffect, useRef, useState } from "react";
import { Maximize, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { T } from "./ui";
import { fileUrl, Item } from "./store";

/**
 * The source document viewer — a panel in its own right: a bordered card whose
 * header carries the file name and the view controls, ruled off from the page
 * below it. The document sits on white so a photographed bill reads as paper
 * rather than as an image pasted onto a tinted tray.
 */
export default function Preview({ item }: { item: Item }) {
  const [url, setUrl] = useState(""),
    [zoom, setZoom] = useState(1);
  // Fullscreen targets the card, so the header travels with the document.
  const card = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true,
      current = "";
    if (item.file.blobId)
      fileUrl(item.file.blobId).then((u) => {
        current = u;
        if (active) setUrl(u);
      });
    return () => {
      active = false;
      if (current) URL.revokeObjectURL(current);
    };
  }, [item.file.blobId]);
  return (
    <div data-guide-id="inbox-preview" className="flex min-h-0 flex-col p-5">
      <div
        ref={card}
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-neutral-gray bg-background"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-neutral-gray px-5 py-3.5">
          {/*
            The file name and the view controls, and nothing else.

            The status pill that used to sit here is the record's, not the
            file's, and the record header already carries it — on an approved
            voucher the two rendered one above the other, the same word twice
            on one screen. It also read as a claim about the document, as
            though the PDF were the thing approved rather than the entry made
            from it.
          */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <h2
              className="truncate text-sm font-medium text-foreground"
              title={item.file.name}
            >
              {item.file.name}
            </h2>
          </div>
          <ViewerAction
            label="Zoom in"
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
          >
            <ZoomIn />
          </ViewerAction>
          <ViewerAction
            label="Zoom out"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
          >
            <ZoomOut />
          </ViewerAction>
          <ViewerAction
            label="Fullscreen"
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else void card.current?.requestFullscreen();
            }}
          >
            <Maximize />
          </ViewerAction>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-5">
          {url ? (
            item.file.ext === "pdf" ? (
              <iframe
                title="Original source file"
                src={`${url}#zoom=${Math.round(zoom * 100)}`}
                className="h-full min-h-[600px] w-full border-0"
              />
            ) : /png|jpe?g/i.test(item.file.ext) ? (
              <img
                alt={item.file.name}
                src={url}
                className="max-w-none"
                style={{ width: `${zoom * 100}%` }}
              />
            ) : (
              <div className="space-y-3">
                <h3 className={T.section}>{item.file.name}</h3>
                <p className={T.value}>Spreadsheet original preserved.</p>
                <Button asChild variant="outline">
                  <a href={url} download={item.file.name}>
                    Download original
                  </a>
                </Button>
              </div>
            )
          ) : (
            <div className="origin-top-left space-y-3" style={{ zoom }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-foreground">
                Sample document
              </p>
              {/*
                Whose name heads the document depends on which way it points.
                This read `vendor || customer || party`, and every AR item
                carries `vendor: "—"` precisely because a sales invoice has no
                vendor — so the facsimile for an invoice we issued was titled
                with an em dash.
              */}
              <h3 className={T.section}>
                {(item.route === "AR"
                  ? item.original.customer || item.original.invoice?.customer
                  : item.original.vendor !== "—" && item.original.vendor) ||
                  item.form.party}
              </h3>
              <p className={T.value}>{item.file.name}</p>
              <hr className="border-neutral-gray" />
              <dl className="space-y-1">
                <div className="flex gap-2">
                  <dt className={T.label}>
                    {item.route === "AR" ? "Invoice no" : "Invoice reference"}
                  </dt>
                  <dd className={T.cell}>
                    {item.original.bill?.supplierInvoiceNo ||
                      item.original.invoice?.invoiceNo ||
                      item.form.invoiceNo}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className={T.label}>Date</dt>
                  <dd className={T.cell}>
                    {item.original.bill?.billDate ||
                      item.original.invoice?.invoiceDate ||
                      item.form.date}
                  </dd>
                </div>
              </dl>
              <Table>
                <TableHeader className="bg-section">
                  <TableRow>
                    <TableHead className="text-xs font-medium">
                      Description
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium">
                      Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(
                    item.original.bill?.items ||
                    item.original.invoice?.items ||
                    item.form.lines.map((l) => ({
                      desc: l.description,
                      amount: l.amount,
                    }))
                  ).map((l, i) => (
                    <TableRow key={i}>
                      <TableCell className={T.cell}>{l.desc}</TableCell>
                      <TableCell
                        className={cn(T.cell, "text-right tabular-nums")}
                      >
                        {l.amount.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className={T.sub}>
                Bundled sample facsimile. Uploaded files retain their original
                bytes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** A header control: icon only, no chrome until you reach for it. */
const ViewerAction = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Button
    variant="ghost"
    size="icon-sm"
    aria-label={label}
    title={label}
    onClick={onClick}
    className="shrink-0 text-secondary-foreground hover:bg-accent hover:text-foreground [&_svg]:size-[18px]"
  >
    {children}
  </Button>
);
