import { MessagingCenter } from "../../components/messaging-center";
import { OperatorGate } from "../../components/operator-gate";
import { SiteShell } from "../../components/site-shell";

export default function MessagesPage() {
  return (
    <SiteShell
      activeHref="/messages"
      eyebrow="Messaging center"
      title="Run admissions, payment, and class communication from one queue."
      description="VIVA should not rely on scattered reminders. This view brings together email confirmations, WhatsApp nudges, and Zoom-class reminder triggers."
      primaryCta={{ label: "Open admissions", href: "/admissions" }}
      secondaryCta={{ label: "Open operations", href: "/operations" }}
    >
      <OperatorGate title="Messaging control" allowedRoles={["admin", "operations", "trainer"]}>
        <MessagingCenter />
      </OperatorGate>
    </SiteShell>
  );
}
