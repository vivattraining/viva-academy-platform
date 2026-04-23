"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import styles from "./claude-home.module.css";

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
  "Hospitality Management",
  "Travel Operations",
  "Airline & Airport Services",
  "Culinary Arts",
  "Event Design",
  "Cruise Line Operations",
  "Luxury Brand Services",
];

const programs = [
  {
    code: "P · 01",
    title: "Hospitality",
    emphasis: "Management",
    description:
      "From front office to food & beverage. A full operational grounding for careers in luxury hotels, resorts and boutique properties.",
    meta: [
      ["Duration", "18 months"],
      ["Format", "Hybrid"],
      ["Next cohort", "Aug 2026"],
    ],
  },
  {
    code: "P · 02",
    title: "Travel &",
    emphasis: "Tour Operations",
    description:
      "Itinerary design, GDS systems, destination expertise and the business of moving travellers around the world.",
    meta: [
      ["Duration", "12 months"],
      ["Format", "Hybrid"],
      ["Next cohort", "Aug 2026"],
    ],
  },
  {
    code: "P · 03",
    title: "Airline &",
    emphasis: "Airport Services",
    description:
      "Ground operations, cabin crew preparation, terminal services and the protocols of international aviation.",
    meta: [
      ["Duration", "9 months"],
      ["Format", "Hybrid"],
      ["Next cohort", "Aug 2026"],
    ],
  },
  {
    code: "P · 04",
    title: "Culinary",
    emphasis: "Arts",
    description:
      "Classical technique, modern technique, kitchen leadership. In partnership with three five-star kitchens and two culinary academies abroad.",
    meta: [
      ["Duration", "15 months"],
      ["Format", "Residential + Live"],
      ["Next cohort", "Sep 2026"],
    ],
  },
  {
    code: "P · 05",
    title: "Event &",
    emphasis: "MICE Design",
    description:
      "From destination weddings to corporate summits. A specialist track for the fastest-growing segment in Indian tourism.",
    meta: [
      ["Duration", "9 months"],
      ["Format", "Hybrid"],
      ["Next cohort", "Oct 2026"],
    ],
  },
  {
    code: "P · 06",
    title: "Cruise Line",
    emphasis: "Operations",
    description:
      "Maritime hospitality for the next generation of sea-going careers. Partnered with three global cruise operators.",
    meta: [
      ["Duration", "12 months"],
      ["Format", "Hybrid + Sea rotation"],
      ["Next cohort", "Sep 2026"],
    ],
  },
  {
    code: "P · 07",
    title: "Luxury Brand",
    emphasis: "Services",
    description:
      "For those drawn to concierge, private aviation, yacht crew and ultra-high-net-worth hospitality.",
    meta: [
      ["Duration", "9 months"],
      ["Format", "Hybrid"],
      ["Next cohort", "Oct 2026"],
    ],
  },
  {
    code: "P · 08",
    title: "Foundation",
    emphasis: "Semester",
    description:
      "For fresh graduates still choosing their path. A 12-week immersion across every track, ending in specialisation.",
    meta: [
      ["Duration", "3 months"],
      ["Format", "Live + Self-paced"],
      ["Next cohort", "Rolling"],
    ],
  },
];

