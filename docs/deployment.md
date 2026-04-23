# Deployment Notes

## Domains

Each tenant should run on its own domain or subdomain, for example:

- `academy.vivacareeracademy.com`
- `learn.brandname.com`

The platform should resolve tenant context from the incoming host.

## Required External Services

- Postgres
- Redis
- Zoom Server-to-Server OAuth app
- Razorpay
- Resend
- WhatsApp Business Platform

## Production Checklist

1. Connect tenant domain and SSL.
2. Configure provider secrets.
3. Set `NEXT_PUBLIC_API_URL` on the frontend to the production API origin.
4. Set `ALLOW_DEMO_AUTH=false` in production.
5. Create the founding admin from `/login` if the tenant has no credentials yet.
6. Create staff and learner accounts from `/admin`.
7. Enable Zoom webhook endpoint validation.
8. Enable Razorpay webhook reconciliation.
9. Configure transactional email sender identity.
10. Configure WhatsApp approved templates.

## Tomorrow Credential Drop-In

- Frontend:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- Backend:
  - `DATABASE_URL`
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET`
  - `RESEND_API_KEY`
  - `WHATSAPP_API_TOKEN`
  - `WHATSAPP_PHONE_ID`
  - `ZOOM_ACCOUNT_ID`
  - `ZOOM_CLIENT_ID`
  - `ZOOM_CLIENT_SECRET`
  - `ZOOM_WEBHOOK_SECRET_TOKEN`
