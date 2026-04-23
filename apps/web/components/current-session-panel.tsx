"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { defaultRouteForRole, readSession, type AcademySession } from "../lib/auth";

export function CurrentSessionPanel() {
  const [session, setSession] = useState<AcademySession | null>(null);

  useEffect(() => {
    const sync = () => setSession(readSession());
    sync();
    window.addEventListener("academy-session-changed", sync);
    return () => window.removeEventListener("academy-session-changed", sync);
  }, []);

  if (!session) {
    return null;
  }

  return (
    <section className="editorial-workbench-card editorial-workbench-contrast" style={{ marginBottom: 24 }}>
      <div className="eyebrow">Current session</div>
      <h2 className="editorial-workbench-title" style={{ marginTop: 12, fontSize: "2rem" }}>
        Signed in as {session.full_name} · {session.role}
      </h2>
      <p className="editorial-workbench-subtitle">
        Continue into the workspace that matches this role.
      </p>
      <div className="button-row">
        <Link className="button-primary" href={defaultRouteForRole(session.role)}>Open workspace</Link>
      </div>
    </section>
  );
}
