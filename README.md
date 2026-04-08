# VIVA Academy Platform

Standalone academy OS for VIVA and future white-label institutes across travel, tourism, hospitality, and services.

## What This Repo Owns

- Public white-label academy website
- Admissions and payment flow
- Student, trainer, and admin portals
- Batch, session, roster, and attendance operations
- Zoom, Razorpay, email, and WhatsApp integration points
- Tenant branding, custom domains, and certification flows

## Monorepo Layout

```text
apps/
  web/        Next.js white-label academy frontend
  api/        FastAPI backend for academy operations and integrations
packages/
  ui/         Shared UI tokens and primitives
  types/      Shared contracts for academy entities
  config/     Tenant and env configuration helpers
  integrations/ Shared provider helpers and env contracts
docs/         Product, architecture, and deployment notes
infra/        Deployment guides and IaC placeholders
```

## Recommended Product Boundary

This repo should remain product-independent from NAMA.

- VIVA and future institutes run on their own domains.
- NAMA can remain an integration partner for CRM, AI scoring, or analytics.
- The learner, trainer, and admin experience should not expose NAMA unless you explicitly want a powered-by relationship.

## Immediate Build Priorities

1. Wire real auth and tenancy.
2. Implement durable academy state in the API.
3. Connect Zoom provisioning and webhook attendance.
4. Close the admissions to payment to enrollment to certificate loop.
5. Add white-label theme loading by domain.

## Local Development

### Frontend

```bash
pnpm install
pnpm dev:web
```

### API

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

## Notes

- The scaffold is intentionally production-shaped, not a throwaway prototype.
- This repo is designed so VIVA can launch first, then expand to multi-tenant white-label academies later.

