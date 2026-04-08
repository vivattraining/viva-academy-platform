# Architecture

## Core Principle

This platform is independent from NAMA at the product level.

- Own repo
- Own deployment pipeline
- Own domains
- Own tenant branding
- Shared-service integrations only where useful

## Applications

### `apps/web`

- Public marketing pages
- Application and payment handoff
- Student dashboard
- Trainer studio
- Admin CMS
- Batch and classroom operations

### `apps/api`

- Tenant records
- Branding and domains
- Applications and payments
- Batches, sessions, rosters, attendance
- Zoom provisioning and webhook processing
- Email and WhatsApp triggers
- Certificate issuance

## Shared Packages

- `@academy/ui`: design tokens and reusable UI
- `@academy/types`: shared entity contracts
- `@academy/config`: tenant defaults and env helpers
- `@academy/integrations`: provider wrappers and contract helpers

## Deployment Direction

- `apps/web`: Vercel
- `apps/api`: Railway, Render, Fly, or ECS
- `Postgres`: managed service
- `Redis`: Upstash or Redis Cloud
- `Storage`: S3

