"use client";

import { useEffect, useState } from "react";

import { defaultRouteForRole, isSessionExpired, readSession, type AcademySession } from "../lib/auth";

export function InternalRouteGate({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const current = readSession();
    const session: AcademySession | null = current && !isSessionExpired(current) ? current : null;

    if (!session) {
      window.location.replace("/internal/login");
      return;
    }

    if (!allowedRoles.includes(session.role)) {
      window.location.replace(defaultRouteForRole(session.role));
      return;
    }

    setAllowed(true);
    setReady(true);
  }, [allowedRoles]);

  if (!ready || !allowed) {
    return <section className="editorial-workbench-card">Redirecting to the correct secure workspace...</section>;
  }

  return <>{children}</>;
}
