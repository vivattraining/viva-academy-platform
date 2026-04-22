# Viva Career Academy OS PRD

## Document Control

- Product: Viva Career Academy OS
- Version: 1.0
- Status: Launch-ready PRD
- Date: 2026-04-08
- Owner: VIVA / Academy Platform Team
- Repository: `/Users/radhika/Documents/New project/viva-academy-platform`

## Executive Summary

Viva Career Academy OS is a standalone, white-label-ready digital academy platform built for travel, tourism, hospitality, and services education. The first deployment is for Viva Career Academy on its own domain, with architecture designed to support future academy brands without restructuring the core product.

The platform combines:

- student acquisition and admissions
- application fee collection
- learner onboarding
- batch and class operations
- Zoom-based live classrooms
- attendance and roster tracking
- messaging workflows
- white-label branding and tenant control

The immediate goal is to launch a premium, credible, operational digital academy experience under VIVA branding. The long-term goal is to create a reusable academy operating system for multiple institutions.

## Product Vision

Build the operating system for modern skill-development academies in travel and services, where admissions, payments, learning delivery, live sessions, attendance, communication, and certification work as one connected experience.

## Problem Statement

Most training institutes operate with fragmented tools and manual workflows. Common issues include:

- disconnected admissions and payments
- weak follow-up after student enquiry
- no clean handoff from payment to class onboarding
- poor visibility into attendance and batch operations
- no unified messaging layer for email, WhatsApp, and class reminders
- no white-label system for independent institute branding and domains

This creates revenue leakage, poor student confidence, and operational inefficiency.

## Opportunity

Viva Career Academy has the opportunity to launch not just a training website, but a modern academy platform that feels premium, operationally mature, and scalable. The platform can first power Viva Career Academy and later be reused across additional academy brands in travel, hospitality, and services.

## Product Goals

### Primary Goals

- Increase application-to-payment conversion
- Reduce operational friction in admissions and class coordination
- Improve the credibility and trust of the academy experience
- Give students a clear, guided post-payment learning journey
- Support live-class delivery with Zoom and attendance controls
- Establish a reusable white-label product foundation

### Secondary Goals

- Prepare the platform for trainer-avatar delivery
- Create a future path for certification, hiring, and placements
- Enable tenant-driven branding and institute-specific content control

## Non-Goals For Current Launch

- Full curriculum authoring suite
- Full LMS grading engine
- Production-grade certificate issuance engine
- Fully automated marketing CRM
- Deep analytics and BI dashboards
- Global multi-language support

These are future roadmap items and are not required for the initial VIVA launch.

## Target Users

### 1. Institute Admin

Responsible for branding, overall academy setup, and governance.

Needs:

- white-label settings
- academy branding
- domain ownership
- oversight of operations

### 2. Operations Team

Responsible for applications, payment follow-up, enrollment, batches, and classes.

Needs:

- application review
- payment-link generation
- enrollment activation
- batch and session management
- attendance oversight
- message dispatch

### 3. Trainers / Guest Faculty

Responsible for live delivery and learner engagement.

Needs:

- session visibility
- Zoom provisioning
- attendance marking
- future trainer content creation tools

### 4. Students

Responsible for enrolling, attending, and progressing through the program.

Needs:

- clear application journey
- payment clarity
- learner dashboard
- live class access
- attendance and progression visibility

### 5. Future White-Label Academy Owners

Responsible for running their own academy on the shared platform.

Needs:

- own domain
- own branding
- own programs
- tenant-safe isolation

## Core Product Principles

- Viva Career Academy must feel like the owner of the product, not a tenant inside another visible brand
- the user experience must feel premium and trustworthy
- admissions to enrollment must be a connected journey
- live class delivery must be operationally integrated
- white-label support must be designed in from day one
- the launch version must prioritize coherence over breadth

## Scope For Current Build

### Included

- public academy homepage
- admissions journey
- application creation
- payment-link generation
- payment success and failure flows
- receipt page
- role-based login
- student dashboard
- trainer surface
- admin branding surface
- operations workbench
- roster and attendance
- messaging center
- Zoom provisioning scaffold
- tenant branding and domain resolution

