# Deployment Guide - Giggen

Dette dokumentet beskriver hvordan man deployer Giggen til produksjon.

---

## 📋 Pre-Deployment Checklist

### 1. Miljøvariabler

Sørg for at følgende miljøvariabler er satt opp i produksjonsmiljøet:

#### Frontend (Vite)
```bash
VITE_SUPABASE_PROJECT_ID=your-production-project-id
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-production-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-live-key
VITE_ALLOW_ADMIN_SETUP=false  # VIKTIG: Må være false i produksjon
```

#### Supabase Edge Functions (Secrets)
Sett følgende secrets i Supabase Dashboard under Settings > Edge Functions:

```bash
SUPABASE_URL=https://your-production-project.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
RESEND_API_KEY=re_your-resend-api-key
MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token
```

---

## 🔒 Sikkerhet

### CORS-konfigurasjonen

Edge functions er konfigurert til å kun tillate følgende origins i produksjon:
- `https://giggen.no`
- `https://www.giggen.no`
- Lovable preview domains (for testing)

**Viktig:** Hvis du bytter domene, må du oppdatere `supabase/functions/_shared/securityHeaders.ts`:

```typescript
const allowedOrigins = [
  'https://your-new-domain.com',
  'https://www.your-new-domain.com',
  'http://localhost:5173',  // Development only
  'http://localhost:3000'   // Development only
];
```

### Admin Routes

Admin-routes er automatisk skjult i produksjon:
- `/admin/security` - kun tilgjengelig i development mode
- Admin-initialisering kjører kun i development mode

---

## 🚀 Deployment til Vercel

### 1. Installer Vercel CLI (hvis ikke allerede installert)

```bash
npm install -g vercel
```

### 2. Logg inn på Vercel

```bash
vercel login
```

### 3. Sett opp miljøvariabler i Vercel

```bash
vercel env add VITE_SUPABASE_PROJECT_ID
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
vercel env add VITE_STRIPE_PUBLISHABLE_KEY
vercel env add VITE_ALLOW_ADMIN_SETUP
```

Eller sett dem manuelt i Vercel Dashboard under Project Settings > Environment Variables.

### 4. Deploy

```bash
vercel --prod
```

---

## 🗄️ Supabase Setup

### 1. Database Migrations

Alle database migrations ligger i `supabase/migrations/`. Disse kjøres automatisk av Supabase.

For å kjøre migrations manuelt:

```bash
supabase db push
```

### 2. Edge Functions

Edge functions deployes automatisk av Lovable når koden oppdateres.

For å deploye manuelt:

```bash
supabase functions deploy
```

### 3. Storage Buckets

Sørg for at følgende storage buckets er opprettet i Supabase:
- `avatars` (public)
- `filbank` (private, krever autentisering)

### 4. RLS Policies

Sørg for at Row Level Security (RLS) er aktivert på alle tabeller. Se `supabase/migrations/` for policies.

---

## 💳 Stripe Setup

### 1. Aktiver Live Mode

I Stripe Dashboard:
1. Bytt fra Test Mode til Live Mode
2. Kopier Live API keys
3. Oppdater `VITE_STRIPE_PUBLISHABLE_KEY` i frontend
4. Oppdater `STRIPE_SECRET_KEY` i Supabase Edge Function secrets

### 2. Webhooks

Sett opp webhooks i Stripe Dashboard:
- Endpoint URL: `https://your-project.supabase.co/functions/v1/complete-ticket-purchase`
- Events: `checkout.session.completed`

---

## 📧 Email Setup (Resend)

### 1. Verifiser domene

I Resend Dashboard:
1. Legg til ditt domene (f.eks. `giggen.no`)
2. Sett opp DNS records (SPF, DKIM, DMARC)
3. Verifiser domenet

### 2. Oppdater Edge Function

Oppdater `from`-addressen i `supabase/functions/send-onboarding-email/index.ts`:

```typescript
from: "GIGGEN <noreply@giggen.no>",
```

---

## 🗺️ Mapbox Setup

### 1. Produksjons-token

