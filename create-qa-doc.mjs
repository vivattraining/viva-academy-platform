import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle,
  ShadingType, TableLayoutType, convertInchesToTwip, Header,
  Footer, PageNumber, NumberFormat, UnderlineType,
} from "docx";
import fs from "fs";

// ── Colour palette ──────────────────────────────────────────────────────────
const NAVY   = "0E1B2C";
const ACCENT = "B8895A";
const GREEN  = "16A34A";
const RED    = "DC2626";
const CREAM  = "F5EFE4";
const LIGHT  = "F0EBE1";
const WHITE  = "FFFFFF";
const MUTED  = "5B6576";
const RULE   = "D6CFC4";

// ── Helpers ─────────────────────────────────────────────────────────────────
const bold  = (t, color = NAVY, size = 22) =>
  new TextRun({ text: t, bold: true,  color, size });
const text  = (t, color = NAVY, size = 22) =>
  new TextRun({ text: t, bold: false, color, size });
const muted = (t, size = 20) =>
  new TextRun({ text: t, color: MUTED, size, italics: true });

function para(runs, spacing = { before: 0, after: 120 }, align = AlignmentType.LEFT) {
  return new Paragraph({ children: Array.isArray(runs) ? runs : [runs], spacing, alignment: align });
}

function h1(t) {
  return new Paragraph({
    children: [new TextRun({ text: t, bold: true, color: WHITE, size: 36, font: "Calibri" })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 0, after: 180 },
    shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
    indent: { left: convertInchesToTwip(0.15), right: convertInchesToTwip(0.15) },
  });
}

function h2(t) {
  return new Paragraph({
    children: [new TextRun({ text: t, bold: true, color: NAVY, size: 28, font: "Calibri" })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT } },
  });
}

function issueHeading(num, title, category, priority) {
  return new Paragraph({
    children: [
      new TextRun({ text: `  Issue #${num}  `, bold: true, color: WHITE, size: 22, font: "Calibri" }),
      new TextRun({ text: `  ${title}`, bold: true, color: NAVY, size: 24, font: "Calibri" }),
      new TextRun({ text: `     ${category}  .  ${priority}`, color: MUTED, size: 20, font: "Calibri" }),
    ],
    spacing: { before: 280, after: 100 },
    shading: { type: ShadingType.SOLID, color: ACCENT, fill: ACCENT },
  });
}

function label(t) {
  return new TextRun({ text: t, bold: true, color: ACCENT, size: 20, font: "Calibri" });
}

function bullet(t, color = NAVY) {
  return new Paragraph({
    children: [new TextRun({ text: t, color, size: 21, font: "Calibri" })],
    bullet: { level: 0 },
    spacing: { before: 30, after: 30 },
  });
}

function filePill(t) {
  return new TextRun({
    text: `  ${t}  `,
    font: "Courier New",
    color: NAVY,
    size: 18,
    shading: { type: ShadingType.SOLID, color: LIGHT, fill: LIGHT },
  });
}

function divider() {
  return new Paragraph({
    children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: RULE } },
    spacing: { before: 20, after: 20 },
  });
}

function summaryTable(rows) {
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: ["Category", "Issues Fixed", "Status"].map(h =>
          new TableCell({
            children: [para(bold(h, WHITE, 20), { before: 80, after: 80 })],
            shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
          })
        ),
        tableHeader: true,
      }),
      ...rows.map((r, i) =>
        new TableRow({
          children: r.map(cell =>
            new TableCell({
              children: [para(text(cell, NAVY, 20), { before: 60, after: 60 })],
              shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? WHITE : LIGHT, fill: i % 2 === 0 ? WHITE : LIGHT },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
            })
          ),
        })
      ),
    ],
  });
}

function pendingTable(rows) {
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: ["Issue #", "Title", "Reason Pending"].map(h =>
          new TableCell({
            children: [para(bold(h, WHITE, 20), { before: 80, after: 80 })],
            shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            width: h === "Issue #" ? { size: 10, type: WidthType.PERCENTAGE }
                 : h === "Title"   ? { size: 30, type: WidthType.PERCENTAGE }
                 :                   { size: 60, type: WidthType.PERCENTAGE },
          })
        ),
        tableHeader: true,
      }),
      ...rows.map((r, i) =>
        new TableRow({
          children: r.map(cell =>
            new TableCell({
              children: [para(text(cell, NAVY, 20), { before: 60, after: 60 })],
              shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? WHITE : LIGHT, fill: i % 2 === 0 ? WHITE : LIGHT },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
            })
          ),
        })
      ),
    ],
  });
}