### Excluded For Now

- full curriculum builder
- rich assessment engine
- live certificate designer
- advanced analytics dashboards
- recruiter marketplace
- AI avatar creation workflow

## User Journeys

### Journey 1: Applicant

1. User lands on the Viva Career Academy admissions page
2. User submits basic application form
3. System creates application record
4. System generates payment link
5. User completes payment
6. User sees payment success and receipt
7. Application is activated for enrollment
8. Student can move into learner access

### Journey 2: Student

1. Student logs in
2. Student sees active batch, sessions, and attendance
3. Student opens Zoom/classroom link
4. Attendance is recorded
5. Student continues cohort progression

### Journey 3: Operations

1. Team logs into secure operator workspace
2. Team reviews applications
3. Team issues payment links or updates statuses
4. Team creates/manages batches and sessions
5. Team provisions Zoom for live sessions
6. Team marks or verifies attendance
7. Team uses messaging center for reminders and confirmations

### Journey 4: Admin

1. Admin logs in
2. Admin reviews tenant branding
3. Admin updates domain-facing academy details
4. Admin governs launch settings and white-label controls

## Functional Requirements

## 1. Public Website and Admissions

The platform must provide:

- a premium branded landing experience
- a student application form
- immediate application confirmation
- ability to continue into payment
- payment recovery path if payment fails
- receipt view after success

Success criteria:

- no dead-end after form submission
- student understands what happens next
- payment state is visible and recoverable

## 2. Authentication and Roles

The system must support:

- admin login
- operations login
- trainer login
- student login
- tenant-scoped session handling

Role access rules:

- admin: full access
- operations: admissions, operations, roster, messaging
- trainer: operations-relevant class views and attendance
- student: learner workspace only

## 3. Student Workspace

The system must provide a student dashboard showing:

- student identity
- course/program
- enrollment stage
- active batch
- upcoming sessions
- attendance count
- Zoom or classroom access links

The student workspace must be based on real backend data, not static mock content.

## 4. Admissions Operations

Operators must be able to:

- view application records
- review stage and payment state
- issue payment links
- update application status
- move learners toward enrollment

## 5. Payments

The payment system must support:

- application fee creation
- order or payment-link generation
- payment success handling
- payment failure handling
- receipt access
- application state update after payment

The launch version may support mock-safe fallback, but production must use live Razorpay credentials and webhook validation.

## 6. Batch and Session Operations

Operations users must be able to:

- create batches
- create sessions
- link sessions to batches
- store classroom and Zoom metadata
- see roster by enrolled learners

## 7. Zoom Integration

The system must support:

- Zoom meeting provisioning for sessions
- storage of meeting ID and join links
- class attendance linkage
- future webhook-driven attendance updates

## 8. Attendance and Roster

The system must support:

- enrolled roster visibility
- session attendance records
- attendance totals per learner
- trainer or system-driven attendance updates

## 9. Messaging Center

The system must provide a message queue derived from live state.

It must support:

- application confirmation messages
- payment reminders
- class reminder triggers
- operator-triggered dispatch action
- event logging for sent messages

Launch version behavior:

- UI-triggered message dispatch logs the action
- production version should connect to live providers

## 10. White-Label and Domain Support

The system must support:

- tenant-branded experience
- institute-owned domain
- institute-owned brand name, academy name, and colors
- tenant lookup by incoming domain

VIVA must be able to run on its own domain without visible NAMA branding.

## Non-Functional Requirements

### UX

- premium and modern
- high trust
- clear next steps
- consistent across public and secure surfaces

### Architecture

- standalone repo
- frontend and backend separation
- tenant-aware backend state
- provider-safe integration boundaries

### Reliability

- mock-safe when live credentials are absent
- resilient state handling for launch demo
- clear fallback behavior for failed external integrations

### Security

- role-based access
- tenant-scoped session validation
- private operator surfaces must not be publicly writable

## Integrations

### Zoom

Purpose:

- live class provisioning
- join URLs
- attendance-linked session workflow

