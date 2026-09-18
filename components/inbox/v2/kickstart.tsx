import React, { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Copy,
  FileText,
  Inbox,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import s from "./kickstart.module.css";

type Props = {
  companyName: string;
  email: string;
  maxFiles: number;
  onUpload: (files?: FileList) => void;
  onWhatsApp: () => void;
  onCopy: () => Promise<boolean>;
};
const steps = [
  { label: "Classify", icon: Inbox },
  { label: "Prepare", icon: FileText },
  { label: "Review", icon: ShieldCheck },
];

/** A bounded, interactive example explains intake without adding demo records. */
export default function InboxKickstart({
  companyName,
  email,
  maxFiles,
  onUpload,
  onWhatsApp,
  onCopy,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        setStep((current) => (current + 1) % steps.length);
      },
      step === 1 ? 3600 : 2400
    );
    return () => window.clearTimeout(timer);
  }, [step]);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const selectStep = (index: number) => {
    setStep(index);
  };
  return (
    <section aria-labelledby="inbox-kickstart-title" className={s.root}>
      <div className={s.split}>
        <div className={s.pitch}>
          <div className={s.intro}>
            <div className={s.eyebrow}>
              <span /> YOUR PAPERWORK, SIMPLIFIED
            </div>
            <h2 id="inbox-kickstart-title">
              All your documents. <span>One inbox.</span>
            </h2>
            <p>
              Send a bill, invoice, or journal. We’ll prepare the details. You
              review before anything is posted.
            </p>
          </div>

          <div className={s.demo} data-step={step} data-playing={true}>
            <div className={s.demoTop}>
              <span>How it works</span>
            </div>
            <div
              className={s.animationStage}
              aria-label={`Example: ${steps[step].label}`}
            >
              <div className={s.scene} aria-hidden="true">
                <div className={s.orbit} />
                <div className={s.orbitInner} />
                <div className={cn(s.paper, s.paperLeft)}>
                  <span className={s.paperLabel}>
                    <FileText size={13} /> BILL
                  </span>
                  <i />
                  <i />
                  <div className={s.paperTotal}>₹11,800</div>
                </div>
                <div className={cn(s.paper, s.paperRight)}>
                  <span className={s.paperLabel}>
                    <FileText size={13} /> INVOICE
                  </span>
                  <i />
                  <i />
                  <div className={s.paperRows}>
                    <b />
                    <b />
                    <b />
                  </div>
                </div>
                <div className={s.sparkleTile}>
                  <Sparkles size={19} />
                </div>
                <div className={s.inboxTile}>
                  {step === 1 ? (
                    <Sparkles size={36} strokeWidth={1.3} />
                  ) : (
                    <Inbox size={42} strokeWidth={1.3} />
                  )}
                  <span className={s.scanLine} />
                </div>
                <div className={s.reviewDocument}>
                  <div className={s.reviewHeading}>
                    <span>
                      <FileText size={16} /> Purchase bill
                    </span>
                    <span className={s.reviewBadge}>
                      <Check size={11} /> Ready to review
                    </span>
                  </div>
                  <div className={s.reviewVendor}>Acme Supplies</div>
                  <div className={s.reviewAmount}>
                    ₹11,800<span>GST included</span>
                  </div>
                  <div className={s.reviewFooter}>
                    <ShieldCheck size={13} /> Prepared for your approval
                  </div>
                </div>
                <div className={s.extractedFields}>
                  {["Vendor", "GST", "Total"].map((label, index) => (
                    <span
                      key={label}
                      style={{ "--index": index } as React.CSSProperties}
                    >
                      <Check size={11} />
                      {label}
                    </span>
                  ))}
                </div>
                <span className={s.starOne}>✦</span>
                <span className={s.starTwo}>✦</span>
              </div>
              <div className={s.sceneCaption}>
                <strong>
                  {
                    [
                      "Every document, one destination",
                      "The details take care of themselves",
                      "Prepared by AI. Approved by you.",
                    ][step]
                  }
                </strong>
                <p>
                  {
                    [
                      "Bills, invoices and journals come together in your inbox.",
                      "Reading vendor, GST and totals. Mapping your Tally ledgers.",
                      "Review your entry before anything is posted to Tally.",
                    ][step]
                  }
                </p>
              </div>
            </div>
            <div className={s.process} aria-label="Explore how Inbox works">
              {steps.map(({ label }, index) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={step === index}
                  data-complete={step > index}
                  onClick={() => selectStep(index)}
                >
                  <span className={s.stepMarker}>
                    {step > index ? (
                      <Check size={11} aria-hidden />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={s.intake}>
          <div className={s.intakeHeading}>
            <h3>Let’s get your inbox started</h3>
            <span>
              Receiving for <strong>{companyName}</strong>
            </span>
          </div>
          <div className={s.channels}>
            <article
              className={cn(s.channel, s.upload, dragOver && s.dragging)}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
                setDragOver(true);
              }}
              onDragLeave={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null
                  )
                )
                  setDragOver(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                if (event.dataTransfer.files.length)
                  onUpload(event.dataTransfer.files);
              }}
            >
              <span className={s.channelIcon}>
                <Upload size={23} aria-hidden />
              </span>
              <span className={s.channelNumber} aria-hidden="true">
                01
              </span>
              <div className={s.channelText}>
                <h4>{dragOver ? "Release to upload" : "Upload a document"}</h4>
                <p>Drop files here or browse your device.</p>
              </div>
              <div className={s.channelAction}>
                <Button className={s.uploadButton} onClick={() => onUpload()}>
                  <Upload size={16} aria-hidden /> Upload files{" "}
                  <ArrowRight size={16} aria-hidden />
                </Button>
                <span className={s.fileHint}>
                  PDF, JPG, PNG · Up to {maxFiles} files
                </span>
              </div>
              {dragOver && (
                <div className={s.dropHint} aria-hidden>
                  <ArrowDown size={32} />
                  <strong>Release to add your documents</strong>
                </div>
              )}
            </article>
            <article className={cn(s.channel, s.email)}>
              <span className={s.channelNumber} aria-hidden="true">
                02
              </span>
              <span className={s.channelIcon}>
                <Mail size={23} aria-hidden />
              </span>
              <div className={s.channelText}>
                <h4>Forward an email</h4>
                <p>Forward your bills and invoices.</p>
              </div>
              <div className={s.channelAction}>
                <div className={s.emailAddress}>
                  <code>{email}</code>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={
                      copied
                        ? "Email address copied"
                        : "Copy forwarding email address"
                    }
                    onClick={async () => setCopied(await onCopy())}
                  >
                    {copied ? <Check /> : <Copy />}
                  </Button>
                </div>
                {/* The visible hint is gone; the check icon carries the
                    confirmation on screen, this carries it to a reader. */}
                <span className="sr-only" role="status">
                  {copied ? "Address copied" : ""}
                </span>
              </div>
            </article>
            <article className={cn(s.channel, s.whatsapp)}>
              <span className={s.channelNumber} aria-hidden="true">
                03
              </span>
              <span className={s.channelIcon}>
                <MessageCircle size={23} aria-hidden />
              </span>
              <div className={s.channelText}>
                <h4>Send on WhatsApp</h4>
                <p>Send from your registered number.</p>
              </div>
              <div className={s.channelAction}>
                <Button
                  variant="ghost"
                  className={s.whatsappButton}
                  onClick={onWhatsApp}
                >
                  Set up WhatsApp <ArrowRight size={16} aria-hidden />
                </Button>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
