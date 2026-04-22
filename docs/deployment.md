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
3. Enable Zoom webhook endpoint validation.
4. Enable Razorpay webhook reconciliation.
5. Configure transactional email sender identity.
6. Configure WhatsApp approved templates.
