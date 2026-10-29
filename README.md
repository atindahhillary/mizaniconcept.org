# mizaniconcept.org

Website for **Mizani Concept**, a Kenyan organisation (est. 2017) developing whole young people through mentorship camps, holistic wellness sessions and educator capacity building, guided by the 4Cs: Culture, Community, Commerce and Conservation.

This is a rebuild of the original Lovable single-page app. It is a fully pre-rendered static site with no framework and no npm dependencies.

## Pages

| Path | Purpose |
|---|---|
| `/` | Home: audience paths, programs, $10 ask, store teaser |
| `/about` | Who we are, whole person model, 4Cs, SDGs |
| `/programs` | Camps, wellness sessions, educator training, Period Party, Thrive Scale |
| `/give` | Donation tiers, M-Pesa dialog, diaspora giving, partnerships |
| `/store` | 9 products, filter, quick add to cart |
| `/store/<slug>` | Product story pages generated from `src/data/products.json` |
| `/checkout` | Cart checkout: sends the order to info@ and shows Paybill and bank details |
| `/contact` | Working enquiry form (`?as=youth`, `school`, `educator`, `donor`, `visit`, `partner` preselects the audience) |
| `/privacy` | Privacy notice (Kenya Data Protection Act, 2019) |

## Develop

```bash
node build.mjs     # writes dist/
node serve.mjs     # preview at http://localhost:4321
```

- Page content: `src/pages/*.html`. Each file starts with a `<!--meta {...} -->` JSON header (title, description, optional jsonld/preload/noindex).
- Shared header, footer, head tags and Organization JSON-LD: `build.mjs`.
- Styles: `src/assets/site.css`. Behaviour: `src/assets/site.js`.
- Vercel runs `node build.mjs` and serves `dist/` (see `vercel.json` for clean URLs, redirects and security headers).

## Contact form

The form posts to [FormSubmit](https://formsubmit.co) and delivers to `info@mizaniconcept.org`.
**The first real submission triggers a one-time activation email to that inbox. Someone must click the link in it**, otherwise messages are not delivered. If sending fails, the form falls back to a pre-filled email.

## Open items for the Mizani team

1. Store checkout and donations use the NCBA M-Pesa Paybill 880100 (account 1011645723, PEMS MIZANI LIMITED) and the NCBA bank/SWIFT details. Store orders arrive at info@ with an `MZ-` order reference; payments must be matched by hand.
2. **Online card payments** (Paystack, Pesapal or PayPal) would let buyers pay instantly instead of by transfer.
3. **Confirm +254 724 116694 is on WhatsApp**, since store orders and confirmations use `wa.me` links.
4. **Impact evidence**: real numbers served since 2017, Thrive Scale results, 2 to 3 consented stories, team/board, registration number. None were invented for this site.
5. **Safeguarding / child protection policy** to publish alongside the privacy notice.
6. **Point the domain**: move `mizaniconcept.org` DNS from Lovable to this Vercel project, and add a `www` record that redirects to the apex. Canonical URLs already use `https://mizaniconcept.org`.
7. Confirm permissions for the Thrive Scale (Miracle Foundation) and the 4Cs framework credit (Barbara Joubert).
8. The teacher classroom photo (`educators.webp`) looks AI-generated. Replace it with a real training photo when available.
9. Add analytics (Vercel Web Analytics or Plausible) once the domain is live.
10. Newsletter signups from the footer arrive at info@ as emails titled "Newsletter signup". Move them into a mailing tool (Mailchimp, Brevo) when the list grows.
11. The Period Party talk video has no captions. Add a caption file (WebVTT) or a short transcript for deaf and hard-of-hearing visitors, and send the facilitator name for the caption.
12. The impact calculator uses $10 per student per term and $15 per box of sanitary pads, at about KES 130 to the dollar. Update `src/assets/site.js` if these change.
