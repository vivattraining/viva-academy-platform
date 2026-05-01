"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import styles from "./claude-home.module.css";
import type { Course } from "../lib/courses-data";

const HERO_VIDEO_MP4 = "/hero/viva-career-academy-campus.mp4";
const HERO_VIDEO_WEBM = "/hero/viva-career-academy-campus.webm";
const HERO_VIDEO_POSTER = "/hero/viva-career-academy-travel-consultant.png";

type FacultyMember = {
  code: string;
  name: string;
  role: string;
  description: string;
  creds: string[];
  image?: string;
  imageAlt?: string;
  label?: string;
  href?: string;
  imageClassName?: string;
};

const tickerItems = [
  "Travel Agency Management",
  "Travel & Tour Operations",
  "Event & MICE Design",
  "Inbound · Outbound · Domestic",
  "Hybrid · Live + Studio",
];

// Program card data is now driven by the server-side catalog
// (apps/api/app/course_catalog.py) via the GET /courses/catalog
// endpoint. The page-level server component fetches it and passes
// the result down as a prop. To change a price, edit course_catalog.py
// only — every surface (homepage cards, /courses page, application
// dropdown, Razorpay modal, receipt) updates from one file.

const curriculum = [
  {
    label: "Semester I — Foundations",
    title: "Foundations of",
    emphasis: "Service & Hospitality",
    summary:
      "The first semester establishes a strong foundation in the core principles of the travel industry. Students develop a shared understanding of service standards, travel operations, worldwide travel scenarios, what an ideal travel company looks like, professional communication, and the ethics required for guest-facing roles.",
    whyItWorks:
      "Why it works — every module is designed to build practical capability through structured study, simulations, and industry-grade assignments, so students graduate with both the knowledge and the confidence to step into real travel roles.",
    modules: [
      {
        code: "M · 01",
        title: "Introduction to the Travel Industry",
        duration: "40 hrs",
        description:
          "An overview of the global hospitality and travel landscape, key sectors, career pathways, and industry expectations.",
      },
      {
        code: "M · 02",
        title: "Various departments — how each function works",
        duration: "40 hrs",
        description:
          "Core concepts of front office operations, guest handling, service recovery, and delivering exceptional customer experiences.",
      },
      {
        code: "M · 03",
        title: "Inbound, Outbound, Domestic & MICE tourism",
        duration: "60 hrs",
        description:
          "Fundamentals of travel service, service styles, operations, and guest engagement techniques.",
      },
      {
        code: "M · 04",
        title: "Professional Communication & Etiquette",
        duration: "30 hrs",
        description:
          "Business communication, grooming standards, interpersonal skills, and workplace etiquette for hospitality and travel professionals.",
      },
      {
        code: "M · 05",
        title:
          "World Geography & Destination Studies · Rail Tourism & OTA (Online Travel Agents) workflow",
        duration: "40 hrs",
        description:
          "Introduction to global destinations, travel patterns, and foundational geographic knowledge for the travel industry.",
      },
      {
        code: "M · 06",
        title: "Studio: Service Simulation & Role-Play Labs",
        duration: "25 hrs",
        description:
          "Hands-on learning through simulations and role-play exercises, designed to build confidence and real-world service skills. Includes costings and real-time event projects.",
      },
    ],
  },
];

const faculty: FacultyMember[] = [
  {
    code: "F · 01",
    name: "Vikas Khanduri",
    image: "/faculty/narayan-home.jpeg",
    imageAlt: "Vikas Khanduri",
    label: "Faculty Head, Co-Founder",
    role: "Travel Entrepreneur · Hospitality Studies",
    description:
      "Thirty years with large travel companies. Leads VIVA Career Academy's flagship Travel Management programme.",
    creds: ["Cox & Kings", "Kuoni", "SOTC"],
  },
];

