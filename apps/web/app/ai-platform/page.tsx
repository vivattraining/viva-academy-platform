import { MarketingShell } from "../../components/marketing-shell";
import { AI_PLATFORM_PILLARS } from "../../lib/public-site-content";

export default function AIPlatformPage() {
  return (
    <MarketingShell activeHref="/ai-platform">
      <section className="editorial-page-hero compact">
        <div className="editorial-page-hero-copy">
          <span className="editorial-kicker">AI Platform</span>
          <h1 className="editorial-page-title">A human-led academy with an AI intelligence layer underneath.</h1>
          <p className="editorial-section-copy">
            VIVA uses AI to personalize roadmaps, support students, assist trainer feedback, and power disciplined progression without replacing human judgement.
          </p>
        </div>
      </section>

      <section className="editorial-grid editorial-grid-3">
        {AI_PLATFORM_PILLARS.map((item) => (
          <article key={item.title} className="editorial-card">
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </section>
    </MarketingShell>
  );
}
