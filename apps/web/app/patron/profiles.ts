/**
 * Patron profiles.
 *
 * Honorary supporters and senior figures who lend their name and
 * reputation to Viva Career Academy. Same shape as the Advisory Board
 * profile so the rendering component can be shared.
 *
 * Image guidance: drop photos at apps/web/public/patron/<file>.jpg,
 * 4:5 portrait, ~1200px on the long edge. Leave `image: null` for now
 * to use the initials-portrait fallback.
 */

export type PatronProfile = {
  code: string;
  name: string;
  title: string;
  company: string;
  description: string;
  image?: string | null;
  imageAlt?: string;
  creds?: string[];
};

export const PATRONS: PatronProfile[] = [
  {
    code: "P · 01",
    name: "Patron Name",
    title: "Founder & Chairperson",
    company: "Industry-Defining Travel Group",
    description:
      "A founding figure of modern Indian travel. Lends decades of vision, network, and institutional gravitas to Viva — anchoring the academy's positioning as a serious career launchpad.",
    image: null,
    creds: ["Founder", "Industry Vision"],
  },
  {
    code: "P · 02",
    name: "Patron Name",
    title: "Cultural & Tourism Ambassador",
    company: "Public Service · Heritage Sector",
    description:
      "A respected voice in heritage tourism and cultural diplomacy. Brings perspective on slow travel, responsible tourism, and the soft-power dimension of India's travel future.",
    image: null,
    creds: ["Heritage", "Diplomacy"],
  },
  {
    code: "P · 03",
    name: "Patron Name",
    title: "Honorary Patron",
    company: "Recognised Industry Statesperson",
    description:
      "A career spanning aviation, hospitality, and corporate travel. Mentors Viva's strategic direction and opens doors across India and the international travel industry.",
    image: null,
    creds: ["Mentor", "Network"],
  },
];