// ── Document sections ────────────────────────────────────────────────────────
const children = [];

// Cover / Title block
children.push(
  new Paragraph({
    children: [new TextRun({ text: "VIVA CAREER ACADEMY", bold: true, color: WHITE, size: 48, font: "Calibri", allCaps: true })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
    indent: { left: convertInchesToTwip(0.15), right: convertInchesToTwip(0.15) },
  }),
  new Paragraph({
    children: [new TextRun({ text: "QA Fixes -- Resolved Issues Report", bold: true, color: WHITE, size: 30, font: "Calibri" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    shading: { type: ShadingType.SOLID, color: ACCENT, fill: ACCENT },
    indent: { left: convertInchesToTwip(0.15), right: convertInchesToTwip(0.15) },
  }),
  para([
    text("Date: ", NAVY, 20), text("15 May 2026   ", MUTED, 20),
    text("Platform: ", NAVY, 20), text("Next.js 14 + FastAPI   ", MUTED, 20),
    text("Total Issues Fixed: ", NAVY, 20), bold("20", GREEN, 20),
  ], { before: 160, after: 160 }, AlignmentType.CENTER),
  divider(),
);

// Summary table
children.push(
  h2("Summary"),
  summaryTable([
    ["UI / Layout",              "#1, #2, #7, #9, #11, #13, #14, #36, #38",      "✅ Fixed"],
    ["Functionality",            "#6, #16, #17, #19, #63, #64, #65, #69",         "✅ Fixed"],
    ["Security / API",           "#35",                                            "✅ Fixed"],
    ["Mobile -- Fixed Nav",       "Nav bar stays fixed on scroll (mobile)",         "✅ Fixed"],
    ["Mobile -- Hamburger Menu",  "Hamburger across public, admin & student pages", "✅ Fixed"],
    ["Build / Runtime Errors",   "roster-workbench.tsx, onboarding/trainer page",  "✅ Fixed"],
  ]),
  para("", { before: 200, after: 0 }),
);

// ── INDIVIDUAL ISSUES ────────────────────────────────────────────────────────

// Issue 1
children.push(
  issueHeading("1", "Top Navbar -- Single Line at All Viewport Sizes", "UI Test", "P2"),
  para([label("Problem:  "), text('Top navbar elements wrapped onto a second line at 1366 px and 14-inch laptop viewports (100% zoom). The "Advisory Board" link was breaking to a new line, distorting the entire header.')]),
  para([label("Fix Applied:")]),
  bullet("Added flex-wrap: nowrap and white-space: nowrap to .navLinks so links never break"),
  bullet("Reduced nav link gap from 32 px to 24 px to fit all items on one row"),
  bullet("Added intermediate @media (max-width: 1280px) breakpoint -- font size drops to 13 px and gap to 18 px on mid-range screens"),
  para([label("Files Modified:  "), filePill("apps/web/components/claude-home.module.css")]),
  divider(),
);

// Issue 2
children.push(
  issueHeading("2", "Programs Grid -- Duration, Format & Cohort on One Line", "UI Test", "P2"),
  para([label("Problem:  "), text("Inside each program card the Duration, Format and Next Cohort values were stacked vertically in a distorted layout instead of appearing on a single clean line.")]),
  para([label("Fix Applied:")]),
  bullet("Created .metaInline flex row class with .metaSep separator characters (.) between each item"),
  bullet("Duration, Format and Next Cohort now render on one line inside every program card"),
  para([label("Files Modified:  "), filePill("apps/web/components/claude-home.module.css"), new TextRun({ text: "  " }), filePill("apps/web/app/page.tsx")]),
  divider(),
);

// Issue 6
children.push(
  issueHeading("6", "Registration Form -- Submit Button Locked After Each Stage", "Functionality", "P2"),
  para([label("Problem:  "), text("After completing Stage 1 of the application form, the submit button stayed active even if no fields were changed. Users could submit the same stage multiple times without any validation.")]),
  para([label("Fix Applied:")]),
  bullet("Added step1Submitted boolean state -- set to true after a successful Stage 1 submission"),
  bullet("Submit button is disabled while step1Submitted is true"),
  bullet("Any field change resets step1Submitted to false, re-enabling the button"),
  bullet("The same pattern is applied to each subsequent stage in the multi-step form"),
  para([label("Files Modified:  "), filePill("apps/web/components/public-admissions-flow.tsx")]),
  divider(),
);

// Issue 7
children.push(
  issueHeading("7", "Footer -- No Whitespace at Bottom", "UI Test", "P2"),
  para([label("Problem:  "), text("Footer had a large empty gap below it caused by inheriting an oversized clamp(64px, 8vw, 110px) bottom padding from the shared section wrapper class.")]),
  para([label("Fix Applied:")]),
  bullet("Added explicit .footer { padding-bottom: 40px } override to neutralise the inherited clamp value"),
  bullet("Footer now sits tight against the last content block on all viewport sizes"),
  para([label("Files Modified:  "), filePill("apps/web/components/claude-home.module.css")]),
  divider(),
);

// Issue 9
children.push(
  issueHeading("9", "Contact Page -- Proper Grid Spacing", "UI Test", "P2"),
  para([label("Problem:  "), text("Contact page grid elements and headings were sticking to the edges of the screen with no horizontal padding, no max-width constraint and no gutter -- making the layout look broken on wide monitors.")]),
  para([label("Fix Applied:")]),
  bullet("Wrapped all contact page sections inside <div className={styles.wrap}> to apply the standard max-width and gutter padding consistent with every other page"),
  para([label("Files Modified:  "), filePill("apps/web/app/contact/page.tsx")]),
  divider(),
);

// Issue 11
children.push(
  issueHeading("11", "FAQ Accordion -- One Open at a Time + Toggle Icon", "UI Test", "P2"),
  para([label("Problem:  "), text("All FAQ questions could be expanded simultaneously with no way to close them. The + icon did not change to − when an item was open. The implementation used <details>/<summary> HTML with no controlled React state.")]),
  para([label("Fix Applied:")]),
  bullet("Converted FAQ from native <details>/<summary> to controlled React state using an openFaq index"),
  bullet("Clicking a question closes the previously open one and opens the selected one"),
  bullet("Open item displays − icon; closed item displays + icon"),
  para([label("Files Modified:  "), filePill("apps/web/app/page.tsx"), new TextRun({ text: "  " }), filePill("apps/web/components/claude-home.module.css")]),
  divider(),
);

// Issue 13
children.push(
  issueHeading("13", "Footer Social Links -- Real URLs (Instagram, LinkedIn, YouTube)", "UI Test", "P2"),
  para([label("Problem:  "), text('Instagram, LinkedIn and YouTube links in the footer all had href="#" -- clicking them did nothing and went nowhere.')]),
  para([label("Fix Applied:")]),
  bullet("Instagram  →  https://www.instagram.com/vivacareeracademy"),
  bullet("LinkedIn   →  https://www.linkedin.com/company/vivacareeracademy"),
  bullet("YouTube    →  https://www.youtube.com/@vivacareeracademy"),
  bullet("All social links set to target=\"_blank\" rel=\"noopener noreferrer\" to open safely in a new tab"),
  para([label("Files Modified:  "), filePill("apps/web/app/page.tsx")]),
  divider(),
);

// Issue 14
children.push(
  issueHeading("14", "Admin Header -- Single Line, No Overflow", "UI Test", "P2"),
  para([label("Problem:  "), text('When an admin or staff user was logged in, the "Open messaging center" CTA button and other nav items overflowed above the navbar, collapsing the entire header layout.')]),
  para([label("Fix Applied:")]),
  bullet("Primary and secondary CTA buttons in the navbar are now only rendered for navVariant=\"public\" pages"),
  bullet("For internal and student variants, CTAs are moved to the hero section below the navbar instead"),
  bullet("Admin navbar now only contains: Brand logo . Nav links . Username . Sign-out button -- all fitting on one line"),
  para([label("Files Modified:  "), filePill("apps/web/components/site-shell.tsx")]),
  divider(),
);

// Issue 16
children.push(
  issueHeading("16", "Admin User Management -- Email Validation", "Functionality", "P2"),
  para([label("Problem:  "), text("Email was not validated before creating a user login. Malformed inputs such as bademail@ passed the check silently and a user account was created in the database.")]),
  para([label("Fix Applied:")]),
  bullet("Added regex validation /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/ before the API create-user call"),
  bullet("Invalid email addresses now show an inline error message and block submission"),
  para([label("Files Modified:  "), filePill("apps/web/components/admin-user-management.tsx")]),
  divider(),
);

// Issue 17
children.push(
  issueHeading("17", "Logout -- Sign-Out Button Visible for All Logged-In Users", "Functionality", "P2"),
  para([label("Problem:  "), text("Logout was only accessible on the /internal/login page. No sign-out button existed in the navbar for any authenticated user -- admin, operations, trainer or student.")]),
  para([label("Fix Applied:")]),
  bullet("Added session state and signOut() function to SiteShell component"),
  bullet("When navVariant is internal or student and a valid session exists, a Sign out button appears in the navbar"),
  bullet("On click: calls the logout API endpoint, clears the session cookie and redirects to the appropriate login page"),
  bullet("Also visible in the mobile hamburger dropdown menu"),
  para([label("Files Modified:  "), filePill("apps/web/components/site-shell.tsx")]),
  divider(),
);

// Issue 19
children.push(
  issueHeading("19", "General -- Logged-In User Name Displayed in Navbar", "Functionality", "P2"),
  para([label("Problem:  "), text("There was no indication of which user was currently logged in anywhere in the interface. Users had no way to confirm their active session identity.")]),
  para([label("Fix Applied:")]),
  bullet("session.full_name is now displayed in the navbar for all authenticated internal and student pages"),
  bullet("Name is also shown in the mobile hamburger dropdown"),
  para([label("Files Modified:  "), filePill("apps/web/components/site-shell.tsx")]),
  divider(),
);

// Issue 35
children.push(
  issueHeading("35", "Admin API -- Role Isolation (403, Not 400)", "Security", "P2"),
  para([label("Problem:  "), text("Trainer or operations sessions accessing admin-only endpoints (GET /api/v1/academy/applications, /batches) received a 400 Bad Request instead of 403 Forbidden. The 400 response leaked that the endpoint existed and had specific parameter requirements, without ever confirming the caller was unauthorised.")]),
  para([label("Fix Applied:")]),
  bullet("read_applications_secure and read_batches_secure now fall back to the session's own tenant when no tenant_name query param is supplied"),
  bullet("Requests from non-admin roles are explicitly checked and rejected with 403 Forbidden before any business logic runs"),
  para([label("Files Modified:  "), filePill("apps/api/app/academy.py"), new TextRun({ text: "  " }), filePill("apps/api/app/auth.py")]),
  divider(),
);

// Issue 36
children.push(
  issueHeading("36", "Registration Form -- Coming-Soon Tooltip on Disabled Button", "UI Test", "P2"),
  para([label("Problem:  "), text("When a coming-soon course was selected, the submit button was correctly disabled but displayed no explanation. Users saw a greyed-out button with zero feedback about why it was disabled.")]),
  para([label("Fix Applied:")]),
  bullet("Added a title attribute to the disabled submit button: \"This course opens for enrolment soon -- check back shortly\""),
  bullet("Tooltip appears on hover over the disabled button on desktop"),
  para([label("Files Modified:  "), filePill("apps/web/components/public-admissions-flow.tsx")]),
  divider(),
);

// Issue 38
children.push(
  issueHeading("38", "Internal Login -- Error Message Accessibility", "UI Test", "P2"),
  para([label("Problem:  "), text("Wrong-credential errors appeared as plain body text change with no semantic ARIA role. Screen readers could not detect or announce the error to visually impaired users.")]),
  para([label("Fix Applied:")]),
  bullet("Added role=\"alert\" to the error message <div> so screen readers announce it immediately when it appears after a failed login"),
  para([label("Files Modified:  "), filePill("apps/web/components/student-login-panel.tsx")]),
  divider(),
);

// Issue 63
children.push(
  issueHeading("63", "Student Fee Status -- View Statement Links to Receipt", "Functionality", "P2"),
  para([label("Problem:  "), text("Clicking \"View Statement\" in the student fee status section navigated back to the student dashboard page itself instead of opening the actual fee receipt.")]),
  para([label("Fix Applied:")]),
  bullet("View Statement link now points to /payment/receipt/{applicationId}?tenant={tenantName}"),
  bullet("Correct receipt page is loaded with the student's own application ID and tenant in the query string"),
  para([label("Files Modified:  "), filePill("apps/web/components/student-home-workspace.tsx")]),
  divider(),
);

// Issue 64
children.push(
  issueHeading("64", "Student Calendar -- Back Button Visible and Styled", "UI Test", "P2"),
  para([label("Problem:  "), text("The \"Back to Home\" button on the student calendar page appeared visually disabled -- no border, low contrast -- making it look non-interactive and inaccessible.")]),
  para([label("Fix Applied:")]),
  bullet("Button uses explicit border: 1px solid var(--border) styling for clear visibility"),
  bullet("Added ← arrow prefix for affordance"),
  bullet("Styling is consistent with the ghost-button pattern used across the rest of the student workspace"),
  para([label("Files Modified:  "), filePill("apps/web/components/student-calendar-workspace.tsx")]),
  divider(),
);

// Issue 65
children.push(
  issueHeading("65", "Student Test Page -- Back Button Visible and Styled", "UI Test", "P2"),
  para([label("Problem:  "), text("\"Back to Dashboard\" button on the student test runner had poor contrast against the card background and appeared non-interactive.")]),
  para([label("Fix Applied:")]),
  bullet("Same border and ← prefix fix applied as Issue #64"),
  bullet("Button is now visually consistent with all other back-navigation elements in the student workspace"),
  para([label("Files Modified:  "), filePill("apps/web/components/student-test-runner.tsx")]),
  divider(),
);

// Issue 69
children.push(
  issueHeading("69", "Login -- Enter Key Submits the Form", "Functionality", "P2"),
  para([label("Problem:  "), text("Login form could only be submitted by clicking the button with a mouse. Pressing Enter in the email or password field did nothing -- making keyboard-only login impossible.")]),
  para([label("Fix Applied:")]),
  bullet("Removed a duplicate onClick handler on the submit button that was preventing default form submission behaviour"),
  bullet("Login form now uses type=\"submit\" inside an onSubmit-wired form -- Enter key works from any field"),
  para([label("Files Modified:  "), filePill("apps/web/components/operator-gate.tsx")]),
  divider(),
);

// ── Mobile Fixes ─────────────────────────────────────────────────────────────
children.push(h2("Mobile & Responsive Fixes"));

children.push(
  issueHeading("M1", "Mobile Navigation -- Fixed Position on Scroll", "Responsive", "P2"),
  para([label("Problem:  "), text("On mobile viewports (≤ 720 px) both the dark announcement banner and the navbar scrolled away with the page content. The navbar was set to position: sticky which was unreliable inside the flex column layout, leaving users unable to navigate after scrolling.")]),
  para([label("Fix Applied:")]),
  bullet("At max-width: 720px -- .topBanner set to position: fixed; top: 0 (z-index: 52)"),
  bullet(".nav set to position: fixed; top: 54px so it sits immediately below the banner"),
  bullet(".page receives padding-top: 110px to compensate for both fixed elements taking space out of document flow"),
  bullet("Both the dark banner and logo/hamburger bar remain pinned to the top at all times during scroll"),
  para([label("Files Modified:  "), filePill("apps/web/components/claude-home.module.css")]),
  divider(),
);

children.push(
  issueHeading("M2", "Hamburger Menu -- Across All Pages (Public, Admin, Student)", "Responsive", "P2"),
  para([label("Problem:  "), text("Hamburger menu was only implemented on the public home page (claude-home.tsx) and the marketing shell (marketing-shell.tsx). All internal pages -- admin, operations, trainer and student -- had no mobile menu. Nav links were hidden on mobile with no way to access them.")]),
  para([label("Fix Applied:")]),
  bullet("Added full hamburger menu implementation to site-shell.tsx (used by all internal pages)"),
  bullet("menuOpen state, toggle button (☰ / ✕) and mobile dropdown all implemented consistently"),
  bullet("Mobile dropdown includes all nav links for the current variant, logged-in user name and Sign-out button"),
  para([label("Files Modified:  "), filePill("apps/web/components/site-shell.tsx")]),
  divider(),
);

// ── Build Fixes ───────────────────────────────────────────────────────────────
children.push(h2("Additional Build & Runtime Fixes"));

children.push(
  issueHeading("B1", "Roster Workbench -- TypeScript Build Error", "Build", "P1"),
  para([label("Problem:  "), text("roster-workbench.tsx had a syntax error -- certificate_url was placed outside the JSON.stringify({}) object body. This caused a TypeScript parse error and broke the entire production build, taking the site offline.")]),
  para([label("Fix Applied:")]),
  bullet("Moved certificate_url inside the correct JSON.stringify object so all fields (tenant_name, application_stage, enrollment_stage, certificate_url) are serialised together in one API call"),
  para([label("Files Modified:  "), filePill("apps/web/components/roster-workbench.tsx")]),
  divider(),
);

children.push(
  issueHeading("B2", "Onboarding Trainer Page -- Duplicate Export 500 Error", "Build", "P1"),
  para([label("Problem:  "), text("apps/web/app/onboarding/trainer/page.tsx contained two export default function OnboardingTrainerPage definitions -- 280+ lines of dead code from an earlier draft. This caused a 500 Internal Server Error on every visit to the /onboarding/trainer route.")]),
  para([label("Fix Applied:")]),
  bullet("Removed the duplicate export and all dead code (280+ lines)"),
  bullet("Kept only the clean server component version with proper cookie-based session validation and redirect logic"),
  para([label("Files Modified:  "), filePill("apps/web/app/onboarding/trainer/page.tsx")]),
  divider(),
);

// ── Pending Issues ─────────────────────────────────────────────────────────
children.push(
  h2("Issues Not Yet Fixed"),
  para([muted("The following issues are acknowledged but not yet resolved:")], { before: 80, after: 120 }),
  pendingTable([
    ["#3",    "Faculty Whitespace",         "Fix caused photo cropping (Vikas Khanduri forehead cut). Reverted -- needs design decision on aspect ratio."],
    ["#4",    "OTP Validation",             "Requires external email/SMS service infrastructure to be provisioned."],
    ["#10/40","Rate-Limit Countdown",       "UI enhancement -- countdown timer/attempt counter needed in the login panel."],
    ["#15",   "Email Sending",              "Requires SMTP configuration and transactional email service setup."],
    ["#18",   "Student Page Access",        "Student demo account confirmed working; may be related to payment stage gate."],
    ["#30",   "Hero Video 404",             "Video files not committed to repository -- assets need to be uploaded."],
    ["#41",   "QA Test Coverage",           "pages.ts lists only 3 routes; full site has 40+ pages -- test framework work needed."],
    ["#42",   "Input maxlength",            "No maxlength on name/email/phone inputs -- 200-char names accepted without error."],
    ["#43",   "Login Form Wrapper",         "/internal/login missing <form> element -- password managers cannot pair fields."],
    ["#48-51","Backend Endpoints",          "Trainer invites, profiles, catalog changes and certificate endpoints return 404."],
    ["#53-54","IDOR / Stored XSS",          "Requires paid student fixture and pre-seeded injection payload testing."],
  ]),
  para("", { before: 200, after: 0 }),
);

// ── Footer note ──────────────────────────────────────────────────────────────
children.push(
  new Paragraph({
    children: [new TextRun({ text: "Viva Career Academy -- QA Fixes Report  .  15 May 2026  .  Confidential", color: WHITE, size: 18, font: "Calibri" })],
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
    spacing: { before: 320, after: 0 },
    indent: { left: convertInchesToTwip(0.15), right: convertInchesToTwip(0.15) },
  })
);

// ── Build document ────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22, color: NAVY },
        paragraph: { spacing: { after: 120 } },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top:    convertInchesToTwip(0.8),
          bottom: convertInchesToTwip(0.8),
          left:   convertInchesToTwip(0.9),
          right:  convertInchesToTwip(0.9),
        },
      },
    },
    children,
  }],
});

const buffer = await Packer.toBuffer(doc);
const outPath = "./docs/QA-FIXES-REPORT.docx";
fs.writeFileSync(outPath, buffer);
console.log(`\n✅  Document saved: ${outPath}\n`);
