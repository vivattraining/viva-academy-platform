from sqlalchemy import Column, Integer, JSON, String, UniqueConstraint

from app.db import Base


class AcademyTenantState(Base):
    __tablename__ = "academy_tenant_states"
    __table_args__ = (UniqueConstraint("tenant_name", name="uq_academy_tenant_state_tenant"),)

    id = Column(Integer, primary_key=True, index=True)
    tenant_name = Column(String, index=True, nullable=False)
    state = Column(JSON, nullable=False)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)


class AcademyUserCredential(Base):
    __tablename__ = "academy_user_credentials"
    __table_args__ = (UniqueConstraint("tenant_name", "email", name="uq_academy_user_credential"),)

    id = Column(Integer, primary_key=True, index=True)
    tenant_name = Column(String, index=True, nullable=False)
    email = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)


class AcademyAuthSession(Base):
    __tablename__ = "academy_auth_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_token = Column(String, unique=True, index=True, nullable=False)
    tenant_name = Column(String, index=True, nullable=False)
    email = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    created_at = Column(String, nullable=False)
    expires_at = Column(String, nullable=False)
    revoked_at = Column(String, nullable=True)


class AcademyWebhookEvent(Base):
    """
    Idempotency log for inbound webhooks (Razorpay, Zoom, Resend, etc).

    Each row represents one external event that has been processed by us.
    Webhook handlers MUST short-circuit on duplicate `event_id` to prevent
    refund→re-capture replay attacks (§17.2 C2). Per-source uniqueness is
    enforced via UniqueConstraint on (source, event_id).
    """

    __tablename__ = "academy_webhook_events"
    __table_args__ = (
        UniqueConstraint("source", "event_id", name="uq_academy_webhook_event"),
    )

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, index=True, nullable=False)  # 'razorpay' | 'zoom' | 'resend' | ...
    event_id = Column(String, index=True, nullable=False)
    reference = Column(String, nullable=True)  # optional secondary ref, e.g. application_id
    processed_at = Column(String, nullable=False)


class AcademyCatalogSnapshot(Base):
    """
    Last-known snapshot of the course catalog. The audit detector
    compares the live catalog against this row on each request to
    /courses/catalog; when they differ, change events are appended
    and the snapshot is replaced.

    A single row would suffice, but keeping append-only history makes
    forensic recovery trivial — you can rebuild any past catalog state
    by replaying snapshots in order.
    """

    __tablename__ = "academy_catalog_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    captured_at = Column(String, nullable=False, index=True)
    catalog_hash = Column(String, nullable=False, index=True)
    snapshot = Column(JSON, nullable=False)
    commit_sha = Column(String, nullable=True)
    commit_message = Column(String, nullable=True)


class AcademyCatalogChangeEvent(Base):
    """
    Append-only log of every detected change to the course catalog.

    One row per (course, field) change in a single deploy. So a
    catalog edit that bumps both fee_inr and cohort_label on P·01
    produces two rows for the same detected_at timestamp.

    Visible to admins via GET /api/v1/academy/courses/changes and
    surfaced in the /admin UI.
    """

    __tablename__ = "academy_catalog_change_events"

    id = Column(Integer, primary_key=True, index=True)
    detected_at = Column(String, nullable=False, index=True)
    course_code = Column(String, nullable=False, index=True)
    field = Column(String, nullable=False)
    before_value = Column(String, nullable=True)
    after_value = Column(String, nullable=True)
    commit_sha = Column(String, nullable=True)
    commit_message = Column(String, nullable=True)
