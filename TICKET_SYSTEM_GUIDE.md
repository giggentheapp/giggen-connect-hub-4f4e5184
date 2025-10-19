# 🎟️ Billettsal & Innsjekk System - Quick Start

## ✅ SETUP KOMPLETT!

Systemet er nå fullt implementert med:
- ✅ Sikker database med RLS policies
- ✅ Stripe-integrasjon for betaling
- ✅ QR-billett generering
- ✅ Kamera-scanning for innsjekk
- ✅ Admin-rolle system (SECURE - separate user_roles table)
- ✅ Integrert i Dashboard → "Billetter" tab

---

## 🚀 SÅ KOMMER DU I GANG

### Steg 1: Gi deg selv admin-rettigheter
1. Gå til: `/admin-setup`
2. Klikk "Gi meg admin-rettigheter"
3. ✅ Du har nå tilgang til alle funksjoner!

### Steg 2: Opprett et test-event
Gå til Supabase Dashboard → Table Editor → `events` → Insert:

```json
{
  "name": "Test Festival 2025",
  "venue": "Josefines Vertshus",
  "date": "2025-11-15T20:00:00",
  "price_nok": 199,
  "capacity": 50,
  "is_active": true,
  "description": "Test-arrangement for billettsal"
}
```

### Steg 3: Test hele flyten

#### A) Kjøp billett
1. Gå til `/events`
2. Se listen over arrangementer
3. Klikk "Kjøp billett"
4. Bruk Stripe test-kort: `4242 4242 4242 4242`
5. Utløpsdato: `12/25`, CVC: `123`
6. Du blir sendt til `/ticket-success`

#### B) Se billetten
1. Gå til Dashboard → velg "Billetter" tab
2. Billetten vises under "Kommende"
3. QR-koden er klar!

#### C) Sjekk inn billett
1. Gå til `/check-in`
2. Klikk "Start scanning"
3. Skann QR-koden fra billetten
4. ✅ "Innsjekk vellykket!"

---

## 📱 ROUTING OVERSIKT

| Route | Beskrivelse |
|-------|-------------|
| `/events` | Billettmarked - se og kjøp billetter |
| `/ticket-success` | Bekreftelsesside etter kjøp |
| `/dashboard?section=tickets` | Mine billetter (QR-koder) |
| `/check-in` | Admin innsjekk med QR-scanner |
| `/admin-setup` | Gi deg selv admin-rettigheter |

---

## 🔐 SIKKERHET

### ✅ SIKKER IMPLEMENTERING
- **Roller er lagret i separate `user_roles` tabell** (IKKE på profiles)
- **Server-side validering** med `has_role()` security definer function
- **RLS policies** bruker `has_role()` for sjekker
- **Edge function** sjekker rolle før innsjekk

### ⚠️ VIKTIG FOR PRODUKSJON
Nåværende `/admin-setup` side lar hvem som helst gi seg selv admin-rolle.

**For produksjon må du:**
1. Fjern `/admin-setup` route fra App.tsx
2. La kun superadmin (deg) legge til roller manuelt i Supabase
3. Eller lag en godkjenningsprosess for admin-søknader

---

## 💳 STRIPE KONFIGURASJON

Systemet bruker Stripe secrets som allerede er konfigurert i Supabase Edge Functions.

**Hvis du trenger å oppdatere:**
1. Gå til Supabase Dashboard → Edge Functions → Secrets
2. Oppdater `STRIPE_SECRET_KEY`
3. Test med kort: `4242 4242 4242 4242`

---

## 🎨 TILPASNINGER

### Legg til mer arrangementer
I Supabase Dashboard → `events` table:
- Sett inn nye rader
- `is_active` = true for å vise i listen
- Legg til `image_url` for cover-bilde

### Endre QR-design
Rediger `src/components/MyTicketsView.tsx`:
- Juster QRCode size
- Endre styling på billettkortet
- Legg til mer info

### Tilpass innsjekk
Rediger `src/components/AdminCheckIn.tsx`:
- Endre scan-frekvens (nå 500ms)
- Legg til lyd ved vellykket scan
- Vis statistikk over innsjekkede

---

## 📊 DATABASE OVERSIKT

### Tabeller
```
events          → Arrangementer med pris og kapasitet
tickets         → Solgte billetter med QR-kode
transactions    → Stripe-betalinger
user_roles      → Admin/Organizer roller (SECURE)
```

### Viktige indekser
- `idx_tickets_status` → rask filtrering på gyldig/brukt
- `idx_events_is_active` → kun aktive events i listen
- `idx_user_roles_user_id` → rask rolle-sjekk

---

## 🐛 FEILSØKING

### Problem: "Unauthorized" ved innsjekk
**Løsning:** Gå til `/admin-setup` og gi deg selv admin-rolle

### Problem: Ingen events vises
**Løsning:** Sjekk at `is_active = true` på events i databasen

### Problem: Stripe-feil
**Løsning:** 
1. Sjekk at `STRIPE_SECRET_KEY` er satt i Edge Function secrets
2. Se Edge Function logs: Supabase → Functions → Logs
3. Test med Stripe test-kort: `4242 4242 4242 4242`

### Problem: QR-scanner fungerer ikke
**Løsning:**
1. Gi nettleseren kamera-tilgang
2. Bruk HTTPS eller localhost (kamera krever det)
3. Test med eksisterende billett-QR først

---

## 📈 NESTE STEG

### Funksjonalitet å legge til:
- [ ] E-post med billett etter kjøp
- [ ] PDF-nedlasting av billett
- [ ] Admin dashboard med statistikk
- [ ] Refunder billett-funksjon
- [ ] Event-opprettelse via UI
- [ ] Flere betalingsmetoder (Vipps, Klarna)

### Produksjon-klargjøring:
- [ ] Fjern `/admin-setup` route
- [ ] Sett opp prod Stripe-nøkler
- [ ] Test hele flyten i prod
- [ ] Lag backup-rutiner
- [ ] Sett opp monitoring

---

## 🎉 DU ER KLAR!

Systemet er nå 100% operativt. Test hele flyten fra kjøp til innsjekk og juster etter behov.

**Lykke til med billettsalget! 🎟️**