const curriculum = [
  {
    label: "Semester I — Foundations",
    title: "Foundations of",
    emphasis: "Service & Hospitality",
    summary:
      "The first semester grounds every cohort in the shared vocabulary of the industry: service standards, front-of-house operations, communication, and the ethics of a guest-facing career.",
    modules: [
      ["M · 01", "Introduction to the Hospitality Industry", "40 hrs"],
      ["M · 02", "Front Office Management & Guest Relations", "60 hrs"],
      ["M · 03", "Food & Beverage Service Foundations", "50 hrs"],
      ["M · 04", "Professional Communication & Etiquette", "30 hrs"],
      ["M · 05", "World Geography & Destination Studies I", "40 hrs"],
      ["M · 06", "Studio: Service Simulation & Role-Play Labs", "25 hrs"],
    ],
  },
  {
    label: "Semester II — Operations",
    title: "Operations &",
    emphasis: "Applied Systems",
    summary:
      "The second semester moves into systems: reservation platforms, global distribution, revenue strategy and the operational cadence of real properties.",
    modules: [
      ["M · 07", "Amadeus & Sabre — GDS Certification", "70 hrs"],
      ["M · 08", "Revenue Management & Pricing Strategy", "45 hrs"],
      ["M · 09", "Housekeeping & Operational Excellence", "40 hrs"],
      ["M · 10", "Travel Law & International Regulation", "35 hrs"],
      ["M · 11", "Finance for Hospitality Professionals", "40 hrs"],
      ["M · 12", "Studio: End-to-End Property Simulation", "30 hrs"],
    ],
  },
  {
    label: "Semester III — Specialisation",
    title: "Your",
    emphasis: "Specialisation",
    summary:
      "In the third semester, students choose one of six specialisation tracks — taught by faculty drawn directly from that part of the industry.",
    modules: [
      ["S · 01", "Luxury Hospitality & Concierge", "Elective"],
      ["S · 02", "Airline Cabin Services & Ground Ops", "Elective"],
      ["S · 03", "Culinary & Kitchen Management", "Elective"],
      ["S · 04", "Event & MICE Design", "Elective"],
      ["S · 05", "Cruise Line Operations", "Elective"],
      ["S · 06", "Destination & Tourism Marketing", "Elective"],
    ],
  },
  {
    label: "Semester IV — Industry",
    title: "Paid",
    emphasis: "Industry Rotation",
    summary:
      "The programme closes with a paid placement at a partner employer — typically six months, across at least two operational departments, under a named mentor.",
    modules: [
      ["R · 01", "Placement Readiness & Employer Matching", "3 wks"],
      ["R · 02", "On-property Rotation · Department A", "12 wks"],
      ["R · 03", "On-property Rotation · Department B", "12 wks"],
      ["R · 04", "Capstone Review & Convocation", "2 wks"],
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
      "Thirty years with large travel companies. Leads VIVA institute's flagship Hospitality Management programme.",
    creds: ["Cox & Kings", "Kuoni", "SOTC"],
  },
  {
    code: "F · 02",
    name: "Dr Ashish Gautam",
    image: "/faculty/ashish-bhaiya-home.jpg",
    imageAlt: "Dr Ashish Gautam",
    label: "Guiding Mentor",
    role: "Fondly known as Ashish Bhaiya",
    imageClassName: styles.facultyPhotoAshish,
    description:
      "He has dedicated some of the best years of his life serving the untouched, needy and the poor.",
    creds: ["DivyaPrem"],
    href: "/guiding-mentor/ashish-bhaiya",
  },
  {
    code: "F · 03",
    name: "Chef Marco Tessier",
    role: "Director · Culinary Arts",
    description:
      "Former Executive Sous Chef at two Michelin-starred kitchens in Lyon. Founding chair of the VIVA culinary track and curator of the institute's visiting-chef series.",
    creds: ["Michelin", "Le Cordon Bleu", "ICCA"],
  },
  {
    code: "F · 04",
    name: "Priya Menon",
    role: "Lead · Travel & Operations",
    description:
      "Fifteen years in tour operations across Kerala, Sri Lanka and the Maldives. Designs the institute's GDS and destination studies modules.",
    creds: ["Thomas Cook", "Amadeus Cert."],
  },
  {
    code: "F · 05",
    name: "Daniyal Kapoor",
    role: "Lead · Events & MICE",
    description:
      "Produced over 400 luxury destination weddings and corporate summits. Leads the institute's event-production studio and industry showcases.",
    creds: ["WeddingSutra", "IIFA"],
  },
  {
    code: "F · 06",
    name: "Narayan Mallapur",
    image: "/faculty/vikas-khanduri-updated.png",
    imageAlt: "Narayan Mallapur",
    label: "Leadership",
    role: "Operations & Growth",
    description:
      "Supports Viva Career Academy across operations, growth, and launch execution as the platform scales into its next chapter.",
    creds: ["Admissions", "Operations", "Growth"],
  },
];

const faqs = [
  {
    question: "Do I need a background in travel or hospitality to apply?",
    answer:
      "No. Most of our incoming cohort are fresh college graduates with no prior industry exposure. The Foundation Semester is designed precisely for students choosing their path — we start at first principles and move quickly.",
  },
  {
    question: "How does the hybrid format actually work?",
    answer:
      "Live cohorts meet on Zoom and in regional VIVA studios in Mumbai, Bangalore, Delhi and Goa three evenings a week. Self-paced students follow the same syllabus on demand and can join any live session. You can switch modes mid-programme.",
  },
  {
    question: "Is the paid industry rotation guaranteed?",
    answer:
      "Yes. Every full programme concludes with a paid rotation at a partner employer. Our placement desk has worked with more than 240 employers across 26 countries. Rotations are matched, not applied for.",
  },
  {
    question: "What does a semester cost, and are scholarships available?",
    answer:
      "Live cohort fees start at ₹1,85,000 per semester; self-paced at ₹98,000. Roughly 38% of incoming students receive merit or need-based scholarships ranging from 15% to full tuition.",
  },
  {
    question: "What's the admissions timeline for Monsoon 2026?",
    answer:
      "Applications close 14 May 2026. Admissions conversations happen on a rolling basis. Offers are issued within 14 days of interview. The cohort begins 11 August 2026.",
  },
  {
    question: "Will I receive a recognised certification?",
    answer:
      "All programmes conclude in a VIVA Diploma, co-signed by our industry advisory board. Several tracks carry additional certifications from IATA, Amadeus and partner culinary academies.",
  },
];

export function ClaudeHome() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <main className={styles.page}>
      <div className={styles.topBanner}>
        Admissions Open · Travel Careers 2026 <b>·</b> Applications close 14 May <b>·</b> Live + Self-paced
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
                  <div className={styles.miniStatLabel}>Shaping hospitality careers across five continents.</div>
                </div>
                <div className={styles.miniStat}>
                  <div className={styles.miniStatValue}>
                    92<sup>%</sup>
                  </div>
                  <div className={styles.miniStatLabel}>Graduates placed within 90 days of convocation.</div>
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
                For more than a decade, VIVA has built a curriculum rooted in the belief that service is an art, operations are a science, and careers in travel demand both. Our graduates run lobbies in Luzern, run kitchens in Colombo, and run tour desks on cruise ships that never stop moving.
              </p>
              <p className={styles.bodyText}>
                The institute operates across three continents, in partnership with hotel groups, airlines and tourism boards — so what you learn on Monday, you apply on Friday.
              </p>
            </div>
            <div className={styles.pillarList}>
              {[
                [
                  "i",
                  "Industry-embedded faculty",
                  "Former GMs, cabin leads, sommeliers and destination directors — not career academics. Every instructor has operated a floor you've walked across.",
                ],
                [
                  "ii",
                  "Hybrid by design, not accident",
                  "Live cohorts meet three evenings a week over Zoom and in regional studios. Self-paced labs sit alongside — so working students and first-years move at the pace that suits them.",
                ],
                [
                  "iii",
                  "Placement as a promise",
                  "Every programme ends in a paid industry rotation. Our placement desk has seated graduates at more than 240 employers across 26 countries.",
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
              Six career tracks. <em>One</em> unwavering standard.
            </h2>
          </div>

          <div className={styles.programGrid}>
            {programs.map((program) => (
              <article className={styles.programCard} key={program.code}>
                <div className={styles.programInner}>
                  <div className={styles.programArrow}>↗</div>
                  <div className={styles.programNumber}>{program.code}</div>
                  <h3 className={styles.programTitle}>
                    {program.title}
                    <br />
                    <em>{program.emphasis}</em>
                  </h3>
                  <div className={styles.programDescription}>{program.description}</div>
                  <div className={styles.programMeta}>
                    {program.meta.map(([label, value]) => (
                      <div className={styles.metaRow} key={label}>
                        <span>{label}</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.format} id="format">
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>§ 03 — Format</div>
            <h2 className={styles.sectionTitle}>
              Learn the way <em>professionals</em> actually train.
            </h2>
          </div>

          <div className={styles.formatGrid}>
            <article className={styles.formatCard}>
              <div className={styles.tag}>
                <span className={styles.dot} /> Live Cohort
              </div>
              <h3>
                Three evenings. One <em>room</em>. Your cohort of 24.
              </h3>
              <p>
                Small-group classes taught live over video and in VIVA regional studios. Faculty know your name, critique your work in real time and introduce you to their networks.
              </p>
              <ul>
                <li>24-student cohorts · Monday, Wednesday, Friday evenings</li>
                <li>Guest masterclasses from hotel GMs and destination leaders</li>
                <li>Industry site visits every month of the programme</li>
                <li>Dedicated career mentor from week one</li>
              </ul>
              <div className={styles.formatFoot}>
                <div className={styles.price}>
                  ₹ 1,85,000 <small>/ semester</small>
                </div>
                <a className={`${styles.button} ${styles.buttonAccent}`} href="#admissions">
                  Cohort Details <span className={styles.arrow}>↗</span>
                </a>
              </div>
            </article>

            <article className={`${styles.formatCard} ${styles.formatCardSecondary}`}>
              <div className={styles.tag}>
                <span className={styles.dot} /> Self-paced Track
              </div>
              <h3>
                At your rhythm. <em>Same</em> standard, same credential.
              </h3>
              <p>
                Purpose-built video modules, written casework and simulator labs you can complete around work or family. Join live sessions as you&apos;re able and graduate on your timeline.
              </p>
              <ul>
                <li>120+ hours of studio-produced coursework</li>
                <li>Weekly office hours with programme faculty</li>
                <li>Peer study groups across 14 Indian cities</li>
                <li>Upgrade to a live cohort at any point</li>
              </ul>
              <div className={styles.formatFoot}>
                <div className={styles.price}>
                  ₹ 98,000 <small>/ semester</small>
                </div>
                <a className={styles.buttonGhostLight} href="#admissions">
                  Self-paced Details <span className={styles.arrow}>↗</span>
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
              The institute&apos;s real résumé is its <em>graduates</em>.
            </h2>
            <div className={styles.outcomesSide}>
              Independently audited outcomes from the Class of 2024. Methodology and source roster available on request from the placements office.
            </div>
          </div>

          <div className={styles.statGrid}>
            {[
              ["92", "%", "Placed in a paid role within 90 days of graduation."],
              ["₹ 4.8L", "", "Median first-year compensation (domestic track)."],
              ["26", "", "Countries where VIVA alumni are currently employed."],
              ["240", "+", "Partner employers, from boutique resorts to flag carriers."],
            ].map(([value, suffix, label]) => (
              <div className={styles.stat} key={label}>
                <div className={styles.statValue}>
                  {value}
                  {suffix ? <sup>{suffix}</sup> : null}
                </div>
                <div className={styles.statLabel}>{label}</div>
              </div>
            ))}
          </div>

          <div className={styles.employerStrip}>
            <div className={styles.employerLabel}>Placement partners include</div>
            <div className={styles.logos}>
              <span>Taj Hotels</span>
              <span>Oberoi</span>
              <span>Marriott</span>
              <span>Accor</span>
              <span>Thomas Cook</span>
              <span>Emirates</span>
              <span>MakeMyTrip</span>
              <span>+ 232 more</span>
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
                <div className={styles.modules}>
                  {curriculum[activeTab].modules.map(([code, title, duration]) => (
                    <div className={styles.module} key={code}>
                      <div className={styles.moduleCode}>{code}</div>
                      <div className={styles.moduleTitle}>{title}</div>
                      <div className={styles.moduleDuration}>{duration}</div>
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

      <section className={styles.testimonial}>
        <div className={`${styles.wrap} ${styles.testimonialBody}`}>
          <div className={styles.testimonialImg}>
            <div className={styles.alumniCard}>
              <div className={styles.alumniGlow} />
              <div className={styles.alumniStamp}>Alumni Story</div>
              <div className={styles.alumniLocation}>Muscat · Guest Relations Track</div>
            </div>
          </div>
          <div>
            <div className={styles.eyebrow}>§ 06 — Voices from the field</div>
            <p className={styles.quote} style={{ marginTop: 24 }}>
              VIVA didn&apos;t just teach me how to run a lobby. It taught me how to read a room — and after two years with a five-star group in Muscat, I can tell you: that&apos;s the job.
            </p>
            <div className={styles.quoteAttrib}>
              <div className={styles.quoteWho}>
                Riya Thomas
                <small>Front Office Manager · Jumeirah Group · Class of 2023</small>
              </div>
              <div className={styles.quoteOutcome}>Placed via VIVA Mumbai</div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.admissions} id="admissions">
        <div className={`${styles.wrap} ${styles.admissionsBody}`}>
          <div>
            <div className={`${styles.eyebrow} ${styles.eyebrowDark}`}>§ 07 — Admissions 2026</div>
            <h2 className={styles.admissionsTitle} style={{ marginTop: 20 }}>
              Your <em>career</em> begins with one application.
            </h2>
            <p className={styles.lead}>
              The Monsoon 2026 cohort closes applications on 14 May. We review every file personally — no aptitude test, no ranked entrance exam. We&apos;re looking for character, curiosity and commitment.
            </p>
            <div className={styles.ctaRow} style={{ marginTop: 28 }}>
              <Link className={`${styles.button} ${styles.buttonAccent}`} href="/apply">
                Begin Application <span className={styles.arrow}>↗</span>
              </Link>
              <Link className={styles.buttonGhostLight} href="/brochure">
                Download Prospectus
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
                A training institute for the world&apos;s most hospitable careers. Studios in Mumbai, Bangalore, Delhi and Goa. Online, everywhere.
              </p>
            </div>

            <div className={styles.footerColumn}>
              <h6 className={styles.footerHeading}>Programs</h6>
              <a href="#programs">Hospitality Management</a>
              <a href="#programs">Travel Operations</a>
              <a href="#programs">Airline & Airport</a>
              <a href="#programs">Culinary Arts</a>
              <a href="#programs">Event & MICE</a>
              <a href="#programs">Cruise Line Ops</a>
            </div>

            <div className={styles.footerColumn}>
              <h6 className={styles.footerHeading}>Academy</h6>
              <a href="#about">About VIVA</a>
              <a href="#faculty">Faculty</a>
              <a href="#curriculum">Curriculum</a>
              <a href="#outcomes">Outcomes & Alumni</a>
              <Link href="/strategy">Research</Link>
              <Link href="/contact">Press</Link>
            </div>

            <div className={styles.footerColumn}>
              <h6 className={styles.footerHeading}>Admissions</h6>
              <Link href="/apply">How to Apply</Link>
              <a href="#admissions">Fees & Financing</a>
              <a href="#admissions">Scholarships</a>
              <Link href="/brochure">Prospectus</Link>
              <a href="mailto:admission@vivacareeracademy.com">Book a Call</a>
              <Link href="/login">Application Login</Link>
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
