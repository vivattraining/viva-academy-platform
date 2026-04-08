import { SiteShell } from "../../components/site-shell";
import { ACADEMY_TRAINER_TOOLS } from "../../lib/academy";

export default function TrainerPage() {
  return (
    <SiteShell
      activeHref="/trainer"
      eyebrow="Trainer studio"
      title="Trainers create sessions, publish lessons, record avatar-safe content, and run live Zoom classrooms."
      description="This screen is the working hub for faculty and guest lecturers. It should support live delivery, AI avatar content generation, materials, assignments, and session-level attendance review."
      primaryCta={{ label: "Open operations", href: "/operations" }}
      secondaryCta={{ label: "Open admin CMS", href: "/admin" }}
    >
      <section className="grid grid-3">
        {ACADEMY_TRAINER_TOOLS.map((item) => (
          <article key={item} className="card">
            <div className="eyebrow">Trainer capability</div>
            <div style={{ marginTop: 12, fontSize: 24, fontWeight: 900, lineHeight: 1.2, letterSpacing: "-0.04em" }}>{item}</div>
          </article>
        ))}
      </section>
    </SiteShell>
  );
}