I Mapbox Dashboard:
1. Opprett en ny Access Token med begrensede permissions
2. Begrens til ditt domene (`https://giggen.no`)
3. Oppdater `MAPBOX_ACCESS_TOKEN` i Supabase Edge Function secrets

---

## 📊 Monitoring

### Error Tracking

Legg til error tracking service (anbefalt):
- Sentry
- LogRocket
- Rollbar

Oppdater `src/utils/logger.ts`:

```typescript
error: (message: string, error?: unknown) => {
  if (import.meta.env.DEV) {
    console.error(`❌ ${message}`, error ? error : '');
  } else {
    // Send to error tracking service
    Sentry.captureException(error, { extra: { message } });
  }
},
```

### Analytics

Legg til analytics (anbefalt):
- Google Analytics
- Plausible
- PostHog

---

## 🔄 Backup Rutiner

### Database Backup

Supabase tar automatisk daglige backups. For ekstra sikkerhet:

```bash
# Manual backup
supabase db dump -f backup.sql

# Restore from backup
supabase db reset --db-url postgresql://connection-string
```

### Storage Backup

Sett opp periodiske backups av storage buckets:

```bash
# Backup avatars bucket
supabase storage download --bucket avatars --destination ./backups/avatars

# Backup filbank bucket
supabase storage download --bucket filbank --destination ./backups/filbank
```

---

## 🧪 Testing i Produksjon

### Pre-Production Testing

Før full lansering:

1. Test alle kritiske flows:
   - Registrering og innlogging
   - Opprett booking
   - Kjøp billett
   - Opplast filer
   - Admin-funksjoner (i staging)

2. Test betalinger med Stripe test cards
3. Test email-leveranse
4. Test file upload/download
5. Test på mobile devices

### Production Smoke Tests

Etter deployment:

1. Verifiser at siden lastes uten feil
2. Test innlogging
3. Test at booking-flows fungerer
4. Test at billettkjøp fungerer
5. Sjekk Supabase logs for errors
6. Sjekk Edge Function logs

---

## 🚨 Troubleshooting

### "Access denied" feil i file-serving

**Problem:** Brukere får 403 Forbidden når de prøver å laste ned filer.

**Løsning:** 
1. Sjekk at `serve-file` Edge Function har riktig autentisering
2. Verifiser at RLS policies er korrekt konfigurert
3. Sjekk Edge Function logs: `supabase functions logs serve-file`

### CORS-feil

**Problem:** `Access-Control-Allow-Origin` feil i browser console.

**Løsning:**
1. Sjekk at ditt domene er i `allowedOrigins` array i `securityHeaders.ts`
2. Redeploy Edge Functions: `supabase functions deploy`
3. Hard refresh browser cache

### Stripe betalinger feiler

**Problem:** Betalinger går ikke gjennom.

**Løsning:**
1. Sjekk at du bruker Live Mode keys i produksjon
2. Verifiser at webhooks er konfigurert
3. Sjekk Stripe Dashboard for error logs

### Email sendes ikke

**Problem:** Onboarding/password reset emails sendes ikke.

**Løsning:**
1. Verifiser at Resend domene er verifisert
2. Sjekk Resend logs
3. Test med en test-email først

---

## 📞 Support

For produksjonsproblemer:

1. Sjekk Supabase logs først
2. Sjekk Edge Function logs
3. Sjekk browser console for frontend errors
4. Sjekk Sentry/error tracking service

---

## 🔐 Security Checklist

- [ ] Alle miljøvariabler er satt i produksjon
- [ ] `VITE_ALLOW_ADMIN_SETUP=false` i produksjon
- [ ] Admin routes er skjult i produksjon
- [ ] CORS er begrenset til spesifikke domener
- [ ] RLS policies er aktivert på alle tabeller
- [ ] File serving krever autentisering for private buckets
- [ ] Stripe bruker Live Mode keys
- [ ] Error messages eksponerer ikke sensitiv data
- [ ] Rate limiting er aktivert på alle Edge Functions
- [ ] Input sanitization er implementert

---

**Sist oppdatert:** 2024-11-29