### Razorpay

Purpose:

- application fee collection
- payment lifecycle
- webhook-backed enrollment activation

### Resend

Purpose:

- transactional email
- application confirmation
- receipt and onboarding communication

### WhatsApp

Purpose:

- application reminders
- payment nudges
- session reminders

## Technical Architecture Summary

### Frontend

- Next.js App Router
- React
- route-based product surfaces
- tenant-aware shell branding

Primary frontend folders:

- `apps/web/app`
- `apps/web/components`
- `apps/web/lib`

### Backend

- FastAPI
- SQLAlchemy-backed persistence
- tenant state store
- auth/session handling
- provider integration scaffolding

Primary backend folders:

- `apps/api/app/routers`
- `apps/api/app/store.py`
- `apps/api/app/integrations.py`
- `apps/api/app/auth.py`

## Current Build Status

### Complete

- standalone repo architecture
- public landing and admissions surface
- application creation flow
- payment-link flow
- payment success/failure/receipt pages
- role-based login
- student dashboard with real backend data
- messaging center
- operations and roster surfaces
- batch/session state
- domain-aware branding in shell

### Remaining For Production Launch

- live Resend sending
- live WhatsApp sending
- live Razorpay credentials and webhook hardening
- live Zoom credentials and webhook hardening
- full-page runtime theming beyond shell-level branding
- production deployment and domain cutover

## Launch Readiness

### Demo / Soft Launch Ready

Yes.

The product is suitable for:

- stakeholder demo
- institute walkthrough
- founder-led presentation
- soft launch preview

### Production Launch Pending

The platform still needs:

- live provider credentials
- deployment environment setup
- domain/DNS configuration
- end-to-end UAT on production infrastructure

## Risks

### 1. Integration Risk

Live providers may require credential validation, webhook testing, or approved templates before full production usage.

Mitigation:

- keep mock-safe fallback
- complete provider-by-provider production checklists

### 2. Operational Risk

If payments and messaging are partially live, operators may assume tasks were sent when only UI events were logged.

Mitigation:

- clearly label provider status
- do not mark dispatch as production-ready until provider success is confirmed

### 3. Theming Risk

Branding currently resolves strongly in the shell, but deeper page-level theming is still limited.

Mitigation:

- extend tenant theme tokens into more page components after launch

## KPIs

- applications submitted
- payment links issued
- application-to-payment conversion
- payment-to-enrollment conversion
- active students per batch
- attendance completion rate
- operator response time
- messages dispatched per journey stage

## Recommended Launch Sequence

### Phase 1: Demo / Preview

- run the platform with seeded data
- demo admissions to payment to learner flow
- show operations, Zoom, roster, and messaging

### Phase 2: Production Setup

- connect live Zoom
- connect live Razorpay
- connect live email and WhatsApp
- deploy frontend and backend
- map VIVA domain

### Phase 3: Post-Launch

- upgrade curriculum and CMS depth
- improve page-wide theming
- add certification workflows
- add trainer-avatar capabilities

## Open Questions

- final production domain choice: `academy.vivacareeracademy.com` vs `learn.vivacareeracademy.com`
- final transactional email sender identity
- final WhatsApp provider account and approved templates
- real payment fee amount and commercial rules
- whether VIVA wants public brochure download and lead capture before application

## Appendix: Key Routes

### Frontend Routes

- `/`
- `/admissions`
- `/login`
- `/student`
- `/trainer`
- `/admin`
- `/operations`
- `/roster`
- `/messages`
- `/simulation`
- `/white-label`
- `/strategy`
- `/payment/success`
- `/payment/failed`
- `/payment/receipt/[applicationId]`

### Key Backend Capabilities

- tenant lookup by domain
- application CRUD
- payment-link generation
- payment capture
- student self-view
- batch and session operations
- attendance updates
- Zoom provisioning
- messaging queue generation
- message dispatch logging

## Final Recommendation

Proceed with VIVA demo and soft launch using the current build, while immediately scheduling production integration work for Zoom, Razorpay, Resend, WhatsApp, and deployment on VIVA's own domain.