const faqs = [
  {
    question: "Do I need a background in travel or tourism to apply?",
    answer:
      "No. Most of our students begin without prior industry experience. The programme is designed to build fundamentals in travel management, starting from core concepts and progressing to advanced operational and commercial skills.",
  },
  {
    question: "How does the hybrid format work?",
    answer:
      "Live cohorts attend sessions via Zoom and at VIVA regional studios across key cities. Self-paced learners access the same curriculum on demand, with the flexibility to join live sessions anytime and switch learning modes during the programme.",
  },
  {
    question: "Is industry exposure or internship included?",
    answer:
      "Yes. Every programme includes structured industry exposure or project-based assignments with travel companies, tour operators, and corporate travel teams — ensuring practical, real-world experience.",
  },
  {
    question: "What is the programme fee, and are scholarships available?",
    answer:
      "Fees vary by programme format. Merit-based and need-based scholarships are available for eligible candidates, offering partial to significant fee support based on performance and profile.",
  },
  {
    question: "What is the admissions timeline?",
    answer:
      "Admissions are conducted on a rolling basis. Applications are reviewed individually, followed by a personal interaction. Offers are typically released within a short evaluation window prior to the cohort start date.",
  },
  {
    question: "Will I receive a recognised certification?",
    answer:
      "Yes. Upon successful completion, students receive a VIVA Certification in Travel Management. Select modules may also include certifications aligned with global travel systems and industry standards.",
  },
  {
    question: "What roles can I expect after completing the programme?",
    answer:
      "Graduates typically step into roles across travel agencies, tour operations, airlines, and corporate travel teams — such as Travel Consultant, Itinerary Planner, Operations Executive, and MICE Coordinator, depending on their chosen specialisation.",
  },
  {
    question: "What kind of salary can I expect after completion?",
    answer:
      "Entry-level salaries vary by role and organisation, typically ranging from ₹2–5 LPA in India, with higher potential in international placements and performance-based sales roles within the travel industry.",
  },
  {
    question: "Does the programme support international career opportunities?",
    answer:
      "Yes. With global exposure, destination knowledge, and industry-aligned training, graduates are prepared for opportunities with international tour operators, cruise companies, and destination management firms.",
  },
  {
    question: "How strong is the placement support?",
    answer:
      "Our placement team works closely with students to match them with suitable roles across our industry network — offering guidance, interview preparation, and access to hiring partners in travel and tourism.",
  },
  {
    question: "What outcomes can I realistically expect after 16 weeks?",
    answer:
      "By the end of the programme, you will have practical skills in travel planning, operations, and customer handling — along with industry exposure and the confidence to step into professional roles.",
  },
  {
    question: "Can I switch roles within the travel industry later?",
    answer:
      "Yes. The programme builds transferable skills, allowing you to move across functions such as sales, operations, MICE, or product development as your career progresses.",
  },
];

const recruiters = [
  {
    label: "Travel & Tour Operators",
    body:
      "Thomas Cook India · SOTC · MakeMyTrip · Yatra · Flight Centre Travel Group · TBO · Rezlive · Rayna Travel · Cleartrip · and more…",
  },
  {
    label: "Destination Management Companies (DMCs)",
    body:
      "Global and regional DMC partners across Europe, the Middle East, and Southeast Asia.",
  },
  {
    label: "MICE & Corporate Travel",
    body:
      "Leading event agencies and corporate travel firms managing conferences, incentives, and global movements.",
  },
  {
    label: "Hotels & Hospitality",
    body:
      "National & international hotel groups, local Indian hotel chains, leading restaurant brands, and online travel companies.",
  },
];

