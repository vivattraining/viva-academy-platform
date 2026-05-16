import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "../../../components/marketing-shell";
import styles from "../help.module.css";

export const metadata: Metadata = {
  title: "Trainer Manual · Help Center · Viva Career Academy",
  description:
    "Everything a VIVA trainer needs — onboarding, profile management, hosting live sessions, uploading recordings, marking attendance, and reviewing student submissions.",
  alternates: { canonical: "/help/trainer" },
};

export default function TrainerManualPage() {
  return (
    <MarketingShell activeHref="/help">
      <article className={styles.page}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/help">Help Center</Link> &rsaquo; Trainer Manual
        </nav>

        <div className={styles.eyebrow}>Trainer Manual</div>
        <h1 className={styles.title}>Trainer&rsquo;s handbook for VIVA</h1>
        <p className={styles.subtitle}>
          You bring the expertise; the platform handles the logistics. This
          handbook walks through everything you&rsquo;ll touch — from your first
          login to your last cohort review.
        </p>

        <nav className={styles.toc} aria-label="In this manual">
          <p className={styles.tocTitle}>In this manual</p>
          <ol className={styles.tocList}>
            <li><a href="#welcome">Welcome &amp; first 24 hours</a></li>
            <li><a href="#onboarding">Completing your trainer profile</a></li>
            <li><a href="#dashboard">Your trainer dashboard</a></li>
            <li><a href="#sessions">Hosting live sessions on Zoom</a></li>
            <li><a href="#recordings">Recording &amp; uploading</a></li>
            <li><a href="#attendance">Marking attendance</a></li>
            <li><a href="#submissions">Reviewing student submissions</a></li>
            <li><a href="#feedback">Giving useful feedback</a></li>
            <li><a href="#communication">Student communication</a></li>
            <li><a href="#expectations">Cadence &amp; expectations</a></li>
            <li><a href="#escalation">When to ask for help</a></li>
          </ol>
        </nav>

        <section className={styles.section} id="welcome">
          <div className={styles.sectionNumber}>01 · Welcome</div>
          <h2 className={styles.sectionTitle}>
            <a href="#welcome">Welcome &amp; first 24 hours</a>
          </h2>
          <p>
            Welcome aboard. You&rsquo;ve been invited by an admin and should have
            received a one-time onboarding link via email or WhatsApp. The link
            takes you to a single page where you&rsquo;ll set your password and fill
            out your trainer profile.
          </p>
          <h3>What to do today</h3>
          <ol className={styles.steps}>
            <li>Click your onboarding link. (If it&rsquo;s expired, ask the admin who invited you for a fresh one — links expire after 7 days.)</li>
            <li>Set a strong password. You won&rsquo;t see this again — write it down somewhere safe.</li>
            <li>Fill out your profile (bio, expertise, photo). See the next section for what makes a strong profile.</li>
            <li>Hit save. The admin team will review and publish your profile within one working day.</li>
            <li>Once approved, you&rsquo;ll appear on the public <Link href="/trainers">trainers page</Link> and the cohort you&rsquo;re assigned to.</li>
          </ol>
          <h3>What you don&rsquo;t need to do</h3>
          <p>
            You don&rsquo;t need to set up Zoom yourself — meetings are provisioned
            by the platform when a session is scheduled. You don&rsquo;t need to
            send your own attendance sheet — the system tracks it. You don&rsquo;t
            need to maintain your own calendar — sessions land on your trainer
            dashboard with one-click join.
          </p>
        </section>

        <section className={styles.section} id="onboarding">
          <div className={styles.sectionNumber}>02 · Profile</div>
          <h2 className={styles.sectionTitle}>
            <a href="#onboarding">Completing your trainer profile</a>
          </h2>
          <p>
            Your trainer profile is shown to every student in your cohort and
            on the public <Link href="/trainers">/trainers</Link> page. A strong
            profile builds trust before you&rsquo;ve said a word in your first
            session.
          </p>
          <h3>The fields</h3>
          <ul>
            <li><strong>Full name</strong> — exactly as you want it printed on certificates you sign.</li>
            <li><strong>Title / honorific</strong> — Dr, Prof, etc. Optional but helpful.</li>
            <li><strong>Bio</strong> — 80-120 words. Lead with the line that would convince a sceptical student. Then the credentials.</li>
            <li><strong>Areas of expertise</strong> — 3-5 short tags (e.g. <em>destination geography, GDS systems, MICE</em>).</li>
            <li><strong>Years in the industry</strong> — a number.</li>
            <li><strong>Photo</strong> — a recent professional photo, square crop, head-and-shoulders. Avoid sunglasses, busy backgrounds, distant shots. 800×800 minimum.</li>
            <li><strong>LinkedIn URL</strong> — optional, shown as a link on the trainers page.</li>
          </ul>
          <h3>What makes a strong bio</h3>
          <p>
            Open with what you&rsquo;ve <em>done</em>, not what you&rsquo;ve been called.
            &ldquo;Founder of CAAIR Travels, established 1985, TAAI board member&rdquo; lands
            harder than &ldquo;veteran of the industry.&rdquo; Mention the kind of student
            you&rsquo;ve mentored before, briefly. End with what you&rsquo;ll specifically
            bring to VIVA students.
          </p>
          <div className={styles.callout + " " + styles.calloutTip}>
            <strong>Photo guidance</strong>
            A plain background works best — students look at faces, not backdrops.
            If you only have a far-away shot, crop tightly to head and shoulders
            before uploading. Resolution matters: 800×800 minimum, square. The
            site auto-crops to a 4:5 portrait if needed.
          </div>
        </section>

        <section className={styles.section} id="dashboard">
          <div className={styles.sectionNumber}>03 · Dashboard</div>
          <h2 className={styles.sectionTitle}>
            <a href="#dashboard">Your trainer dashboard</a>
          </h2>
          <p>
            Once logged in, your home is <Link href="/trainer">/trainer</Link>. What you&rsquo;ll see:
          </p>
          <ul>
            <li><strong>Active cohorts</strong> — every cohort you&rsquo;re assigned to, with a quick view of student count and start date.</li>
            <li><strong>Upcoming sessions</strong> — your sessions across all cohorts, ordered by date. The next-up session has a one-click <em>Join</em> button when it&rsquo;s within 10 minutes of start.</li>
            <li><strong>Submissions to review</strong> — every pending student submission from your cohorts. Newest at the top.</li>
            <li><strong>Recent recordings</strong> — links to your past sessions if you need to revisit something a student asked about.</li>
            <li><strong>Profile</strong> — link to <Link href="/trainer/profile">/trainer/profile</Link> where you can edit anything later.</li>
          </ul>
        </section>

        <section className={styles.section} id="sessions">
          <div className={styles.sectionNumber}>04 · Sessions</div>
          <h2 className={styles.sectionTitle}>
            <a href="#sessions">Hosting live sessions on Zoom</a>
          </h2>
          <p>
            Each cohort runs one or two 90-minute live sessions per week. The
            platform provisions a Zoom meeting for each scheduled session and
            puts a <em>Join</em> button on your dashboard 10 minutes before
            start.
          </p>
          <h3>Before the session</h3>
          <ol>
            <li>Confirm the session is on your dashboard. If it&rsquo;s not, ping ops; the schedule may have shifted.</li>
            <li>Skim the module&rsquo;s chapter content the cohort just covered — students will reference it.</li>
            <li>5 minutes before: open the session row, click <strong>Join</strong>.</li>
            <li>You&rsquo;ll enter as the host. Enable recording — required for the recording to land in the student LMS afterward.</li>
          </ol>
          <h3>During the session</h3>
          <ul>
            <li>Students appear in the participant list as they join. Attendance is auto-tracked.</li>
            <li>Use the in-Zoom chat for links / references; encourage students to use chat for questions to keep the audio focused.</li>
            <li>If a student raises a hand, prioritise them — but keep the cohort flow moving.</li>
            <li>End the session by clicking <strong>End meeting for all</strong>. This stops the recording and triggers the upload.</li>
          </ul>
          <h3>After the session</h3>
          <p>
            The recording uploads to YouTube as an Unlisted video automatically
            (or to your manual upload pipeline if Zoom-to-YouTube isn&rsquo;t set
            up). It appears as a chapter in the student LMS within 24 hours.
            You don&rsquo;t need to do anything; the system handles it.
          </p>
          <div className={styles.callout + " " + styles.calloutWarning}>
            <strong>Recording is required</strong>
            Students who couldn&rsquo;t attend live rely on the recording. If you
            forget to hit record, the platform will flag the session as
            <em> recording missing</em> and the recording-deadline cron will nudge
            you 48 hours later. To re-upload after the fact, see the next
            section.
          </div>
        </section>

        <section className={styles.section} id="recordings">
          <div className={styles.sectionNumber}>05 · Recordings</div>
          <h2 className={styles.sectionTitle}>
            <a href="#recordings">Recording &amp; uploading</a>
          </h2>
          <p>
            For most sessions, the Zoom-to-YouTube automation handles upload. In
            two cases you&rsquo;ll need to do it yourself:
          </p>
          <ol>
            <li>The automation failed and the recording-deadline cron reminded you.</li>
            <li>You recorded an off-Zoom session (e.g. a special guest module not on a scheduled Zoom).</li>
          </ol>
          <h3>Manual upload steps</h3>
          <ol className={styles.steps}>
            <li>Upload the video to VIVA&rsquo;s YouTube channel as <strong>Unlisted</strong> — never Private (Private videos can&rsquo;t embed) and never Public (publication policy).</li>
            <li>Copy the YouTube URL.</li>
            <li>Open your trainer dashboard &rsaquo; <strong>This week&rsquo;s sessions</strong> &rsaquo; click into the affected session.</li>
            <li>Paste the YouTube URL into the <em>Recording URL</em> field.</li>
            <li>Save. The recording is now available to students within seconds.</li>
          </ol>
          <h3>If you don&rsquo;t have YouTube access</h3>
          <p>
            Send the recording file (or a Google Drive / Dropbox link) to the
            admin team and they&rsquo;ll upload on your behalf. Don&rsquo;t paste a
            Drive link into the recording URL field — students need an embedded
            YouTube to watch in-app without an external account.
          </p>
        </section>

        <section className={styles.section} id="attendance">
          <div className={styles.sectionNumber}>06 · Attendance</div>
          <h2 className={styles.sectionTitle}>
            <a href="#attendance">Marking attendance</a>
          </h2>
          <p>
            Attendance is auto-detected from Zoom participant events — students
            who join the meeting for at least 30 minutes are marked
            <em> present</em>. You typically don&rsquo;t need to touch attendance.
          </p>
          <h3>When you do need to override</h3>
          <ul>
            <li>Student had Zoom issues, joined by audio-only on phone — won&rsquo;t auto-detect. Mark <em>present</em> manually.</li>
            <li>Student joined briefly, dropped, rejoined — Zoom might log this as one short presence. If they were effectively there for the session, override to <em>present</em>.</li>
            <li>Student had a documented emergency (illness, family) — mark <em>excused</em> with a short reason note.</li>
          </ul>
          <h3>How to override</h3>
          <ol>
            <li>Open the session row on your trainer dashboard.</li>
            <li>You see the roster with each student&rsquo;s auto-detected status.</li>
            <li>Click the status column on a student&rsquo;s row.</li>
            <li>Pick <em>present</em>, <em>absent</em>, or <em>excused</em>.</li>
            <li>For excused, enter a one-line reason.</li>
            <li>Save.</li>
          </ol>
          <div className={styles.callout + " " + styles.calloutTip}>
            <strong>Attendance window closes daily at 17:30 UTC</strong>
            A nightly cron finalises attendance for any session whose end time
            has passed. Make corrections before then. After finalisation,
            changes need ops to step in.
          </div>
        </section>

        <section className={styles.section} id="submissions">
          <div className={styles.sectionNumber}>07 · Submissions</div>
          <h2 className={styles.sectionTitle}>
            <a href="#submissions">Reviewing student submissions</a>
          </h2>
          <p>
            For chapters that ask students to submit a written response or
            assignment, you&rsquo;ll see those submissions on your dashboard. Your
            review unlocks the next chapter for that student in some
            programmes, so timely review matters.
          </p>
          <h3>The review flow</h3>
          <ol className={styles.steps}>
            <li>Dashboard &rsaquo; <strong>Submissions to review</strong>.</li>
            <li>Click a row — you see the student&rsquo;s name, the chapter prompt, and their submission.</li>
            <li>Read. Type your feedback in the textarea.</li>
            <li>Pick a grade: <em>pass</em>, <em>pass with comments</em>, or <em>resubmit</em>.</li>
            <li>Save. Student is notified by email + sees your feedback inline in the chapter view.</li>
          </ol>
          <h3>Service-level expectation</h3>
          <p>
            <strong>72 hours</strong> from submission to your review is the
            cohort expectation. Faster builds trust; slower frustrates. If
            you&rsquo;re overloaded for a week, ping ops — they can stagger the
            chapter unlock schedule.
          </p>
        </section>

        <section className={styles.section} id="feedback">
          <div className={styles.sectionNumber}>08 · Feedback</div>
          <h2 className={styles.sectionTitle}>
            <a href="#feedback">Giving useful feedback</a>
          </h2>
          <p>
            The quality of your written feedback is what students remember
            from your cohort. A pattern that works:
          </p>
          <ul>
            <li><strong>One sentence on what they got right.</strong> Specific, not generic. &ldquo;Your destination logic in part 2 picked up exactly the trade-off most students miss&rdquo; beats &ldquo;Good work.&rdquo;</li>
            <li><strong>One sentence on what was missing or weak.</strong> The single most important thing — not a laundry list.</li>
            <li><strong>One sentence pointing to where in the material they can fill the gap.</strong> &ldquo;Module 4 chapter 3 has the framework for this.&rdquo;</li>
            <li><strong>Sign off briefly.</strong> A real human note. &ldquo;Solid submission — looking forward to seeing this evolve.&rdquo;</li>
          </ul>
          <p>
            Three sentences plus a sign-off is enough. Students remember
            specificity more than length.
          </p>
          <div className={styles.callout + " " + styles.calloutTip}>
            <strong>When to grade <em>resubmit</em></strong>
            Use <em>resubmit</em> sparingly. The student gets a clear signal
            that the work didn&rsquo;t pass — useful if they were just sloppy. But
            for a student who clearly tried and is struggling with the concept,
            <em> pass with comments</em> + a specific pointer to the
            module they need to revisit is usually a better path.
          </div>
        </section>

        <section className={styles.section} id="communication">
          <div className={styles.sectionNumber}>09 · Communication</div>
          <h2 className={styles.sectionTitle}>
            <a href="#communication">Student communication</a>
          </h2>
          <p>
            You&rsquo;ll have three communication channels with students:
          </p>
          <ul>
            <li><strong>In-platform feedback</strong> (submissions) — for substantive academic feedback. Stays in the record.</li>
            <li><strong>Cohort WhatsApp group</strong> — for logistics, day-to-day questions, links to resources. You&rsquo;ll be added when the cohort starts.</li>
            <li><strong>1-on-1 direct messages</strong> — students may DM you on WhatsApp. Keep things professional and route academic questions back to the in-platform feedback channel so other students can benefit.</li>
          </ul>
          <h3>What you don&rsquo;t need to handle</h3>
          <p>
            Payment issues, login problems, certificate questions, refund
            requests, and cohort transfers — all of these are ops&rsquo;s job. Don&rsquo;t
            feel pressured to answer them; route the student to{" "}
            <a href="mailto:hello@vivacareeracademy.com">hello@vivacareeracademy.com</a>{" "}
            and the team will pick it up.
          </p>
        </section>

        <section className={styles.section} id="expectations">
          <div className={styles.sectionNumber}>10 · Expectations</div>
          <h2 className={styles.sectionTitle}>
            <a href="#expectations">Cadence &amp; expectations</a>
          </h2>
          <table className={styles.compareTable}>
            <thead>
              <tr><th>Task</th><th>Expected cadence</th></tr>
            </thead>
            <tbody>
              <tr><td>Showing up for your scheduled live session</td><td>100% — find a substitute via admin if you can&rsquo;t make it</td></tr>
              <tr><td>Submissions review</td><td>Within 72 hours of student submission</td></tr>
              <tr><td>Attendance corrections (if needed)</td><td>Before 17:30 UTC the day of the session</td></tr>
              <tr><td>Cohort WhatsApp group check-in</td><td>Daily, especially during active weeks</td></tr>
              <tr><td>Recording upload (if automation fails)</td><td>Within 48 hours of session</td></tr>
              <tr><td>Profile updates (bio, photo)</td><td>Annually, or whenever you have something new to add</td></tr>
            </tbody>
          </table>
        </section>

        <section className={styles.section} id="escalation">
          <div className={styles.sectionNumber}>11 · Asking for help</div>
          <h2 className={styles.sectionTitle}>
            <a href="#escalation">When to ask for help</a>
          </h2>
          <p>
            Some moments need someone in ops or admin. Don&rsquo;t hesitate.
          </p>
          <ul>
            <li><strong>You can&rsquo;t make a session</strong> — give as much notice as possible. Ops can re-schedule or arrange a substitute.</li>
            <li><strong>A student is consistently struggling</strong> — share with ops so they can offer a check-in or peer-support.</li>
            <li><strong>A student is being disruptive</strong> — document and pass to ops; the cohort code-of-conduct is enforced platform-side.</li>
            <li><strong>You spot a technical issue</strong> — chapter video doesn&rsquo;t play, dashboard shows wrong roster, submissions don&rsquo;t save. Screenshot, time, write to admin.</li>
            <li><strong>You spot a copy / branding error</strong> — typo in a module, wrong cohort label. Tell admin; they&rsquo;ll fix.</li>
            <li><strong>You want to suggest a curriculum improvement</strong> — most welcome. Write it up and send to admin; we revise yearly.</li>
          </ul>
          <p>
            Reach: WhatsApp the admin who onboarded you, or email{" "}
            <a href="mailto:hello@vivacareeracademy.com">hello@vivacareeracademy.com</a>.
            For Zoom-failed-mid-session level urgency, WhatsApp.
          </p>
          <div className={styles.callout}>
            <strong>You&rsquo;re not alone</strong>
            VIVA is a small operation by design — small cohorts, hand-picked
            faculty, hands-on ops. If something feels off, surface it. The
            platform improves a cohort at a time, and trainer feedback is the
            largest single driver of those improvements.
          </div>
        </section>

        <nav className={styles.pageNav} aria-label="Manual navigation">
          <Link href="/help/operations">
            <span>← Previous</span>
            <strong>Operations Manual</strong>
          </Link>
          <Link href="/help">
            <span>Back to →</span>
            <strong>Help Center</strong>
          </Link>
        </nav>
      </article>
    </MarketingShell>
  );
}
