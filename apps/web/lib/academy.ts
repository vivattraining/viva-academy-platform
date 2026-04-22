export const ACADEMY_NAV = [
  { label: "Admissions", href: "/admissions" },
  { label: "Messages", href: "/messages" },
  { label: "Operations", href: "/operations" },
  { label: "Roster", href: "/roster" },
  { label: "Student", href: "/student" },
  { label: "Trainer", href: "/trainer" },
  { label: "Admin CMS", href: "/admin" },
  { label: "Simulation", href: "/simulation" },
  { label: "White Label", href: "/white-label" },
  { label: "Strategy", href: "/strategy" },
  { label: "Login", href: "/login" }
] as const;

export const ACADEMY_THEME = {
  name: "Viva Career Academy",
  shortName: "VCA",
  tagline: "Not just a course. A career launchpad for the travel industry.",
  primary: "#0B1F3A",
  secondary: "#F4B400",
  ink: "#071C36",
  muted: "#5E6472",
  background: "#F7F9FB",
  surface: "#FFFFFF",
  surfaceLow: "#F2F4F6",
  domain: "academy.vivacareeracademy.com"
};

export const ACADEMY_METRICS = [
  { label: "Programs", value: "12-week flagship + specializations" },
  { label: "Delivery", value: "Live, recorded, simulation-led" },
  { label: "White label", value: "Custom domain + branded certificates" },
  { label: "AI layer", value: "Avatar trainers + EKLA evaluation" }
];

export const ACADEMY_FEATURES = [
  {
    title: "Editorial landing experience",
    body: "A premium, high-trust public site for student acquisition with urgency, faculty credibility, and placement framing."
  },
  {
    title: "Academy operations core",
    body: "Curriculum, terms, schedules, attendance, assessments, certificates, and content publishing in one control layer."
  },
  {
    title: "Avatar-ready trainer studio",
    body: "Trainers can record lessons, manage live sessions, and generate clone-led teaching assets without changing the curriculum model."
  },
  {
    title: "White-label deployment",
    body: "Every institute can run on its own domain with its own brand system while sharing the academy engine underneath."
  }
];

export const ACADEMY_PROGRAM_PILLARS = [
  {
    title: "Travel, tourism, hospitality, services",
    body: "The schema supports domain-specific academies without rebuilding the platform for each sector."
  },
  {
    title: "Module > term > lesson flexibility",
    body: "Programs can be short-form, term-based, cohort-based, or corporate induction style."
  },
  {
    title: "Live classrooms with controls",
    body: "Schedule classes, auto-track attendance, assign trainers, and surface missed sessions and replays."
  },
  {
    title: "Assessment with certification",
    body: "Use simulations, attendance, assignments, and AI scoring together before issuing branded certificates."
  }
];

export const ACADEMY_PUBLIC_SECTIONS = [
  "High-conversion hero with seat urgency and brochure CTA",
  "Why travel and why VIVA proof blocks",
  "12-week journey and specialization ladder",
  "Faculty, placements, testimonials, and corporate partnerships"
];

export const ACADEMY_STUDENT_STATS = [
  { label: "Overall progress", value: "45%", note: "Month 2 in progress" },
  { label: "Current week", value: "Week 5", note: "Itinerary + costing" },
  { label: "Pending chapters", value: "3", note: "Deadline this Friday" },
  { label: "Next live class", value: "Saturday · 11 AM", note: "Attendance mandatory" }
];

export const ACADEMY_STUDENT_MODULES = [
  {
    term: "Month 1 · Foundation",
    title: "Travel industry overview",
    completion: 100,
    note: "Completed with faculty approval"
  },
  {
    term: "Month 2 · Operations",
    title: "Itinerary planning and costing",
    completion: 68,
    note: "Three chapters and one simulation left"
  },
  {
    term: "Month 3 · Advanced",
    title: "MICE, luxury, sales, crisis management",
    completion: 12,
    note: "Unlocks after current term is cleared"
  }
];

export const ACADEMY_UPCOMING_CLASSES = [
  { title: "Live costing lab", trainer: "Vikas Khanduri", slot: "Sat · 11:00 AM", mode: "Live classroom" },
  { title: "Visa and documentation clinic", trainer: "Guest faculty", slot: "Sun · 4:00 PM", mode: "Hybrid replay" },
  { title: "Objection handling workshop", trainer: "EKLA assisted", slot: "Tue · 7:30 PM", mode: "Simulation review" }
];

export const ACADEMY_TRAINER_TOOLS = [
  "Lesson composer with video, text, decks, templates, and simulations",
  "Avatar pipeline for script-approved trainer clone delivery",
  "Cohort delivery with attendance and classroom controls"
];

export const ACADEMY_ADMIN_METRICS = [
  { label: "Tracks", value: "3" },
  { label: "Modules", value: "7" },
  { label: "Simulations", value: "25" },
  { label: "Tenant", value: "VIVA pilot" }
];

export const ACADEMY_OPERATIONS_STACK = [
  "Content CMS",
  "Classroom and attendance",
  "Certificates and compliance",
  "Brand and tenant control"
];

export const ACADEMY_SIMULATION_SCENE = {
  learner: "Riya Malhotra",
  role: "Travel sales trainee",
  score: 82,
  category: "Honeymoon sales simulation",
  title: "Bali enquiry with luxury + privacy intent",
  brief:
    "A couple wants a 5-night Bali honeymoon under Rs 2.5L. They care about privacy, premium feel, and smooth logistics. Your response should personalize, recommend a clear stay structure, and close with urgency.",
  learnerDraft:
    "Hi, thank you for your enquiry. We can share a Bali package for 5 nights with hotel and sightseeing. Please let us know your dates so we can send pricing.",
  improvedDraft:
    "Hi Raj and Priya, Bali is an excellent honeymoon choice for the mix of privacy and memorable experiences you're looking for. For your budget, I would recommend 2 nights in a private pool villa in Ubud followed by 3 nights in Seminyak close to the beach, so you get both quiet time and vibrant evenings. I can also include a couple spa and sunset dinner to make the stay feel more special. If you'd like, I can hold two strong villa options for your dates before availability tightens.",
  focus: ["Personalization", "Experience selling", "Urgency", "Closing strength"]
};

export const ACADEMY_WHITE_LABEL_CONTROLS = [
  "Custom domain mapping with SSL",
  "Academy logo, palette, typography, and homepage copy",
  "Own trainers, faculty bios, classrooms, and certificates",
  "Shared academy engine with tenant-safe data isolation"
];

export const ACADEMY_STRATEGY_OPTIONS = [
  {
    name: "Separate repo now",
    verdict: "Recommended",
    pros: [
      "Cleaner product identity for Viva Career Academy and future academy brands",
      "Own roadmap, deployments, and white-label positioning",
      "Easier future spinout or dedicated team structure"
    ],
    cons: [
      "More upfront setup across auth, CI/CD, and shared infra",
      "Requires clearer service boundaries with NAMA earlier"
    ]
  },
  {
    name: "Under NAMA repo",
    verdict: "Not chosen",
    pros: [
      "Faster short-term reuse"
    ],
    cons: [
      "Brand boundary gets muddy",
      "Harder to position as its own category product"
    ]
  }
];