export function ClaudeHome({ programs }: { programs: Course[] }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <main className={styles.page}>
      <div className={styles.topBanner}>
        Admissions Open · Travel Careers 2026 <b>·</b> Rolling intake <b>·</b> Hybrid · Live + Studio
      </div>

      <nav className={styles.nav}>
        <div className={`${styles.wrap} ${styles.navInner}`}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark}>V</span>
            <span className={styles.brandWord}>
              <span className={styles.brandName}>VIVA</span>
              <span className={styles.brandTag}>Academy · Est. 2011</span>
            </span>
          </Link>

          <div className={styles.navLinks}>
            <a href="#programs">Programs</a>
            <a href="#curriculum">Curriculum</a>
            <a href="#faculty">Faculty</a>
            <Link href="/advisory-board">Advisory Board</Link>
            <Link href="/patron">Patron</Link>
            <a href="#outcomes">Outcomes</a>
            <a href="#admissions">Admissions</a>
          </div>

          <div className={styles.navCta}>
            <a className={styles.button} href="#admissions">
              Apply Now <span className={styles.arrow}>↗</span>
            </a>
          </div>
        </div>
      </nav>

      <header className={styles.hero}>
        <div className={styles.wrap}>
          <div className={styles.heroMeta}>
            <span className={styles.chip}>
              <span className={styles.dot} /> Admissions 2026 · <span className={styles.liveStatus}>Live</span>
            </span>
            <span className={styles.chip}>Ranked among India&apos;s top 5 travel & hospitality academies — Industry Survey 2025</span>
          </div>

          <div className={styles.heroGrid}>
            <div>
              <h1 className={styles.heroTitle}>
                Build a
                <br />
                career in
                <br />
                travel, tourism
                <br />
                <em>& hospitality</em>
                <br />
                with confidence<span className={styles.amp}>.</span>
              </h1>
              <p className={styles.heroLead}>
                Viva Career Academy prepares the next generation of travel professionals through trainer-led learning, industry discipline, and a modern AI-supported path into real travel careers.
              </p>
              <div className={styles.heroCtas}>
                <a className={styles.button} href="#admissions">
                  Begin Application <span className={styles.arrow}>↗</span>
                </a>
                <a className={styles.buttonGhost} href="#programs">
                  Explore Programs
                </a>
              </div>
            </div>

            <div className={styles.heroMedia}>
              <div className={styles.heroFrame}>
                <video
                  className={styles.heroVideo}
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={HERO_VIDEO_POSTER}
                >
                  <source src={HERO_VIDEO_WEBM} type="video/webm" />
                  <source src={HERO_VIDEO_MP4} type="video/mp4" />
                </video>
                <div className={styles.heroVideoFallback} aria-hidden="true" />
                <div className={styles.heroImageOverlay}>
                  <div className={styles.heroImageBadge}>Travel careers · Live academy</div>
                </div>
                <div className={styles.heroFrameCaption}>
                  <span className={styles.frameNum}>No. 01 / 04</span>
                  <span className={styles.frameTitle}>Travel planning, destination logic & career preparation</span>
                </div>
              </div>
              <div className={styles.heroSub}>
                <div className={styles.miniStat}>
                  <div className={styles.miniStatValue}>
                    14<sup>yr</sup>
                  </div>
                  <div className={styles.miniStatLabel}>Shaping travel and hospitality careers across India and beyond.</div>
                </div>
                <div className={styles.miniStat}>
                  <div className={styles.miniStatValue}>
                    90<sup>%</sup>
                  </div>
                  <div className={styles.miniStatLabel}>Students placed within 60 days of convocation.</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.ticker}>
            <div className={styles.tickerTrack}>
              {[...tickerItems, ...tickerItems].map((item, index) => (
                <span key={`${item}-${index}`}>{item} /</span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className={styles.section} id="about">
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>§ 01 — Philosophy</div>
            <h2 className={styles.sectionTitle}>
              Hospitality is a <em>craft</em>. We train for it like one.
            </h2>
          </div>

          <div className={styles.promiseBody}>
            <div className={styles.bodyStack}>
              <p className={styles.bodyText}>
                VIVA has built a curriculum grounded in a simple belief: service is an art, operations are a science — and careers in travel demand mastery of both, and more.
              </p>
              <p className={styles.bodyText}>
                Our graduates go on to manage outbound tours, inbound tours, conferences, MICE operations, lead guest experiences, and drive travel services across global markets.
              </p>
              <p className={styles.bodyText}>
                We operate across India in collaboration with leading travel companies, OTAs, travel representation companies and tourism boards — ensuring that what you learn is always aligned with real industry practice.
              </p>
            </div>
            <div className={styles.pillarList}>
              {[
                [
                  "i",
                  "Industry-Embedded Faculty",
                  "Our faculty comprises seasoned professionals — former general managers, airline crew leaders, and destination specialists — who bring real-world experience into every session.",
                ],
                [
                  "ii",
                  "Hybrid Learning, Designed for Flexibility",
                  "Live, instructor-led sessions are complemented by self-paced modules, enabling both students and working professionals to learn effectively.",
                ],
                [
                  "iii",
                  "Placement as a Commitment",
                  "Every programme concludes with an industry placement opportunity, supported by our dedicated placement team and global employer network.",
                ],
              ].map(([roman, title, copy]) => (
                <div className={styles.pillar} key={title}>
                  <div className={styles.roman}>{roman}</div>
                  <div>
                    <h4>{title}</h4>
                    <p>{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.programs} id="programs">
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>§ 02 — Programs</div>
            <h2 className={styles.sectionTitle}>
              Five career tracks. <em>One</em> unwavering standard.
            </h2>
          </div>

          <div className={styles.programGrid}>
            {programs.map((program) => (
              <article className={styles.programCard} key={program.code}>
                <div className={styles.programInner}>
                  <div className={styles.programArrow}>↗</div>
                  <div className={styles.programNumber}>{program.code}</div>
                  <h3 className={styles.programTitle}>
                    {program.title_lead}
                    <br />
                    <em>{program.title_emphasis}</em>
                    {program.coming_soon ? (
                      <span
                        style={{
                          display: "inline-block",
                          marginLeft: 10,
                          padding: "3px 10px",
                          fontSize: "0.5em",
                          fontWeight: 600,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          borderRadius: 999,
                          background: "#F4B400",
                          color: "#0B1F3A",
                          verticalAlign: "middle",
                        }}
                      >
                        Coming Soon
                      </span>
                    ) : null}
                  </h3>
                  <div className={styles.programDescription}>{program.description}</div>
                  <div className={styles.programMeta}>
                    <div className={styles.metaRow}>
                      <span>Duration</span>
                      <span>{program.duration_label}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span>Format</span>
                      <span>{program.format_label}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span>Next cohort</span>
                      <span>{program.cohort_label}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span>Fee</span>
                      <span>{program.fee_display}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p
            style={{
              marginTop: 20,
              fontSize: 13,
              color: "var(--muted, #2f3140)",
              fontStyle: "italic",
            }}
          >
            * All fees are GST inclusive.
          </p>
        </div>
      </section>

      <section className={styles.format} id="format">
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>§ 03 — Format</div>
            <h2 className={styles.sectionTitle}>
              Two evenings. One <em>room</em>. Your cohort of 24 students.
            </h2>
          </div>
          <p
            className={styles.bodyText}
            style={{ marginTop: -16, marginBottom: 32, maxWidth: 960 }}
          >
            Limited to 24 students. Maximum attention. Real outcomes. Train in a focused, small-group environment where every session is interactive, practical, and industry-led — delivered live over video and in VIVA regional studios, designed to mirror real-world collaboration.
          </p>

          <div className={styles.formatGrid}>
            <article className={styles.formatCard}>
              <div className={styles.tag}>
                <span className={styles.dot} /> Live Cohort · Hybrid
              </div>
              <h3>
                What makes this <em>programme</em> different.
              </h3>
              <ul>
                <li><strong>Small Cohorts, Big Impact.</strong> Just 24 learners per batch — personalised feedback, active participation, direct faculty access.</li>
                <li><strong>Twice a Week Commitment.</strong> Friday &amp; Saturday evenings · 2 hours per session — designed for both students and working professionals.</li>
                <li><strong>Learn From Industry Leaders.</strong> Guest masterclasses by senior professionals — hotel GMs, travel leaders, and destination experts.</li>
                <li><strong>Mentorship That Matters.</strong> A dedicated career mentor guides you from week one — helping you navigate skills, roles, and opportunities.</li>
              </ul>
              <div className={styles.formatFoot}>
                <div className={styles.price}>
                  ₹ 36,999 <small>/ semester</small>
                </div>
                <a className={`${styles.button} ${styles.buttonAccent}`} href="#admissions">
                  Cohort Details <span className={styles.arrow}>↗</span>
                </a>
              </div>
            </article>

            <article className={`${styles.formatCard} ${styles.formatCardSecondary}`}>
              <div className={styles.tag}>
                <span className={styles.dot} /> Programme Details
              </div>
              <h3>
                Built for <em>capability</em>, not just attendance.
              </h3>
              <p>
                Because you don&apos;t just attend classes — you build capability, confidence, and connections that translate into careers.
              </p>
              <ul>
                <li>Duration: 16 weeks</li>
                <li>Format: Hybrid (Live + Studio Learning)</li>
                <li>Schedule: Friday &amp; Saturday evenings · 2 hours</li>
                <li>Fee: ₹36,999 per semester</li>
              </ul>
              <div className={styles.formatFoot}>
                <a className={styles.buttonGhostLight} href="#admissions">
                  Begin Application <span className={styles.arrow}>↗</span>
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.outcomes} id="outcomes">
        <div className={styles.wrap}>
          <div className={styles.outcomesHead}>
            <h2 className={styles.outcomesTitle}>
              Outcomes that lead to <em>real</em> careers.
            </h2>
            <div className={styles.outcomesSide}>
              VIVA is built around placement opportunity — supported by a dedicated placement team and an industry network spanning travel, tourism, MICE, and hospitality across India.
            </div>
          </div>

          <div className={styles.statGrid}>
            <div className={styles.stat}>
              <div className={styles.statValue}>
                90<sup>%</sup>
              </div>
              <div className={styles.statLabel}>Placement opportunity for committed graduates.</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>Best in class</div>
              <div className={styles.statLabel}>Industry-aligned salaries for entry-level travel roles.</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>Pan-India</div>
              <div className={styles.statLabel}>Placement opportunity across the travel industry, all over India.</div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.curriculum} id="curriculum">
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>§ 04 — Curriculum</div>
            <h2 className={styles.sectionTitle}>
              A syllabus built alongside the <em>industry</em>.
            </h2>
          </div>

          <div className={styles.curricLayout}>
            <div className={styles.curricNav} role="tablist" aria-label="Curriculum tabs">
              {curriculum.map((item, index) => (
                <button
                  key={item.label}
                  className={`${styles.curricTab} ${activeTab === index ? styles.curricTabActive : ""}`}
                  onClick={() => setActiveTab(index)}
                  type="button"
                >
                  <span>{item.label}</span>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </button>
              ))}
            </div>

            <div className={styles.curricPanel}>
              <div className={styles.curricPane}>
                <h3>
                  {curriculum[activeTab].title} <em>{curriculum[activeTab].emphasis}</em>
                </h3>
                <p className={styles.curricSummary}>{curriculum[activeTab].summary}</p>
                {curriculum[activeTab].whyItWorks ? (
                  <p className={styles.curricSummary}>{curriculum[activeTab].whyItWorks}</p>
                ) : null}
                <div className={styles.modules}>
                  {curriculum[activeTab].modules.map((module) => (
                    <div className={styles.module} key={module.code}>
                      <div className={styles.moduleCode}>{module.code}</div>
                      <div className={styles.moduleTitle}>
                        {module.title}
                        {module.description ? (
                          <span className={styles.moduleDescription}>{module.description}</span>
                        ) : null}
                      </div>
                      <div className={styles.moduleDuration}>{module.duration}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.faculty} id="faculty">
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>§ 05 — Faculty</div>
            <h2 className={styles.sectionTitle}>
              Taught by the people who <em>run</em> the industry.
            </h2>
          </div>

          <div className={styles.facultyGrid}>
            {faculty.map((member) => (
              <article className={styles.facultyCard} key={member.code}>
                <div className={styles.facultyImg}>
                  {member.image ? (
                    <Image
                      className={`${styles.facultyPhoto}${member.imageClassName ? ` ${member.imageClassName}` : ""}`}
                      src={member.image}
                      alt={member.imageAlt || member.name}
                      fill
                      sizes="(max-width: 720px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className={styles.portraitCard}>
                      <div className={styles.portraitAura} />
                      <div className={styles.portraitInitials}>{member.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div>
                      <div className={styles.portraitLabel}>Faculty Lead</div>
                    </div>
                  )}
                  <div className={styles.facultyNumber}>{member.code}</div>
                </div>
                <h4>{member.name}</h4>
                {member.label ? <div className={styles.facultyLabel}>{member.label}</div> : null}
                <div className={styles.facultyRole}>{member.role}</div>
                <p>{member.description}</p>
                <div className={styles.facultyCreds}>
                  {member.creds.map((item) => (
                    member.href && item === "DivyaPrem" ? (
                      <Link className={styles.facultyCredLink} href={member.href} key={item}>
                        {item}
                      </Link>
                    ) : (
                      <span key={item}>{item}</span>
                    )
                  ))}
                </div>
                {member.href ? (
                  <Link className={styles.facultyLink} href={member.href}>
                    Read Ashish Bhaiya&apos;s Mission
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="recruiters">
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>§ 06 — Top Recruiters &amp; Hiring Partners</div>
            <h2 className={styles.sectionTitle}>
              Careers across leading travel, MICE, and <em>hospitality</em> companies.
            </h2>
          </div>
          <p className={styles.bodyText} style={{ maxWidth: 760 }}>
            Our students build careers across leading travel companies, global hotel groups, airlines, and destination management firms.
          </p>
          <div className={styles.pillarList} style={{ marginTop: 28 }}>
            {recruiters.map((item, index) => (
              <div className={styles.pillar} key={item.label}>
                <div className={styles.roman}>
                  {(index + 1).toString().padStart(2, "0")}
                </div>
                <div>
                  <h4>{item.label}</h4>
                  <p>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.admissions} id="admissions">
        <div className={`${styles.wrap} ${styles.admissionsBody}`}>
          <div>
            <div className={`${styles.eyebrow} ${styles.eyebrowDark}`}>§ 07 — Admissions</div>
            <h2 className={styles.admissionsTitle} style={{ marginTop: 20 }}>
              Your <em>career</em> begins with one application.
            </h2>
            <p className={styles.lead}>
              No entrance exams. No rankings. Every application is evaluated individually — focusing on mindset, potential, and commitment, because careers in travel and hospitality are built on people, not just performance on paper.
            </p>
            <p className={styles.lead} style={{ marginTop: 14 }}>
              Each application is reviewed personally — no standardised tests or rankings. We look beyond scores to identify individuals with curiosity, discipline, and the intent to build meaningful careers in travel and hospitality.
            </p>
            <div className={styles.ctaRow} style={{ marginTop: 28 }}>
              <Link className={`${styles.button} ${styles.buttonAccent}`} href="/apply">
                Begin Application <span className={styles.arrow}>↗</span>
              </Link>
              <Link className={styles.buttonGhostLight} href="/brochure">
                Talk to Admissions
              </Link>
              <a className={styles.buttonGhostLight} href="mailto:admission@vivacareeracademy.com">
                Book a Call
              </a>
            </div>
          </div>

          <div className={styles.steps}>
            {[
              ["01", "Submit your application", "A 15-minute form — background, interests and one short written response.", "15 min"],
              ["02", "Admissions conversation", "A 30-minute online interview with a member of the admissions team.", "Within 7 days"],
              ["03", "Offer letter & scholarship review", "Merit- and need-based scholarships reviewed alongside every accepted applicant.", "Within 14 days"],
              ["04", "Welcome to VIVA", "Pre-cohort reading, studio kit and your assigned career mentor.", "4 weeks pre-start"],
            ].map(([number, title, copy, when]) => (
              <div className={styles.step} key={number}>
                <div className={styles.stepNumber}>{number}</div>
                <div>
                  <h5>{title}</h5>
                  <p>{copy}</p>
                </div>
                <div className={styles.stepWhen}>{when}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.faq} id="faq">
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>§ 08 — Questions</div>
            <h2 className={styles.sectionTitle}>
              Before you <em>apply</em>.
            </h2>
          </div>

          <div className={styles.faqGrid}>
            <div>
              <p className={styles.faqIntro}>
                The questions we hear most often, answered in brief. For anything not covered here, our admissions team replies personally — usually within the same working day.
              </p>
              <a className={styles.buttonGhost} href="mailto:admission@vivacareeracademy.com" style={{ marginTop: 20 }}>
                Talk to Admissions <span className={styles.arrow}>↗</span>
              </a>
            </div>
            <div className={styles.faqList}>
              {faqs.map((faq, index) => (
                <details className={styles.faqItem} key={faq.question} open={index === 0}>
                  <summary className={styles.faqQuestion}>
                    {faq.question}
                    <span className={styles.faqPlus}>+</span>
                  </summary>
                  <div className={styles.faqAnswer}>{faq.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className={styles.section}
        id="mission"
        style={{
          background: "var(--ink, #111d23)",
          color: "var(--cream, #f5efe4)",
          padding: "clamp(56px, 7vw, 120px) 0",
        }}
      >
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker} style={{ color: "var(--accent, #b8860b)" }}>
              § 09 — Vision & Mission
            </div>
            <h2 className={styles.sectionTitle} style={{ color: "var(--cream, #f5efe4)" }}>
              Bridging India&apos;s skill gap, one career at a time.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.5fr",
              gap: "clamp(32px, 5vw, 72px)",
              alignItems: "start",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--accent, #b8860b)",
                  marginBottom: 18,
                }}
              >
                Vision Statement
              </div>
              <p
                style={{
                  fontFamily: '"Libre Caslon Text", "Times New Roman", serif',
                  fontSize: "clamp(20px, 1.8vw, 28px)",
                  lineHeight: 1.42,
                  letterSpacing: "-0.01em",
                  margin: 0,
                  color: "var(--cream, #f5efe4)",
                }}
              >
                To bridge the national skill gap by creating a scalable, industry-integrated education platform across multiple high-demand sectors.
              </p>
            </div>

            <div>
              <div
                style={{
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--accent, #b8860b)",
                  marginBottom: 18,
                }}
              >
                Mission Statement
              </div>
              <p
                style={{
                  fontSize: 17,
                  lineHeight: 1.7,
                  margin: 0,
                  color: "rgba(245, 239, 228, 0.92)",
                }}
              >
                At Viva Career Academy, our mission is to bridge the gap between education and employment by delivering industry-aligned training across high-demand sectors, enabling students to become job-ready from day one.
              </p>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.65,
                  margin: "18px 0 14px",
                  color: "rgba(245, 239, 228, 0.78)",
                  fontWeight: 600,
                }}
              >
                We aim to:
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gap: 12,
                }}
              >
                {[
                  "Build a skilled talent pipeline for industries facing manpower gaps",
                  "Deliver practical, hybrid learning led by industry professionals",
                  "Provide clear, outcome-driven career pathways",
                  "Expand access to quality education across metro and emerging cities in India",
                  "Partner with industry leaders to ensure relevance, employability, and continuous evolution of curriculum",
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      paddingLeft: 22,
                      position: "relative",
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: "rgba(245, 239, 228, 0.88)",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "0.4em",
                        width: 12,
                        height: 1,
                        background: "var(--accent, #b8860b)",
                      }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <Link className={styles.brand} href="/">
                <span className={styles.brandMark}>V</span>
                <span className={styles.brandWord}>
                  <span className={styles.brandName}>VIVA</span>
                  <span className={styles.brandTag}>Academy · Est. 2011</span>
                </span>
              </Link>
              <p>
                A training institute for the world&apos;s most hospitable careers.
              </p>
            </div>

            <div className={styles.footerColumn}>
              <h6 className={styles.footerHeading}>Programs</h6>
              <a href="#programs">Travel Agency Management</a>
              <a href="#programs">Travel &amp; Tour Operations</a>
              <a href="#programs">Event &amp; MICE Design</a>
              <Link href="/courses">All programmes</Link>
            </div>

            <div className={styles.footerColumn}>
              <h6 className={styles.footerHeading}>Academy</h6>
              <a href="#about">About VIVA</a>
              <a href="#faculty">Faculty</a>
              <Link href="/advisory-board">Advisory Board</Link>
              <Link href="/patron">Patron</Link>
              <a href="#curriculum">Curriculum</a>
              <a href="#outcomes">Outcomes</a>
              <Link href="/apply">Admissions</Link>
              <Link href="/contact">Contact</Link>
            </div>

            <div className={styles.footerColumn}>
              <h6 className={styles.footerHeading}>Admissions</h6>
              <Link href="/apply">How to Apply</Link>
              <a href="#admissions">Fees &amp; Scholarships</a>
              <Link href="/brochure">Talk to Admissions</Link>
              <a href="mailto:admission@vivacareeracademy.com">Book a Call</a>
              <Link href="/login">Student Login</Link>
            </div>

            <div className={styles.footerColumn}>
              <h6 className={styles.footerHeading}>Contact</h6>
              <a href="mailto:support@vivacareeracademy.com">support@vivacareeracademy.com</a>
              <a href="tel:+917042107711">+91 70421 07711</a>
              <span>Mumbai · HQ</span>
              <span>Bangalore · Studio</span>
              <span>Delhi · Studio</span>
              <span>Goa · Studio</span>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <div>© 2026 Viva Career Academy of Travel, Tourism & Hospitality. All rights reserved.</div>
            <div className={styles.footerSocial}>
              <a href="#">Instagram</a>
              <a href="#">LinkedIn</a>
              <a href="#">YouTube</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
