export const PUBLIC_NAV = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Curriculum", href: "/curriculum" },
  { label: "Trainers", href: "/trainers" },
  { label: "Advisory Board", href: "/advisory-board" },
  { label: "Patron", href: "/patron" },
  { label: "Apply", href: "/apply" },
] as const;

export const PUBLIC_CONTACT = {
  email: "admission@vivacareeracademy.com",
  phone: "+91 98765 43210",
  offices: "Mumbai, Delhi, Bangalore, Goa",
};

export const LIVE_SITE_HERO = {
  eyebrow: "Admissions Open · Travel Careers 2026 · Rolling intake",
  title: "A training institute for the world's most hospitable careers.",
  body:
    "VIVA prepares the next generation of travel, tourism and hospitality professionals through a hybrid programme of live cohorts, industry mentorship and global placement pathways.",
  ctas: [
    { label: "Begin Application", href: "/apply" },
    { label: "Explore Programs", href: "/courses" },
  ],
};

export const LIVE_SITE_METRICS = [
  { value: "14 yr", label: "Shaping hospitality careers across five continents." },
  { value: "92%", label: "Graduates placed within 90 days of convocation." },
  { value: "240+", label: "Partner employers across hospitality, travel, and aviation." },
];

export const LIVE_SITE_PHILOSOPHY = [
  {
    title: "Industry-embedded faculty",
    body: "Former GMs, cabin leads, sommeliers and destination directors guide each cohort with operator-level standards.",
  },
  {
    title: "Hybrid by design",
    body: "Three live evenings a week plus guided self-paced labs so working learners can stay disciplined without losing momentum.",
  },
  {
    title: "Placement as a promise",
    body: "Every programme ends in a career pathway backed by mentors, project review, and employer-facing readiness.",
  },
];

export const LIVE_SITE_PROGRAMS: ReadonlyArray<{
  code: string;
  title: string;
  body: string;
  duration: string;
  format: string;
  cohort: string;
  fee?: string;
  comingSoon?: boolean;
}> = [
  {
    code: "P · 01",
    title: "Foundation Program in Travel & Tourism Industry",
    body: "The 16-week foundation programme. Sector orientation, customer journey, sales, operations, geography, MICE, costing, and business models — disciplined first step into a real travel career for committed beginners.",
    duration: "16 weeks",
    format: "Hybrid",
    cohort: "26 May 2026",
    fee: "₹24,999*",
  },
  {
    code: "P · 02",
    title: "Travel Career Accelerator Program",
    body: "Master the commercial side of travel. Client acquisition, product positioning, pricing strategy, relationship management. Plan, sell, and deliver experiences end-to-end — designed for high-performance roles in travel sales and business development.",
    duration: "16 weeks",
    format: "Hybrid",
    cohort: "6 Jun 2026",
    fee: "₹36,999*",
  },
  {
    code: "P · 03",
    title: "Event & MICE Career Accelerator (Specialisation)",
    body: "Step into corporate events. Meetings, incentives, conferences, exhibitions, and destination weddings — event conceptualisation, vendor coordination, budgeting, and on-ground execution for India's fastest-growing experiential events segment.",
    duration: "16 weeks",
    format: "Hybrid",
    cohort: "Aug 2026",
    fee: "₹36,999*",
    comingSoon: true,
  },
  {
    code: "P · 04",
    title: "Travel Operations & Tour Management Program",
    body: "Operations-oriented programme. Itinerary design, GDS fundamentals, destination knowledge, vendor coordination, and end-to-end tour execution. Build the operational discipline behind seamless travel.",
    duration: "16 weeks",
    format: "Hybrid",
    cohort: "Aug 2026",
    fee: "₹36,999*",
    comingSoon: true,
  },
  {
    code: "P · 05",
    title: "Food & Beverage Service Professional Program",
    body: "Restaurant-floor mastery for hospitality careers. Front-of-house service, beverage knowledge, guest handling, and the operational rhythm of high-standard restaurants. For learners stepping into hospitality and F&B service roles.",
    duration: "16 weeks",
    format: "Hybrid",
    cohort: "Aug 2026",
    fee: "₹49,999*",
    comingSoon: true,
  },
];

