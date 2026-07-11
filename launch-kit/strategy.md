# Launch Strategy — Resumecraft

## Positioning
"Pay once. Own it forever. No subscription." Target active job seekers, career changers, and students who resent the resume-builder dark pattern: fill out the whole form "free", hit Download, get a paywall — then keep getting billed after they're hired. Named competitor: **Zety ($23.70/mo)**; secondary: Novoresume, Resume.io, LiveCareer (same subscription + download-paywall model). The plan-file angle in one line: *"Résumé builders are $24/mo to fill out a form and print a PDF — here's the form and the PDF, once."*

## Target communities

| Community | Angle (rules-aware) |
|---|---|
| r/jobs / r/jobsearchhacks | Strict no-self-promo — participate genuinely; only mention the tool in threads explicitly asking "resume builder that doesn't charge monthly?" and lead with the free MIT repo. |
| r/resumes | Tool posts are usually removed — contribute ATS formatting advice (single column, no tables/graphics) as comments; the advice itself demonstrates the ATS-safe mode philosophy. Link only if a mod-approved tools thread exists. |
| r/SideProject / r/indiehackers | Straight "I built this" post is welcome — lead with the subscription-paywall dark pattern story and the MIT source, mention the paid installer as the convenience option. |
| r/opensource | Emphasize the dependency-free render engine (7 templates + ATS stripping + plain-text in one Node-testable module) and the headless-Electron PDF smoke test. |
| r/GetEmployed / r/careerguidance | Comment helpfully on "Zety charged me again" threads (they're constant); recommend cancel steps first, then the one-time alternative when asked. |
| Hacker News | Show HN (draft below) — HN loves the anti-dark-pattern angle and the "renders identically under Node and Electron" testability detail. |

## Show HN draft

**Title:** Show HN: Resumecraft – a local resume builder you buy once, not $24/month

**Body:**
Resume builders like Zety let you fill out the entire form for free, then paywall the PDF download behind a $23.70/month subscription — which keeps billing long after you've found a job. The cancellation-forgetting is the business model.

Resumecraft is an Electron desktop app that does the same job locally: structured sections (experience/education/skills/projects/custom) with a live preview, 7 templates you can swap without losing data, and PDF export via headless Chromium print so the output is pixel-identical to the preview.

The two features I actually cared about: an ATS-safe mode that flattens any template to a plain single-column, color-free layout that applicant tracking systems parse reliably, and a plain-text export for the portals that make you paste your resume into form fields anyway.

Technically it's small on purpose: the whole render engine (all templates + ATS stripping + plain-text) is one dependency-free module that runs identically under Node for tests and in Electron for export. The smoke suite boots headless Electron and validates a real printToPDF export by magic bytes.

Source is MIT on GitHub. $19 packaged installer for people who don't want to `npm i` — pay once, own it forever.

## SEO keywords (10)
1. zety alternative
2. free resume builder no subscription
3. ats resume builder offline
4. resume maker desktop app
5. resume builder one time payment
6. resume builder no credit card
7. offline resume builder windows
8. ats friendly resume template app
9. resume builder without paywall
10. novoresume alternative one time

## AppSumo / PitchGround pitch

Resumecraft is the anti-subscription resume builder: a polished dark-mode desktop app with 7 swap-anytime templates, structured sections with live preview and a one-page overflow warning, a one-toggle ATS-safe mode that flattens any layout into a parser-friendly single column, plain-text export for job-portal paste boxes, real Chromium-print PDF export, and unlimited locally-stored versions for tailoring per application — with zero bytes ever leaving the user's machine. The resume-builder category is built on a notorious dark pattern (free form, paywalled download, forgotten recurring billing at $20–24/mo), which makes a lifetime deal an unusually easy sell: "Zety costs $284/year; this is $19 once." MIT-licensed source doubles as trust and a technical differentiator (dependency-free render engine, Electron-verified PDF test suite). Zero infrastructure cost per user means deep discount headroom for a launch campaign.

## Pricing math

- **Price: $19 one-time** (launch: $12)
- Zety: $23.70/mo → Resumecraft **pays for itself in under 1 month**
- 1-year Zety: $284.40 (15x Resumecraft) · 3-year: $853.20 (44.9x Resumecraft)
- Anchor line for all copy: "Cheaper than 1 month of Zety. Yours for life."
