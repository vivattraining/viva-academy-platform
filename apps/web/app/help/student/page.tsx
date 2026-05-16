import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "../../../components/marketing-shell";
import styles from "../help.module.css";

export const metadata: Metadata = {
  title: "Student Manual · Help Center · Viva Career Academy",
  description:
    "A complete walk-through for VIVA students — from applying, paying, attending live sessions, completing chapters, and earning your certificate.",
  alternates: { canonical: "/help/student" },
};

export default function StudentManualPage() {
  return (
    <MarketingShell activeHref="/help">
      <article className={styles.page}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/help">Help Center</Link> &rsaquo; Student Manual
        </nav>

        <div className={styles.eyebrow}>Student Manual</div>
        <h1 className={styles.title}>Welcome to VIVA — your full walk-through</h1>
        <p className={styles.subtitle}>
          This guide covers everything from finding your programme to receiving
          your certificate. Each section is one task; skim the contents below and
          jump to what you need.
        </p>

        <nav className={styles.toc} aria-label="In this manual">
          <p className={styles.tocTitle}>In this manual</p>
          <ol className={styles.tocList}>
            <li><a href="#quick-start">Quick start (60 seconds)</a></li>
            <li><a href="#applying">Applying for a programme</a></li>
            <li><a href="#paying">Paying your fee</a></li>
            <li><a href="#reserving">Reserving a seat for a coming-soon cohort</a></li>
            <li><a href="#login">Logging in to the student portal</a></li>
            <li><a href="#dashboard">Your student dashboard</a></li>
            <li><a href="#chapters">Learning content — modules &amp; chapters</a></li>
            <li><a href="#live-sessions">Joining live sessions on Zoom</a></li>
            <li><a href="#submissions">Submitting assignments</a></li>
            <li><a href="#attendance">Attendance and progress</a></li>
            <li><a href="#certificate-test">Taking the certification test</a></li>
            <li><a href="#certificate">Your certificate</a></li>
            <li><a href="#account">Managing your account</a></li>
            <li><a href="#faq">Frequently asked questions</a></li>
            <li><a href="#contact">Getting help</a></li>
          </ol>
        </nav>

        <section className={styles.section} id="quick-start">
          <div className={styles.sectionNumber}>01 · Quick start</div>
          <h2 className={styles.sectionTitle}>
            <a href="#quick-start">The whole journey in 60 seconds</a>
          </h2>
          <p>
            Most VIVA students follow the same path. Here it is end-to-end:
          </p>
          <ol className={styles.steps}>
            <li>
              <strong>Apply</strong> at <Link href="/apply">vivacareeracademy.com/apply</Link>.
              Pick a programme, fill the form, submit.
            </li>
            <li>
              <strong>Pay</strong> the fee through Razorpay on the same page.
              You can pay full upfront or reserve a seat with ₹5,000 advance for
              coming-soon cohorts.
            </li>
            <li>
              You&rsquo;ll receive an email confirming the application. When your
              cohort goes live, you&rsquo;ll get login credentials.
            </li>
            <li>
              <strong>Log in</strong> at <Link href="/login">vivacareeracademy.com/login</Link>{" "}
              and explore your dashboard. Each module unlocks on its scheduled
              week.
            </li>
            <li>
              <strong>Attend live sessions</strong>, complete chapters, submit
              assignments, mark attendance — everything happens inside the
              student portal.
            </li>
            <li>
              <strong>Take the certification test</strong> at the end of the
              programme. Pass with 75% or higher and your certificate is
              auto-issued.
            </li>
            <li>
              <strong>Share your certificate</strong> — a public verification URL
              employers can use to confirm authenticity.
            </li>
          </ol>
          <div className={styles.callout}>
            <strong>Cohort start dates</strong>
            P&middot;01 cohort starts <em>26 May 2026</em>. Other programmes have
            their own announced start dates listed on the{" "}
            <Link href="/courses">Courses page</Link>.
          </div>
        </section>

        <section className={styles.section} id="applying">
          <div className={styles.sectionNumber}>02 · Applying</div>
          <h2 className={styles.sectionTitle}>
            <a href="#applying">Applying for a programme</a>
          </h2>
          <p>
            Visit <Link href="/apply">/apply</Link> from any page. The application form is
            two short sections — your details, then your programme choice.
          </p>
          <h3>Details we ask for</h3>
          <ul>
            <li><strong>Full name</strong> — exactly as on your ID. This is what appears on your certificate.</li>
            <li><strong>Email address</strong> — your login + every notification we send goes here. Use one you check daily.</li>
            <li><strong>Phone number</strong> — Indian mobile preferred. We use this for cohort reminders and the placement team will call.</li>
            <li><strong>Highest education</strong> — graduate, post-graduate, or diploma. Helps us understand your starting point.</li>
            <li><strong>Programme</strong> — pick the one you&rsquo;re applying for.</li>
          </ul>
          <h3>What happens after you submit</h3>
          <ol>
            <li>The page advances to the payment step.</li>
            <li>An email lands within a minute confirming the application — keep that email; it has your application ID.</li>
            <li>If your phone or email is already on a previous application for the same programme, we won&rsquo;t create a duplicate. You&rsquo;ll see a friendly note and a link to that earlier application.</li>
          </ol>
          <div className={styles.callout + " " + styles.calloutTip}>
            <strong>Tip — what counts as a programme</strong>
            Each VIVA programme has a code (e.g. <code>P&middot;01</code>) and a
            cohort label (e.g. <em>May 2026 cohort</em>). When you apply, you&rsquo;re
            applying to a specific code &middot; cohort combination. The fee is
            shown on the application page in clear ₹ terms — no surprises later.
          </div>
        </section>

        <section className={styles.section} id="paying">
          <div className={styles.sectionNumber}>03 · Paying</div>
          <h2 className={styles.sectionTitle}>
            <a href="#paying">Paying your fee through Razorpay</a>
          </h2>
          <p>
            Once your application is submitted, the page advances to payment.
            We use Razorpay — UPI, credit/debit cards, and netbanking all
            supported. The fee shown is GST-inclusive — what you see is what
            you pay.
          </p>
          <ol className={styles.steps}>
            <li>
              The <strong>Generate Payment Link</strong> button creates your
              Razorpay order tied to your application ID.
            </li>
            <li>
              Click <strong>Open Checkout</strong>. Razorpay&rsquo;s payment window
              opens — pick your method, complete the payment.
            </li>
            <li>
              On success Razorpay redirects you to{" "}
              <Link href="/payment/success">/payment/success</Link> with your
              receipt. Keep this URL — it has a token you can share with us if
              there&rsquo;s ever a reconciliation question.
            </li>
            <li>
              An enrollment-confirmation email arrives within a minute. If you
              don&rsquo;t see it within an hour, check spam, then write to us with
              your application ID.
            </li>
          </ol>
          <div className={styles.callout + " " + styles.calloutWarning}>
            <strong>If a payment fails or pauses mid-way</strong>
            Razorpay will redirect you to{" "}
            <Link href="/payment/failed">/payment/failed</Link>. You haven&rsquo;t been
            charged. Reopen the checkout from the same application page and try
            again. If your card was charged but the page didn&rsquo;t confirm, email
            us your application ID and Razorpay&rsquo;s payment ID — we&rsquo;ll reconcile
            within one working day.
          </div>
        </section>

        <section className={styles.section} id="reserving">
          <div className={styles.sectionNumber}>04 · Reserving</div>
          <h2 className={styles.sectionTitle}>
            <a href="#reserving">Reserving a seat for a coming-soon cohort</a>
          </h2>
          <p>
            For programmes marked <em>Coming soon</em> on the catalog (typically
            P&middot;03 / P&middot;04 / P&middot;05 etc.), you can hold a seat with
            a <strong>₹5,000 advance</strong> instead of the full fee. This guarantees
            your place when the cohort opens for enrollment.
          </p>
          <h3>How it works</h3>
          <ol>
            <li>Apply normally. The application page shows <em>Reserve a seat &middot; ₹5,000</em> instead of the full fee.</li>
            <li>Pay the ₹5,000 via Razorpay.</li>
            <li>You&rsquo;ll receive a reservation-confirmation email.</li>
            <li>When the cohort goes live (typically a few weeks before start), you&rsquo;ll receive a balance-reminder email with a link to pay the remaining fee. <em>You have 14 days</em> from that announcement to complete payment.</li>
            <li>Once the balance lands, you&rsquo;re fully enrolled and login credentials follow.</li>
          </ol>
          <h3>If you change your mind before the cohort opens</h3>
          <p>
            The ₹5,000 reservation is generally non-refundable but
            transferable — you can apply it to a different VIVA programme of
            equal or greater value within twelve months. Write to us if you need
            this; we handle each case in good faith.
          </p>
        </section>

        <section className={styles.section} id="login">
          <div className={styles.sectionNumber}>05 · Logging in</div>
          <h2 className={styles.sectionTitle}>
            <a href="#login">Logging in to the student portal</a>
          </h2>
          <p>
            Your student account is created automatically once payment lands.
            You&rsquo;ll receive an email titled <em>Your VIVA student login is ready</em>{" "}
            with your initial password.
          </p>
          <ol className={styles.steps}>
            <li>
              Visit <Link href="/login">/login</Link> from the top-right of any
              page (the <em>Sign in</em> link).
            </li>
            <li>
              Enter the email you applied with + the initial password from the
              email. Both fields are case-sensitive.
            </li>
            <li>
              Press Enter or click <strong>Sign in</strong>. You&rsquo;ll land on
              your <Link href="/student">Student dashboard</Link>.
            </li>
            <li>
              <strong>Change your password</strong> at first opportunity:
              dashboard &rsaquo; Settings &rsaquo; Change password. Pick something only
              you would know.
            </li>
          </ol>
          <div className={styles.callout + " " + styles.calloutWarning}>
            <strong>Forgot your password?</strong>
            We&rsquo;ll be rolling out a self-service reset shortly. Until then, email
            us from the address tied to your account and we&rsquo;ll send a fresh
            password within a working day.
          </div>
          <h3>Locked out after several attempts</h3>
          <p>
            After 5 wrong password attempts you&rsquo;ll be locked out for 15 minutes
            (a security measure against brute-force attacks). Wait it out and try
            again. The login page shows a countdown so you know when you can
            retry.
          </p>
        </section>

        <section className={styles.section} id="dashboard">
          <div className={styles.sectionNumber}>06 · Dashboard</div>
          <h2 className={styles.sectionTitle}>
            <a href="#dashboard">Your student dashboard</a>
          </h2>
          <p>
            The dashboard at <Link href="/student">/student</Link> is your home
            inside VIVA. Sections you&rsquo;ll see:
          </p>
          <ul>
            <li><strong>Welcome card</strong> — your name, programme, cohort start, and a quick view of payment status.</li>
            <li><strong>Modules</strong> — sixteen modules (for the P&middot;01 16-week programme) listed by week. Locked weeks show the unlock date; live weeks open into the chapter view.</li>
            <li><strong>Next live session</strong> — the upcoming Zoom session card with date, time, and a one-click <em>Join</em> button. Visible only when a session is within 48 hours.</li>
            <li><strong>Submissions</strong> — your past submissions and their review status.</li>
            <li><strong>Calendar</strong> — month view of all live sessions for your cohort. Open via the calendar icon.</li>
            <li><strong>Certification test</strong> — appears in the final weeks once unlocked.</li>
            <li><strong>Certificate</strong> — appears the moment you pass the test.</li>
          </ul>
          <div className={styles.callout + " " + styles.calloutTip}>
            <strong>Bookmark your dashboard</strong>
            Save <code>/student</code> to your browser&rsquo;s home screen on mobile —
            it works as a near-native app. Tap the share icon in Safari/Chrome
            &rsaquo; <em>Add to home screen</em>.
          </div>
        </section>

        <section className={styles.section} id="chapters">
          <div className={styles.sectionNumber}>07 · Learning content</div>
          <h2 className={styles.sectionTitle}>
            <a href="#chapters">Modules and chapters — how the content unlocks</a>
          </h2>
          <p>
            The P&middot;01 programme has 16 modules, each with several chapters.
            Each module unlocks on its scheduled week — you can&rsquo;t race ahead and
            you can&rsquo;t fall behind: the structure is designed so cohort discussion
            is meaningful.
          </p>
          <h3>Chapter types you&rsquo;ll see</h3>
          <ul>
            <li><strong>Video chapter</strong> — a recorded lesson, typically 20-40 minutes. YouTube unlisted, embedded in the page. No external account needed.</li>
            <li><strong>Guest speaker</strong> — same as video but featuring an industry guest.</li>
            <li><strong>Reading + question</strong> — written content followed by a question prompt; you submit a short paragraph response.</li>
            <li><strong>Assignment</strong> — a longer prompt requiring an attached document or written response.</li>
            <li><strong>Live session marker</strong> — links to the upcoming Zoom for that week.</li>
          </ul>
          <h3>Working through a module</h3>
          <ol className={styles.steps}>
            <li>Click into the module from your dashboard.</li>
            <li>Chapters are listed in order. Start at the top, work down.</li>
            <li>For video chapters: watch in-page. The video remembers where you left off.</li>
            <li>For reading + question: read, then type your response in the box and submit.</li>
            <li>The module shows your progress (e.g. <em>4 of 6 chapters complete</em>) as you go.</li>
          </ol>
          <div className={styles.callout + " " + styles.calloutWarning}>
            <strong>Video keeps buffering?</strong>
            Switch to a Wi-Fi network if you&rsquo;re on mobile data, or try lowering
            quality on the YouTube player (the gear icon). If problems persist,
            the trainer team can resend a download link for offline viewing —
            ask in your cohort WhatsApp group or email us.
          </div>
        </section>

        <section className={styles.section} id="live-sessions">
          <div className={styles.sectionNumber}>08 · Live sessions</div>
          <h2 className={styles.sectionTitle}>
            <a href="#live-sessions">Joining live sessions on Zoom</a>
          </h2>
          <p>
            Each week has one or two live sessions on Zoom — typically a trainer-led
            class plus a guest-faculty Q&amp;A. Sessions are 90 minutes,
            attendance counts, and recordings are uploaded within 24 hours for
            those who couldn&rsquo;t attend live.
          </p>
          <ol className={styles.steps}>
            <li>
              You&rsquo;ll see the next session on your dashboard 48 hours before
              start. The <strong>Join session</strong> button activates 10 minutes
              before the scheduled time.
            </li>
            <li>
              Clicking <strong>Join session</strong> opens Zoom — either the
              browser version or the installed app, whichever you have.
            </li>
            <li>
              Your attendance is logged automatically when you enter the meeting.
              No need to fill anything separately.
            </li>
            <li>
              After the session ends, the recording uploads within 24 hours and
              appears as a chapter for that week — you can rewatch any time.
            </li>
          </ol>
          <h3>Missed a session?</h3>
          <p>
            You&rsquo;re marked <em>absent</em> for that session. Watching the
            recording later doesn&rsquo;t convert it to <em>present</em> — attendance
            is for live participation only. The cohort has an attendance
            threshold; check with the operations team if you&rsquo;re worried about
            falling below it.
          </p>
        </section>

        <section className={styles.section} id="submissions">
          <div className={styles.sectionNumber}>09 · Submissions</div>
          <h2 className={styles.sectionTitle}>
            <a href="#submissions">Submitting assignments</a>
          </h2>
          <p>
            For chapters with a <em>Submit your response</em> field, type into
            the text box and click <strong>Submit</strong>. Submissions go
            straight to your trainer; you&rsquo;ll see their feedback in the same
            chapter view, usually within 3 working days.
          </p>
          <ul>
            <li><strong>Your text</strong> — paragraphs are fine, lists are fine, formatting markdown is supported.</li>
            <li><strong>One submission per chapter</strong> — your latest replaces previous.</li>
            <li><strong>Trainer feedback appears below your submission</strong> — usually a paragraph plus a graded outcome.</li>
            <li><strong>Edit window</strong> — you can update your submission until the trainer marks it reviewed. After that, it&rsquo;s locked.</li>
          </ul>
        </section>

        <section className={styles.section} id="attendance">
          <div className={styles.sectionNumber}>10 · Attendance</div>
          <h2 className={styles.sectionTitle}>
            <a href="#attendance">Attendance and progress</a>
          </h2>
          <p>
            Your progress and attendance roll up to the certification eligibility
            check. To take the final test, you need:
          </p>
          <ul>
            <li>Attendance at <strong>at least 75%</strong> of scheduled live sessions.</li>
            <li>Completion of <strong>at least 80%</strong> of submission-graded chapters.</li>
            <li>Your fee fully paid.</li>
          </ul>
          <p>
            The dashboard shows where you stand on each metric. If you&rsquo;re close
            to a threshold and unsure, the operations team can confirm your
            standing on request.
          </p>
        </section>

        <section className={styles.section} id="certificate-test">
          <div className={styles.sectionNumber}>11 · Certification test</div>
          <h2 className={styles.sectionTitle}>
            <a href="#certificate-test">Taking the certification test</a>
          </h2>
          <p>
            The test unlocks in the final weeks of your programme. It&rsquo;s online,
            time-bounded, and auto-graded.
          </p>
          <ol className={styles.steps}>
            <li>The test appears on your dashboard once unlocked.</li>
            <li>Click <strong>Take certification test</strong>. You&rsquo;ll see the question count and pass threshold (75%) up-front.</li>
            <li>Answer each question — True/False or multiple choice. There&rsquo;s no time pressure within reason; you can think and revise.</li>
            <li>Submit. Your score is shown immediately.</li>
            <li>If you pass: your certificate auto-issues within seconds. You&rsquo;ll see the certificate link on your dashboard.</li>
            <li>If you don&rsquo;t pass: you can retake the test once after a 14-day waiting period. Use the gap to revisit the modules you struggled with.</li>
          </ol>
          <div className={styles.callout + " " + styles.calloutTip}>
            <strong>Cohort cheating policy</strong>
            The test is taken under honour code — your trainer trusts you. Don&rsquo;t
            share answers in the cohort group; doing so devalues every student&rsquo;s
            certificate, including yours. Anything flagged by the system or your
            trainer triggers a review.
          </div>
        </section>

        <section className={styles.section} id="certificate">
          <div className={styles.sectionNumber}>12 · Your certificate</div>
          <h2 className={styles.sectionTitle}>
            <a href="#certificate">Your VIVA certificate</a>
          </h2>
          <p>
            When you pass the test, your certificate is issued automatically. It
            carries:
          </p>
          <ul>
            <li>Your full name (as you entered it in the application).</li>
            <li>Programme name, cohort, completion date.</li>
            <li>VIVA brand mark + faculty signatures.</li>
            <li>A unique verification token — anyone with the URL can confirm authenticity.</li>
          </ul>
          <h3>Where to find it</h3>
          <ol>
            <li>From your dashboard, the <strong>Certificate</strong> card shows a <em>View</em> link.</li>
            <li>Click it — the certificate renders inline in your browser.</li>
            <li>Use your browser&rsquo;s <strong>Print &middot; Save as PDF</strong> to download for sharing.</li>
          </ol>
          <h3>Sharing your certificate</h3>
          <p>
            The certificate URL is at <code>/certificates/&lt;your-token&gt;</code>{" "}
            (e.g. for sharing on LinkedIn under Licenses &amp; Certifications):
          </p>
          <ul>
            <li><strong>LinkedIn</strong> &rsaquo; <em>Add licenses &amp; certifications</em> &rsaquo; paste the URL as <em>Credential URL</em>.</li>
            <li><strong>Resume</strong> &rsaquo; include the URL and credential ID (visible on the cert).</li>
            <li><strong>Employer verification</strong> &rsaquo; the verification page shows authenticity in a single glance.</li>
          </ul>
          <div className={styles.callout + " " + styles.calloutWarning}>
            <strong>If your certificate has the wrong name or date</strong>
            We can re-issue. Email us immediately with your current cert URL and
            the correct details. The old cert URL will be marked revoked; the
            new one takes its place.
          </div>
        </section>

        <section className={styles.section} id="account">
          <div className={styles.sectionNumber}>13 · Account</div>
          <h2 className={styles.sectionTitle}>
            <a href="#account">Managing your account</a>
          </h2>
          <p>
            From <Link href="/student/settings">/student/settings</Link> you can:
          </p>
          <ul>
            <li>Change your password.</li>
            <li>Update your contact phone number.</li>
            <li>View payment history and download receipts.</li>
            <li>Log out from this device — useful on a shared computer.</li>
          </ul>
          <p>
            <strong>What you can&rsquo;t change yourself</strong>: your name (as it
            appears on certificates) and your email address. Those have to go
            through our team so we can keep an audit trail. Write to us with the
            change request; we&rsquo;ll update within one working day.
          </p>
        </section>

        <section className={styles.section} id="faq">
          <div className={styles.sectionNumber}>14 · FAQ</div>
          <h2 className={styles.sectionTitle}>
            <a href="#faq">Frequently asked questions</a>
          </h2>
          <div className={styles.faq}>
            <details className={styles.faqItem}>
              <summary>I applied but didn&rsquo;t get the confirmation email — what now?</summary>
              <p>
                Check your spam folder first. Gmail is the usual culprit. If
                it&rsquo;s not there after an hour, write to us with the email and
                phone you applied with — we&rsquo;ll resend it manually.
              </p>
            </details>
            <details className={styles.faqItem}>
              <summary>Can I switch programmes after I apply?</summary>
              <p>
                Yes, before payment. After payment we treat it as a refund-and-
                reapply or apply-the-fee-forward case — depends on the difference
                in fee. Email us within 7 days of applying and we&rsquo;ll handle it.
              </p>
            </details>
            <details className={styles.faqItem}>
              <summary>What devices does the student portal work on?</summary>
              <p>
                Any modern browser on desktop, tablet, or phone. Chrome and
                Safari recent versions are most-tested. Video playback needs an
                internet connection &mdash; everything else (reading content,
                writing submissions) works fine on patchy connections.
              </p>
            </details>
            <details className={styles.faqItem}>
              <summary>Will I get a refund if I drop out?</summary>
              <p>
                The refund policy is on the disclosures page and is summarised in
                the cohort welcome email. Short version: within 7 days of cohort
                start, partial refund minus admin fee. After that, fees are
                non-refundable but the placement support stays available for 12
                months from your enrollment date.
              </p>
            </details>
            <details className={styles.faqItem}>
              <summary>Does VIVA help with placements?</summary>
              <p>
                Yes. The placement team works with you on interview prep and
                introduces you to hiring partners. Certified students who clear
                the test at the threshold score are covered by a placement
                guarantee — details on the disclosures page.
              </p>
            </details>
            <details className={styles.faqItem}>
              <summary>Can I attend a session if my Zoom audio isn&rsquo;t working?</summary>
              <p>
                Yes — you can still join via chat. Use the chat to interact and
                let the trainer know your audio is down. The session host can
                also let you call in by phone in a pinch; ask in the chat for
                the dial-in details.
              </p>
            </details>
            <details className={styles.faqItem}>
              <summary>What if I miss the certification test window?</summary>
              <p>
                You can take the test at any point during the test-open window
                (typically 14 days at the end of your programme). If you miss
                the window entirely, the operations team can re-open it once,
                with a one-week extension. After that the test is locked until
                the next cohort window.
              </p>
            </details>
            <details className={styles.faqItem}>
              <summary>Can my employer verify my certificate?</summary>
              <p>
                Yes. The verification URL is public — your employer pastes it
                in any browser and the page confirms validity, your name, the
                programme, and the issue date. They don&rsquo;t need a VIVA account.
              </p>
            </details>
          </div>
        </section>

        <section className={styles.section} id="contact">
          <div className={styles.sectionNumber}>15 · Contact</div>
          <h2 className={styles.sectionTitle}>
            <a href="#contact">Getting help</a>
          </h2>
          <p>If something in this manual doesn&rsquo;t match what you&rsquo;re seeing on screen, or you&rsquo;d rather talk to a human:</p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:hello@vivacareeracademy.com">hello@vivacareeracademy.com</a></li>
            <li><strong>Phone / WhatsApp:</strong> <a href="tel:+919876543210">+91 98765 43210</a> · Mon-Fri 10am-6pm IST</li>
            <li><strong>Cohort WhatsApp group</strong> — once you&rsquo;re enrolled, you&rsquo;ll be added. Trainers and operations are in the group too.</li>
          </ul>
          <p>
            Always include your application ID or student email when you write
            in — it lets the team find your record without a back-and-forth.
          </p>
        </section>

        <nav className={styles.pageNav} aria-label="Manual navigation">
          <Link href="/help">
            <span>← All manuals</span>
            <strong>Help Center</strong>
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