export const LIVE_SITE_CURRICULUM = [
  {
    phase: "Semester I",
    title: "Foundations of Service & Hospitality",
    body: "Shared vocabulary of service standards, front-of-house operations, communication, and guest-facing professionalism.",
    modules: [
      "Introduction to the Hospitality Industry",
      "Front Office Management & Guest Relations",
      "Food & Beverage Service Foundations",
      "Professional Communication & Etiquette",
      "World Geography & Destination Studies I",
      "Studio: Service Simulation & Role-Play Labs",
    ],
  },
  {
    phase: "Semester II",
    title: "Operations & Travel Systems",
    body: "Itineraries, costing, documentation, visa logic, and customer handling discipline.",
    modules: [
      "Destination Planning",
      "Travel Costing & Margin Logic",
      "Visa and Documentation Systems",
      "Customer Scenarios and Escalation",
      "GDS Foundations",
      "Weekly Trainer Assessment",
    ],
  },
];

export const VIVA_12_MODULES = Array.from({ length: 12 }, (_, index) => ({
  week: `Week ${String(index + 1).padStart(2, "0")}`,
  title: [
    "Travel Industry Overview",
    "Geography & Destination Logic",
    "Airline and Airport Basics",
    "Hotels, DMCs, and Supplier Ecosystem",
    "Itinerary Planning",
    "Costing and Pricing",
    "Visa Processes and Documentation",
    "Customer Handling and Objections",
    "MICE and Corporate Travel",
    "Luxury Travel Design",
    "Sales and Negotiation",
    "Crisis Management and Career Readiness",
  ][index],
  locked: index > 1,
}));

export const LIVE_SITE_FACULTY = [
  {
    name: "Vikas Khanduri",
    role: "Faculty Head · Co-Founder",
    bio: "Thirty years with large travel companies — including Cox & Kings, Kuoni and SOTC. Leads VIVA Career Academy's flagship Travel Management programme.",
  },
];

export const AI_PLATFORM_PILLARS = [
  {
    title: "Curriculum AI",
    body: "Generates roadmap suggestions, chapter summaries, and specialization paths from learner intent.",
  },
  {
    title: "Student AI",
    body: "Acts as an AI coach that explains concepts, tracks risk, and nudges students before deadlines.",
  },
  {
    title: "Coach AI",
    body: "Assists trainers with suggested feedback, evaluation summaries, and content drafting.",
  },
];

export const INTERNAL_STUDENT = {
  progress: 68,
  module: "Module 6 · Costing and Pricing",
  pendingChapters: 3,
  penaltyAlert: "Complete this module within 2 days to avoid a ₹2000 relock fee.",
  chapters: [
    { name: "Chapter 1 · FIT pricing", status: "Evaluated" },
    { name: "Chapter 2 · Group costing", status: "Submitted" },
    { name: "Chapter 3 · Margin discipline", status: "Not started" },
  ],
};

export const INTERNAL_TRAINER = {
  assignedModules: ["Week 05 · Itinerary Planning", "Week 06 · Costing and Pricing"],
  queue: [
    { student: "Riya Sharma", module: "Costing and Pricing", status: "Needs review" },
    { student: "Arjun Nair", module: "Visa Processes", status: "AI feedback ready" },
  ],
};

export const INTERNAL_ADMIN = {
  metrics: [
    { label: "Active batches", value: "4" },
    { label: "Students", value: "73" },
    { label: "Pending payments", value: "9" },
    { label: "At-risk learners", value: "12" },
  ],
  actions: [
    "Create courses and weekly modules",
    "Assign trainers and cap batches at 20 students",
    "Track course fee, specialization fee, and penalty payments",
    "Monitor progression, lock states, and unlock overrides",
  ],
};
