import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "../../../components/marketing-shell";
import styles from "../help.module.css";

export const metadata: Metadata = {
  title: "Admin Manual · Help Center · Viva Career Academy",
  description:
    "Operating manual for VIVA admins — user management, course catalog, certification tests, certificates, branding, and the messaging center.",
  alternates: { canonical: "/help/admin" },
};

export default function AdminManualPage() {
  return (
    <MarketingShell activeHref="/help">
      <article className={styles.page}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/help">Help Center</Link> &rsaquo; Admin Manual
        </nav>

        <div className={styles.eyebrow}>Admin Manual</div>
        <h1 className={styles.title}>Running VIVA — the admin operating manual</h1>
        <p className={styles.subtitle}>
          Everything an admin can do on the platform, in the order you&rsquo;ll
          typically reach for it. Skim the contents, jump to the task, do the
          work. Each section also flags what NOT to do.
        </p>

        <nav className={styles.toc} aria-label="In this manual">
          <p className={styles.tocTitle}>In this manual</p>
          <ol className={styles.tocList}>
            <li><a href="#scope">What admin can and can&rsquo;t do</a></li>
            <li><a href="#dashboard">The admin dashboard</a></li>
            <li><a href="#user-management">User management</a></li>
            <li><a href="#catalog">The course catalog</a></li>
            <li><a href="#videos">Chapter videos</a></li>
            <li><a href="#tests">Certification tests</a></li>
            <li><a href="#certificates">Certificate manager</a></li>
            <li><a href="#audit">Catalog history (audit log)</a></li>
            <li><a href="#branding">Branding studio</a></li>
            <li><a href="#messages">Messaging center</a></li>
            <li><a href="#workflows">Common workflows</a></li>
            <li><a href="#safety">Safety rails &amp; what NOT to do</a></li>
          </ol>
        </nav>

        <section className={styles.section} id="scope">
          <div className={styles.sectionNumber}>01 · Scope</div>
          <h2 className={styles.sectionTitle}>
            <a href="#scope">What admin can and can&rsquo;t do</a>
          </h2>
          <p>
            The <strong>admin</strong> role is the highest-trust role on the
            platform. Admins can create and modify other users (including other
            admins), edit the course catalog, issue and revoke certificates,
            change branding, and send messages. Admins cannot change their own
            role (a self-demotion guard).
          </p>
          <h3>Roles at a glance</h3>
          <table className={styles.compareTable}>
            <thead>
              <tr>
                <th>Role</th>
                <th>Can do</th>
                <th>Can&rsquo;t do</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>admin</strong></td>
                <td>Everything below + user management + branding + catalog edits</td>
                <td>Change own role; bypass the payment gate for students</td>
              </tr>
              <tr>
                <td><strong>operations</strong></td>
                <td>Review applications, manage batches/cohorts, mark attendance, dispatch messages</td>
                <td>Edit the catalog, create users, change branding</td>
              </tr>
              <tr>
                <td><strong>trainer</strong></td>
                <td>Host sessions, mark attendance for own sessions, review own students&rsquo; submissions</td>
                <td>Access other trainers&rsquo; students; mass-dispatch messages</td>
              </tr>
              <tr>
                <td><strong>student</strong></td>
                <td>Their own dashboard only — own modules, own submissions, own certificate</td>
                <td>See anyone else&rsquo;s data</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className={styles.section} id="dashboard">
          <div className={styles.sectionNumber}>02 · Dashboard</div>
          <h2 className={styles.sectionTitle}>
            <a href="#dashboard">The admin dashboard</a>
          </h2>
          <p>
            Visit <Link href="/admin">/admin</Link>. The page is organised top-to-bottom by
            frequency of use:
          </p>
          <ol>
            <li><strong>Launch readiness</strong> — production status, a snapshot of integrations and blockers.</li>
            <li><strong>User management</strong> — create / edit accounts.</li>
            <li><strong>LMS console</strong> — courses, modules, content.</li>
            <li><strong>Chapter videos</strong> — paste YouTube URLs.</li>
            <li><strong>Certification test editor</strong> — design / edit tests.</li>
            <li><strong>Certificate manager</strong> — issue / revoke / view.</li>
            <li><strong>Catalog history</strong> — audit log of every change.</li>
            <li><strong>Branding studio</strong> — colours, copy, footer.</li>
          </ol>
          <div className={styles.callout + " " + styles.calloutTip}>
            <strong>Tip — keyboard navigation</strong>
            On any data table, you can keyboard-navigate rows. Tab to focus,
            arrow keys to move, Enter to open. Reduces accidental clicks on
            cluttered rosters.
          </div>
        </section>

        <section className={styles.section} id="user-management">
          <div className={styles.sectionNumber}>03 · Users</div>
          <h2 className={styles.sectionTitle}>
            <a href="#user-management">User management</a>
          </h2>
          <h3>Creating a new account</h3>
          <ol className={styles.steps}>
            <li>From the admin dashboard, scroll to <strong>User management</strong>.</li>
            <li>Click <strong>Create user</strong>.</li>
            <li>Enter full name, email, role (admin / operations / trainer), and an initial password (at least 8 chars).</li>
            <li>Click <strong>Save</strong>. The account is created immediately. Share the credentials securely with the user — over WhatsApp or a phone call rather than email.</li>
          </ol>
          <h3>Editing a user</h3>
          <ol>
            <li>Find the row in the users list (filter by role to narrow).</li>
            <li>Click <strong>Edit access</strong> on the row.</li>
            <li>Update name or role. The role select is disabled if you&rsquo;re editing yourself — admins can&rsquo;t change their own role.</li>
            <li>Save.</li>
          </ol>
          <h3>Removing access</h3>
          <p>
            We don&rsquo;t hard-delete user records (audit trail). Instead, change
            the user&rsquo;s role to <em>student</em> with a clearly-bogus password —
            they retain history but can&rsquo;t log in. For a former trainer or ops
            member, this is the right pattern.
          </p>
          <div className={styles.callout + " " + styles.calloutWarning}>
            <strong>Never share credentials over plain email</strong>
            Email is logged in three places and not all of them are under our
            control. Use a phone call, a secure messaging channel, or the
            in-platform password-reset (when it&rsquo;s live).
          </div>
        </section>

        <section className={styles.section} id="catalog">
          <div className={styles.sectionNumber}>04 · Catalog</div>
          <h2 className={styles.sectionTitle}>
            <a href="#catalog">The course catalog</a>
          </h2>
          <p>
            The course catalog is the single source of truth for what VIVA
            offers. Every surface that mentions a course — the homepage, the
            programmes page, the application form, Razorpay&rsquo;s description, the
            certificate page — reads from this catalog. Change it once, every
            surface updates within 60 seconds.
          </p>
          <h3>Where catalog data lives</h3>
          <p>
            Catalog data is in <code>apps/api/app/course_catalog.py</code>{" "}
            (server source-of-truth) and mirrored to the frontend ISR fallback
            at <code>apps/web/lib/courses-data.ts</code>. The admin UI doesn&rsquo;t
            yet have an in-product editor for the catalog itself; changes go
            through engineering for now. You&rsquo;ll see them in the catalog history
            once they ship.
          </p>
          <h3>Adding a new course</h3>
          <ol>
            <li>Decide the course code (e.g. <code>P&middot;06</code>), name, fee, and cohort dates.</li>
            <li>Write a 1-paragraph description matching the editorial tone of the existing courses.</li>
            <li>Hand the spec to engineering. They&rsquo;ll add it to <code>course_catalog.py</code>, deploy, and the new course appears across all surfaces.</li>
            <li>Within 60 seconds of deploy, the catalog history shows the new entry.</li>
          </ol>
        </section>

        <section className={styles.section} id="videos">
          <div className={styles.sectionNumber}>05 · Videos</div>
          <h2 className={styles.sectionTitle}>
            <a href="#videos">Chapter videos</a>
          </h2>
          <p>
            For chapters marked as <em>video</em> or <em>guest_speaker</em>, you
            paste a YouTube URL and the student LMS embeds it.
          </p>
          <h3>Recording &middot; upload &middot; paste flow</h3>
          <ol className={styles.steps}>
            <li>Record the session on VIVA&rsquo;s YouTube channel as <strong>Unlisted</strong> (not Private — Unlisted lets us embed; Private blocks embedding).</li>
            <li>Copy the YouTube URL (any form works: <code>youtu.be/xxx</code>, <code>youtube.com/watch?v=xxx</code>, etc.).</li>
            <li>Open <Link href="/admin">/admin</Link> &rsaquo; <strong>Chapter videos</strong>.</li>
            <li>Find the chapter by course code + week number.</li>
            <li>Paste the URL into the input. Live ID detection confirms it&rsquo;s valid (a small green tick appears).</li>
            <li>Click <strong>Save</strong>. The video is now live in the student LMS within a few seconds.</li>
          </ol>
          <div className={styles.callout + " " + styles.calloutWarning}>
            <strong>Unlisted, not Private</strong>
            Private videos cannot be embedded on third-party sites — students
            would see a black box instead of the video. Always Unlisted. The
            URL stays hidden from public YouTube search.
          </div>
        </section>

        <section className={styles.section} id="tests">
          <div className={styles.sectionNumber}>06 · Tests</div>
          <h2 className={styles.sectionTitle}>
            <a href="#tests">Certification tests</a>
          </h2>
          <p>
            Each course can have one certification test. Pass score, retake
            window, and question set are admin-configurable.
          </p>
          <h3>Designing a test</h3>
          <ol className={styles.steps}>
            <li>Admin dashboard &rsaquo; <strong>Certification test editor</strong>.</li>
            <li>Pick the course from the dropdown.</li>
            <li>Set the <strong>pass score</strong> (default 75%) and the <strong>retake window</strong> (default 14 days).</li>
            <li>Click <strong>Create test</strong>.</li>
            <li>Add questions one at a time. Two types are supported:
              <ul>
                <li><strong>True / False</strong> — type the correct answer as the literal string <code>true</code> or <code>false</code>.</li>
                <li><strong>Multiple choice</strong> — one option per line. In the <em>correct answer</em> field, type the exact text of the correct option.</li>
              </ul>
            </li>
            <li>Save each question. The student LMS shows the test as available once they&rsquo;re enrolled and the test is unlocked.</li>
          </ol>
          <h3>Editing after publishing</h3>
          <p>
            You can edit existing questions, add new ones, or remove ones that
            turned out to be unclear. Edits apply to <em>future</em> attempts —
            existing attempts retain their original score. If you want to
            invalidate prior scores, reach for the certificate manager (revoke).
          </p>
        </section>

        <section className={styles.section} id="certificates">
          <div className={styles.sectionNumber}>07 · Certificates</div>
          <h2 className={styles.sectionTitle}>
            <a href="#certificates">Certificate manager</a>
          </h2>
          <p>
            Certificates are normally auto-issued — when a student passes the
            certification test, a certificate is created within seconds. The
            certificate manager is for the cases where you need to step in
            manually.
          </p>
          <h3>Manual issue</h3>
          <ol>
            <li>Admin dashboard &rsaquo; <strong>Certificate manager</strong>.</li>
            <li>Click <strong>Issue manually</strong>.</li>
            <li>Enter the application ID (required), course ID (optional), and a notes field for the audit trail (recommended).</li>
            <li>Save. The cert appears in the table with a public verification URL.</li>
          </ol>
          <h3>Revoking a certificate</h3>
          <p>
            Use revoke when a certificate was issued in error, or when a student
            is found to have violated the honour code on the test. Revoke is
            <strong> immediate and public</strong> — the verification URL
            switches to a <em>not valid</em> state the moment you save.
          </p>
          <ol className={styles.steps}>
            <li>Find the cert row in the certificate table.</li>
            <li>Click <strong>Revoke</strong>.</li>
            <li>Enter a clear reason (this is stored on the audit trail — be precise).</li>
            <li>Confirm. The cert is revoked instantly.</li>
          </ol>
          <h3>Re-issuing after a correction</h3>
          <p>
            If a cert went out with the wrong name or date: revoke the old one,
            update the application record, then manually issue a new cert. The
            new cert gets a new URL; share it with the student.
          </p>
        </section>

        <section className={styles.section} id="audit">
          <div className={styles.sectionNumber}>08 · Audit log</div>
          <h2 className={styles.sectionTitle}>
            <a href="#audit">Catalog history</a>
          </h2>
          <p>
            Every change to the course catalog is logged automatically and
            visible at admin &rsaquo; <strong>Catalog history</strong>. The table shows:
          </p>
          <ul>
            <li>When the change happened (timestamp, UTC).</li>
            <li>Which course was affected.</li>
            <li>Which field changed (e.g. <code>fee_inr</code>, <code>coming_soon</code>).</li>
            <li>The before and after values.</li>
            <li>The commit SHA + commit message — links back to GitHub for the underlying code change.</li>
          </ul>
          <p>
            Used for: regulatory disclosures, dispute resolution, and a quick
            answer to questions like &ldquo;when did the P&middot;01 fee change?&rdquo;
          </p>
        </section>

        <section className={styles.section} id="branding">
          <div className={styles.sectionNumber}>09 · Branding</div>
          <h2 className={styles.sectionTitle}>
            <a href="#branding">Branding studio</a>
          </h2>
          <p>
            The branding studio at admin &rsaquo; <strong>Branding</strong> lets you
            adjust:
          </p>
          <ul>
            <li>Primary &amp; accent colours (used on buttons, headings, accents).</li>
            <li>Brand name (displayed in the navbar &amp; footer).</li>
            <li>Academy name (longer, used in certificates &amp; emails).</li>
            <li>Custom domain (if you ever onboard a white-label tenant).</li>
          </ul>
          <p>
            Changes apply immediately on save. The branding fields are
            tenant-scoped — for multi-tenant deployments each tenant has its
            own brand.
          </p>
        </section>

        <section className={styles.section} id="messages">
          <div className={styles.sectionNumber}>10 · Messages</div>
          <h2 className={styles.sectionTitle}>
            <a href="#messages">Messaging center</a>
          </h2>
          <p>
            The messages page at <Link href="/messages">/messages</Link> lets admins (and
            ops) send broadcast or targeted messages to students. Channels
            supported: email (via Resend) and WhatsApp (when configured).
          </p>
          <h3>Sending a broadcast</h3>
          <ol className={styles.steps}>
            <li>Open <Link href="/messages">/messages</Link>.</li>
            <li>Click <strong>New message</strong>.</li>
            <li>Pick audience: <em>all students</em>, <em>specific cohort</em>, <em>specific batch</em>, or <em>individual student</em>.</li>
            <li>Pick channel: <em>email</em>, <em>WhatsApp</em>, or both.</li>
            <li>Type subject + body. Markdown is supported in the body.</li>
            <li>Preview. Send.</li>
          </ol>
          <p>
            Every dispatch is logged in the message events table — who sent it,
            who received it, what status (delivered / bounced / failed). Useful
            for follow-up.
          </p>
        </section>

        <section className={styles.section} id="workflows">
          <div className={styles.sectionNumber}>11 · Workflows</div>
          <h2 className={styles.sectionTitle}>
            <a href="#workflows">Common workflows</a>
          </h2>
          <h3>Onboarding a new trainer</h3>
          <ol>
            <li>Create a user account with role <em>trainer</em>.</li>
            <li>Generate a one-time onboarding link via the trainer-invites section.</li>
            <li>Share the link with the trainer — they complete their profile (bio, photo, expertise) without you needing to handle each field.</li>
            <li>Once their profile lands, review &amp; approve it. They&rsquo;re now visible on the public trainers page.</li>
          </ol>
          <h3>Opening a coming-soon cohort for enrollment</h3>
          <ol>
            <li>Engineering flips the <code>coming_soon</code> flag on the course in the catalog.</li>
            <li>The catalog change is detected on the next read — the cohort-announce hook fires automatically.</li>
            <li>Every reservation-holder (students who paid the ₹5,000 advance) gets a balance-reminder email with a 14-day window.</li>
            <li>You don&rsquo;t need to do anything manually — but watch the messaging center to confirm sends went out.</li>
          </ol>
          <h3>Closing a cohort</h3>
          <ol>
            <li>Wait until every enrolled student has either passed or failed the certification test.</li>
            <li>Review the certificate manager — confirm every passing student has a cert.</li>
            <li>Pull the cohort report (placement, attendance, completion stats) from the operations workbench.</li>
            <li>Archive the cohort batch — sets it inactive but preserves all data.</li>
          </ol>
        </section>

        <section className={styles.section} id="safety">
          <div className={styles.sectionNumber}>12 · Safety</div>
          <h2 className={styles.sectionTitle}>
            <a href="#safety">Safety rails &amp; what NOT to do</a>
          </h2>
          <ul>
            <li><strong>Don&rsquo;t mark a student as paid by directly flipping <code>payment_stage</code>.</strong> The platform&rsquo;s revenue gate runs off the Razorpay webhook. If you need to record a cash or bank-transfer payment, write the application ID + amount to the operations team — there&rsquo;s a controlled override path being added.</li>
            <li><strong>Don&rsquo;t share an admin account.</strong> Each admin gets their own credentials. Audit logs only mean something if they identify a person.</li>
            <li><strong>Don&rsquo;t revoke a certificate without a documented reason.</strong> The reason is stored on the cert record forever and is visible to anyone with the verification URL.</li>
            <li><strong>Don&rsquo;t edit a student&rsquo;s name without a paper trail.</strong> If a student requests a name correction (typo, marriage, legal change), capture the request + supporting document before changing.</li>
            <li><strong>Don&rsquo;t bulk-message during exam hours.</strong> Coordinate with the trainer team so notifications don&rsquo;t distract students mid-test.</li>
          </ul>
          <div className={styles.callout}>
            <strong>If you see something weird</strong>
            Catalog audit log shows an unexpected change? A certificate URL
            doesn&rsquo;t render? A trainer can&rsquo;t access their roster? Take a
            screenshot, note the time, write to Narayan immediately. The system
            is multi-tenant-ready and most weird-looking issues turn out to be
            tenant-scoping questions.
          </div>
        </section>

        <nav className={styles.pageNav} aria-label="Manual navigation">
          <Link href="/help/student">
            <span>← Previous</span>
            <strong>Student Manual</strong>
          </Link>
          <Link href="/help/operations">
            <span>Next →</span>
            <strong>Operations Manual</strong>
          </Link>
        </nav>
      </article>
    </MarketingShell>
  );
}
