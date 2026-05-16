import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "../../../components/marketing-shell";
import styles from "../help.module.css";

export const metadata: Metadata = {
  title: "Operations Manual · Help Center · Viva Career Academy",
  description:
    "Day-to-day operating manual for VIVA operations — applications review, batches, attendance, payment reconciliation, and student communications.",
  alternates: { canonical: "/help/operations" },
};

export default function OperationsManualPage() {
  return (
    <MarketingShell activeHref="/help">
      <article className={styles.page}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/help">Help Center</Link> &rsaquo; Operations Manual
        </nav>

        <div className={styles.eyebrow}>Operations Manual</div>
        <h1 className={styles.title}>Running the cohort — the operations playbook</h1>
        <p className={styles.subtitle}>
          The operations role is where the cohort actually runs. Every applicant
          you review, every batch you create, every payment you reconcile, every
          attendance roll you mark — that&rsquo;s the heartbeat of VIVA week to week.
        </p>

        <nav className={styles.toc} aria-label="In this manual">
          <p className={styles.tocTitle}>In this manual</p>
          <ol className={styles.tocList}>
            <li><a href="#scope">What ops can and can&rsquo;t do</a></li>
            <li><a href="#dashboard">The operations workbench</a></li>
            <li><a href="#applications">Reviewing applications</a></li>
            <li><a href="#batches">Batches &amp; cohorts</a></li>
            <li><a href="#enrolling">Enrolling a student</a></li>
            <li><a href="#attendance">Attendance &amp; the live-session roll</a></li>
            <li><a href="#payments">Payment reconciliation</a></li>
            <li><a href="#refunds">Refunds &amp; cohort transfers</a></li>
            <li><a href="#messages">Sending student communications</a></li>
            <li><a href="#weekly">A typical week — the ops checklist</a></li>
            <li><a href="#escalation">When to escalate to admin</a></li>
          </ol>
        </nav>

        <section className={styles.section} id="scope">
          <div className={styles.sectionNumber}>01 · Scope</div>
          <h2 className={styles.sectionTitle}>
            <a href="#scope">What ops can and can&rsquo;t do</a>
          </h2>
          <p>
            <strong>Operations</strong> is the day-to-day hands-on role. Ops
            sees and acts on the cohort but can&rsquo;t change platform-wide things
            like the catalog or branding. The split between ops and admin is
            intentional: ops moves fast on student-facing work without risking
            global changes.
          </p>
          <h3>What you can do</h3>
          <ul>
            <li>Review every application — approve, defer, reject, archive.</li>
            <li>Create and manage batches (cohort instances of a course).</li>
            <li>Mark students as <em>enrolled</em>, <em>active</em>, <em>completed</em>.</li>
            <li>Mark attendance for any session.</li>
            <li>View payment records and flag reconciliation issues.</li>
            <li>Send broadcast and targeted messages to students.</li>
          </ul>
          <h3>What only admin can do (escalate up)</h3>
          <ul>
            <li>Create or modify user accounts (trainer, ops, admin).</li>
            <li>Edit the course catalog (fee, cohort dates, descriptions).</li>
            <li>Issue or revoke certificates manually.</li>
            <li>Change branding (colours, names, custom domain).</li>
            <li>Override the payment gate for a student (controlled path).</li>
          </ul>
        </section>

        <section className={styles.section} id="dashboard">
          <div className={styles.sectionNumber}>02 · Workbench</div>
          <h2 className={styles.sectionTitle}>
            <a href="#dashboard">The operations workbench</a>
          </h2>
          <p>
            Your home page is <Link href="/operations">/operations</Link>. Sections:
          </p>
          <ul>
            <li><strong>Today&rsquo;s queue</strong> — applications + payments that need a decision right now.</li>
            <li><strong>This week&rsquo;s sessions</strong> — live sessions across all active batches, with attendance status.</li>
            <li><strong>Active batches</strong> — cohorts currently running.</li>
            <li><strong>Recent payments</strong> — last 7 days of payment events with Razorpay reference IDs.</li>
            <li><strong>Messages outbox</strong> — what got dispatched, what bounced.</li>
          </ul>
          <p>
            The <Link href="/admissions">admissions workbench</Link> and{" "}
            <Link href="/roster">roster page</Link> are the two surfaces you&rsquo;ll bounce
            between most. Both are linked from the operations dashboard.
          </p>
        </section>

        <section className={styles.section} id="applications">
          <div className={styles.sectionNumber}>03 · Applications</div>
          <h2 className={styles.sectionTitle}>
            <a href="#applications">Reviewing applications</a>
          </h2>
          <p>
            New applications arrive via the public <Link href="/apply">/apply</Link> form.
            Every application starts in <em>submitted</em> stage; ops reviews,
            then advances or defers.
          </p>
          <h3>Application lifecycle stages</h3>
          <ul>
            <li><strong>submitted</strong> — student filled the form, hasn&rsquo;t paid yet.</li>
            <li><strong>paid</strong> — Razorpay webhook confirmed payment. Triggered automatically.</li>
            <li><strong>enrolled</strong> — ops has assigned them to a batch. Student now sees full LMS access.</li>
            <li><strong>active</strong> — cohort has started; student is participating.</li>
            <li><strong>in_progress</strong> — past mid-cohort, on track.</li>
            <li><strong>completed</strong> — finished the cohort, passed or failed the test.</li>
            <li><strong>certificate_issued</strong> — passed + cert auto-issued.</li>
            <li><strong>archived</strong> — withdrew, refunded, or never enrolled.</li>
          </ul>
          <h3>Reviewing a fresh application</h3>
          <ol className={styles.steps}>
            <li>Open <Link href="/admissions">/admissions</Link>. Filter by stage = <em>submitted</em> or <em>paid</em>.</li>
            <li>Click into the row. You see name, contact, programme, source, education, and payment status.</li>
            <li>Decide the action — usually: <em>enrolled</em> + assign to the right batch. Click <strong>Mark enrolled</strong>.</li>
            <li>The student receives the enrollment-confirmation email + login credentials.</li>
          </ol>
          <div className={styles.callout + " " + styles.calloutTip}>
            <strong>Trust the payment stage</strong>
            If the application shows <em>payment_stage: paid</em> it means
            Razorpay confirmed the capture and the webhook signed it. You can
            enroll immediately. If it shows <em>pending</em> and you have
            independent confirmation (cash, bank transfer), don&rsquo;t flip it
            yourself — escalate to admin so the controlled override path is
            used.
          </div>
        </section>

        <section className={styles.section} id="batches">
          <div className={styles.sectionNumber}>04 · Batches</div>
          <h2 className={styles.sectionTitle}>
            <a href="#batches">Batches &amp; cohorts</a>
          </h2>
          <p>
            A <strong>batch</strong> is a specific cohort instance of a course
            — e.g. <em>P&middot;01 May 2026 batch</em>. Each batch has start and
            end dates, a roster of enrolled students, scheduled sessions, and a
            primary trainer.
          </p>
          <h3>Creating a batch</h3>
          <ol className={styles.steps}>
            <li>Operations dashboard &rsaquo; <strong>Batches</strong> &rsaquo; <strong>New batch</strong>.</li>
            <li>Pick the course (e.g. <code>P&middot;01</code>).</li>
            <li>Set start date and expected end date.</li>
            <li>Assign the primary trainer (must already exist as a user).</li>
            <li>Save. The batch appears in the active-batches list with capacity = 24 (the default for the small-group format).</li>
          </ol>
          <h3>Assigning students to a batch</h3>
          <p>
            When you mark an application <em>enrolled</em>, the system attempts
            to auto-assign to the most-recently-updated batch for that course
            code. If you want to assign to a specific batch instead:
          </p>
          <ol>
            <li>Open the application row.</li>
            <li>Click <strong>Reassign batch</strong>.</li>
            <li>Pick the target batch from the dropdown.</li>
            <li>Save.</li>
          </ol>
        </section>

        <section className={styles.section} id="enrolling">
          <div className={styles.sectionNumber}>05 · Enrolling</div>
          <h2 className={styles.sectionTitle}>
            <a href="#enrolling">Enrolling a student — the standard flow</a>
          </h2>
          <ol className={styles.steps}>
            <li>New application arrives. You see it in the <em>submitted</em> queue.</li>
            <li>Student pays via Razorpay. The webhook flips the application to <em>paid</em> within seconds.</li>
            <li>You open the row, verify everything looks right (name spelling, programme match), click <strong>Mark enrolled</strong>.</li>
            <li>Student receives:
              <ul>
                <li>Enrollment-confirmation email.</li>
                <li>Login credentials email.</li>
                <li>WhatsApp message with the cohort group invite link (when configured).</li>
              </ul>
            </li>
            <li>Student logs in to the portal and sees the locked modules + first live session date.</li>
          </ol>
          <h3>If the student didn&rsquo;t receive credentials</h3>
          <p>
            Check the messages outbox — was the email dispatched? If <em>sent</em>{" "}
            but not received, ask the student to check spam, then forward you
            their email confirmation as evidence. You can re-send via{" "}
            <Link href="/messages">/messages</Link>. If the message wasn&rsquo;t dispatched
            at all (status: <em>failed</em>), the integration may be down —
            escalate to admin.
          </p>
        </section>

        <section className={styles.section} id="attendance">
          <div className={styles.sectionNumber}>06 · Attendance</div>
          <h2 className={styles.sectionTitle}>
            <a href="#attendance">Attendance &amp; the live-session roll</a>
          </h2>
          <p>
            Attendance is logged two ways: automatically when a student joins
            the Zoom meeting (the Zoom webhook fires) and manually by ops or
            the trainer for edge cases.
          </p>
          <h3>The auto path</h3>
          <p>
            The Zoom webhook fires <em>participant joined</em> and{" "}
            <em>participant left</em> events. The platform records these and
            marks attendance status as <em>present</em> if a student was in the
            meeting for at least 30 minutes. No action from you.
          </p>
          <h3>Manual corrections</h3>
          <ol>
            <li>Operations dashboard &rsaquo; <strong>This week&rsquo;s sessions</strong>.</li>
            <li>Click into the session row.</li>
            <li>You see the roster with auto-detected attendance status.</li>
            <li>Override where needed — set a student to <em>present</em>, <em>absent</em>, or <em>excused</em>.</li>
            <li>If you set <em>excused</em>, enter a short reason for the audit trail.</li>
            <li>Save.</li>
          </ol>
          <div className={styles.callout + " " + styles.calloutTip}>
            <strong>Finalising attendance</strong>
            There&rsquo;s a daily cron at 17:30 UTC (11:00 PM IST) that finalises
            attendance for any session whose window has ended. After
            finalisation, students who were not present and not excused are
            recorded as absent for the certification-eligibility calculation.
            Make manual corrections before that cron fires.
          </div>
        </section>

        <section className={styles.section} id="payments">
          <div className={styles.sectionNumber}>07 · Payments</div>
          <h2 className={styles.sectionTitle}>
            <a href="#payments">Payment reconciliation</a>
          </h2>
          <p>
            99% of payments happen automatically through Razorpay. The 1% that
            need ops attention:
          </p>
          <h3>The student paid but the application still shows pending</h3>
          <ol>
            <li>Ask the student for their Razorpay payment ID (it&rsquo;s in their bank/UPI statement).</li>
            <li>Check the payments list in the ops dashboard — search by Razorpay ID.</li>
            <li>If you can see the payment but the application isn&rsquo;t linked: there&rsquo;s a reference mismatch. Capture the payment ID + application ID and write to admin/engineering — they&rsquo;ll reconcile.</li>
            <li>If the payment isn&rsquo;t in our system at all: the webhook didn&rsquo;t arrive. Pull the Razorpay dashboard, confirm the payment captured, then have admin manually mark paid via the controlled override.</li>
          </ol>
          <h3>The student wants a receipt</h3>
          <p>
            Every payment generates a public receipt page at{" "}
            <code>/payment/receipt/&lt;applicationId&gt;?tenant=...</code>. The
            link is in the enrollment-confirmation email. If the student lost
            it, you can find their application, click <strong>Receipt</strong>,
            and copy the link to share.
          </p>
        </section>

        <section className={styles.section} id="refunds">
          <div className={styles.sectionNumber}>08 · Refunds</div>
          <h2 className={styles.sectionTitle}>
            <a href="#refunds">Refunds &amp; cohort transfers</a>
          </h2>
          <p>
            Refunds are an admin-only action because they touch money. Your role
            is to capture the case clearly and pass it up.
          </p>
          <h3>Capturing a refund request</h3>
          <ol>
            <li>Get the student&rsquo;s written request (email or WhatsApp — saved).</li>
            <li>Note application ID, programme, fee paid, days since payment, and the stated reason.</li>
            <li>Mark the application as <em>refund_requested</em> with a note containing the above.</li>
            <li>Notify admin with a short summary. Admin reviews against the refund policy and processes via Razorpay.</li>
            <li>Once the refund clears, admin will archive the application. You&rsquo;ll see it move to <em>archived</em>.</li>
          </ol>
          <h3>Cohort transfers</h3>
          <p>
            Sometimes a student needs to defer to a later cohort (medical, work
            emergency). The standard approach is: keep the fee, transfer the
            student to the next cohort batch, send a confirmation. No money
            changes hands.
          </p>
          <ol>
            <li>Confirm there&rsquo;s capacity in the target batch.</li>
            <li>Reassign the student&rsquo;s application to the new batch.</li>
            <li>Send them a transfer-confirmation message via{" "}
            <Link href="/messages">/messages</Link>.</li>
            <li>Note the transfer reason in the application&rsquo;s notes.</li>
          </ol>
        </section>

        <section className={styles.section} id="messages">
          <div className={styles.sectionNumber}>09 · Messages</div>
          <h2 className={styles.sectionTitle}>
            <a href="#messages">Sending student communications</a>
          </h2>
          <p>
            The messaging center at <Link href="/messages">/messages</Link> is where ops
            sends broadcast or targeted messages.
          </p>
          <h3>Targeting</h3>
          <ul>
            <li><strong>All students</strong> — broadcast (use sparingly; you&rsquo;ll dilute the signal).</li>
            <li><strong>By cohort</strong> — e.g. &ldquo;P&middot;01 May 2026 batch&rdquo; — the bread-and-butter scope.</li>
            <li><strong>By individual</strong> — for personal follow-ups.</li>
          </ul>
          <h3>Channels</h3>
          <ul>
            <li><strong>Email</strong> via Resend. Best for longer / formal content.</li>
            <li><strong>WhatsApp</strong> (when the WhatsApp template is configured). Best for time-sensitive nudges.</li>
            <li><strong>Both</strong> for important announcements (e.g. cohort start date).</li>
          </ul>
          <h3>What to write</h3>
          <ul>
            <li>Keep subject lines short and specific. &ldquo;P&middot;01 — session moved to Saturday&rdquo; beats &ldquo;Important update.&rdquo;</li>
            <li>Open with the action item — what the student needs to do, if anything.</li>
            <li>Sign off with a contact for replies (so they don&rsquo;t reply-all to the broadcast).</li>
          </ul>
          <div className={styles.callout + " " + styles.calloutWarning}>
            <strong>Triple-check broadcasts</strong>
            A broadcast goes to everyone immediately. There&rsquo;s no recall. Have a
            colleague read the message before you click send — even one
            re-read catches most issues.
          </div>
        </section>

        <section className={styles.section} id="weekly">
          <div className={styles.sectionNumber}>10 · Weekly</div>
          <h2 className={styles.sectionTitle}>
            <a href="#weekly">A typical week — the ops checklist</a>
          </h2>
          <p>
            What a healthy operations week looks like, day by day:
          </p>
          <h3>Monday</h3>
          <ul>
            <li>Clear the application queue accumulated over the weekend.</li>
            <li>Confirm last week&rsquo;s attendance was finalised correctly.</li>
            <li>Send the week-ahead message to active cohorts (session times, expected submissions).</li>
          </ul>
          <h3>Tuesday – Thursday</h3>
          <ul>
            <li>Same-day enrollment for any payments received the day before.</li>
            <li>Monitor live sessions — be available in the cohort WhatsApp group for Zoom hiccups.</li>
            <li>Mark attendance corrections before the daily cron fires.</li>
          </ul>
          <h3>Friday</h3>
          <ul>
            <li>Review the weekly cohort report — completion %, attendance %, payments owed.</li>
            <li>Flag anyone whose attendance dropped below 75% for a check-in.</li>
            <li>Send the weekend-prep message (any catch-up reading, optional resources).</li>
          </ul>
          <h3>Monthly</h3>
          <ul>
            <li>Review payment reconciliation — every Razorpay payment should map to one application.</li>
            <li>Audit the certificates issued in the last 30 days against the test pass list.</li>
            <li>Sync with admin on the next month&rsquo;s cohort planning.</li>
          </ul>
        </section>

        <section className={styles.section} id="escalation">
          <div className={styles.sectionNumber}>11 · Escalation</div>
          <h2 className={styles.sectionTitle}>
            <a href="#escalation">When to escalate to admin</a>
          </h2>
          <p>
            Don&rsquo;t hesitate. Escalation isn&rsquo;t a sign of weakness — these are
            the cases where the platform&rsquo;s audit trail and role boundaries are
            explicitly designed for someone else to act:
          </p>
          <ul>
            <li><strong>Money out</strong> — refunds, partial refunds, fee waivers. Always admin.</li>
            <li><strong>Catalog changes</strong> — fee change, cohort date change, new programme.</li>
            <li><strong>Certificate issues</strong> — wrong name on a cert, suspected cheating, revocation request.</li>
            <li><strong>Suspected duplicate-application fraud</strong> — same person under different emails.</li>
            <li><strong>Trainer or ops account changes</strong> — new hire, role change, removal.</li>
            <li><strong>Branding or copy changes</strong> — name spelling on the homepage, footer email address, etc.</li>
            <li><strong>Anything legal</strong> — student threatens to sue, regulator inquiry, RTI-like request.</li>
            <li><strong>Anything that feels weird</strong> — trust the instinct.</li>
          </ul>
          <p>
            How to escalate: WhatsApp first for urgent (under-30-min response
            needed), email for everything else. Always include:
          </p>
          <ul>
            <li>Application ID or student email (whichever you have).</li>
            <li>What happened (one paragraph).</li>
            <li>What you tried (one paragraph).</li>
            <li>What you think the right next action is (one sentence).</li>
          </ul>
        </section>

        <nav className={styles.pageNav} aria-label="Manual navigation">
          <Link href="/help/admin">
            <span>← Previous</span>
            <strong>Admin Manual</strong>
          </Link>
          <Link href="/help/trainer">
            <span>Next →</span>
            <strong>Trainer Manual</strong>
          </Link>
        </nav>
      </article>
    </MarketingShell>
  );
}
