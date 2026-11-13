# BAREVIA – Moje malé nožky

Webová aplikace (lze ji nainstalovat na plochu telefonu) pro měření dětských chodidel,
růstové grafy, evidenci bot a sezónní upozornění. Next.js 16 + TypeScript + Tailwind CSS 4 + Supabase.

## Spuštění na počítači

Potřebujete Node.js 20 nebo novější.

```bash
npm install
npm run dev
```

Aplikace poběží na http://localhost:3000. Soubor `.env.local` už obsahuje adresu a veřejný
(publishable) klíč projektu Supabase „Barevia Moje nožky“.

## Nastavení v Supabase (Authentication)

1. **URL Configuration**
   - Site URL: `http://localhost:3000` (po spuštění `https://malenozky.barevia.cz`)
   - Redirect URLs: `http://localhost:3000/**` a `https://malenozky.barevia.cz/**`
2. **Email Templates** – v šablonách *Confirm signup*, *Magic Link* a *Reset Password*
   nahraďte odkaz `{{ .ConfirmationURL }}` tímto (aplikace umí obojí, tohle je spolehlivější):
   - Confirm signup: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`
   - Magic Link: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`
   - Reset Password: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery`

   Texty e-mailů přeložte do češtiny.
3. **SMTP (před spuštěním pro rodiče)** – vestavěné e-maily Supabase jsou jen na testování.
   Nastavte vlastního odesílatele `noreply@barevia.cz` přes službu typu Brevo nebo Resend
   a u Wedosu přidejte DNS záznamy, které služba ukáže (SPF, DKIM, případně DMARC).

## Struktura

```
app/
  page.tsx                 úvodní stránka
  (auth)/                  přihlášení, registrace, zapomenuté a nové heslo + server actions
  auth/confirm/route.ts    odkazy z e-mailů (potvrzení, magic link, nové heslo)
  (app)/                   jen pro přihlášené
    layout.tsx             spodní lišta (mobil) / boční menu (tablet, počítač)
    prehled/               upozornění na malé boty, sezóny, děti
    deti/, deti/nove/, deti/[id]/   seznam, přidání, detail s růstovým grafem
    mereni/nove/           nové měření (levá/pravá nožka, okamžitý výsledek)
    boty/, boty/nova/      evidence bot, stav rezervy, vyřazení
    profil/                jméno, odkazy, odhlášení
    actions.ts             ukládání do databáze (server actions)
components/                UI, navigace, graf, formuláře
lib/
  supabase/                klienti pro prohlížeč, server a proxy
  database.types.ts        typy databáze (obnovit: npm run types:db)
  fit.ts                   pravidla velikosti (8–12 mm nové, pod 4 mm „Brzy malé“)
  format.ts                české tvary věku a dat
  config.ts                odkaz na e-shop a zásady ochrany osobních údajů
proxy.ts                   obnova přihlášení + ochrana stránek
```

## Pravidla velikosti

- Nové boty: vnitřní délka o **8–12 mm** delší než chodidlo.
- Nošené boty: rezerva pod **4 mm** = „Brzy malé“ (upozornění + odkaz na větší na barevia.cz),
  0 mm a méně = „Malé“, nad 12 mm = „S rezervou“.
- Stejně počítá databáze (pohled `shoe_fit`), aplikace jen zobrazuje.
- Nákupní období a dobu upozornění předem upravíte v Supabase v tabulce `shoe_purchase_windows`,
  odkazy na kategorie e-shopu v tabulce `shoe_categories` (sloupec `eshop_url`).

## Zveřejnění (až bude čas)

1. Nahrát projekt na GitHub a připojit ho na Vercel (nebo jiný hosting pro Next.js).
2. Na Vercelu nastavit proměnné z `.env.local` a `NEXT_PUBLIC_SITE_URL=https://malenozky.barevia.cz`.
3. U Wedosu přidat pro `malenozky.barevia.cz` záznam CNAME s hodnotou, kterou ukáže Vercel.
4. V Supabase přepnout Site URL na `https://malenozky.barevia.cz`.

## Ochrana osobních údajů

Aplikace odkazuje na zásady z e-shopu (`lib/config.ts` → `PRIVACY_URL`). Ověřte přesnou adresu stránky
a doplňte do zásad údaje o dětech, které aplikace ukládá (jméno, datum narození, míry chodidel, boty).
