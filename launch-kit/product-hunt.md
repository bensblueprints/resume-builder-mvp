# Product Hunt Launch — Resumecraft

## Name
Resumecraft

## Tagline (60 chars)
Fill the form, print the PDF. Once. Not $24 every month.

## Description (260 chars)
Resumecraft is a local-first desktop resume builder: 7 templates, structured sections with live preview, one-toggle ATS-safe mode, plain-text export for job portals, and real PDF export. $19 once instead of Zety's $23.70/month. No cloud, no account, no upsells.

## Full description

Resumecraft is a desktop resume builder for people who are tired of paying a monthly fee to download the PDF of their own resume.

**Why another resume tool?** Because Zety, Novoresume and their peers let you fill everything out for "free" — then paywall the download behind $20+/month, and keep billing long after you've landed the job. Resumecraft is $19 once, MIT-licensed, and runs entirely on your machine.

**What it actually does:**
- 7 templates — Classic, Modern, Minimal, Executive, Compact, Tech, Elegant — swap any time without losing data
- Structured sections: contact, summary, experience with bullet points and reorder controls, education, skills, projects, unlimited custom sections
- Live preview pane synced as you type, with a one-page overflow warning before you export
- ATS-safe mode: one toggle strips columns and colors into a plain single-column layout that applicant tracking systems parse cleanly
- Plain-text export (or copy to clipboard) for pasting into Workday/Greenhouse-style portal forms
- Real PDF export via headless Chromium print — the PDF is pixel-identical to the preview
- Versions: duplicate a resume per job application and tailor it

No account. No telemetry. No network calls. No "your download is ready, enter your card." Pay once. Own it forever.

## Maker first comment

Hey PH 👋

I got tired of watching friends fill out a resume on a "free" builder, hit Download, and get a $23.70/month paywall — then forget to cancel and pay for months after they'd already been hired. The dark pattern is the business model. So I built Resumecraft: a local desktop app, one-time $19, that does exactly what those sites do — a structured form, 7 decent templates, and a real PDF — plus the two things they skimp on: a genuine ATS-safe mode (strips columns/colors to a parseable single column) and a plain-text export for the job portals that make you paste your resume into a form anyway.

The whole render engine (all 7 templates + ATS stripping + plain-text) is one dependency-free module that runs identically under Node for tests and in Electron for export, so the PDF you get is pixel-identical to the live preview. The smoke suite even boots headless Electron and validates a real `printToPDF` export by magic bytes.

Source is MIT on GitHub; the $19 is for the packaged 1-click installer. Would love feedback — especially from anyone who's fought an ATS parser recently.

## Gallery shots (5)

1. **Hero — editor + live preview**: dark UI, form sections on the left, filled resume live-previewing on the right in the Modern two-column template. Caption: "Fill the form. Watch the resume."
2. **Template swap**: the same resume shown in 3 templates side by side (Classic / Tech / Elegant). Caption: "7 templates. Your data never moves."
3. **ATS-safe toggle**: before/after — Modern two-column with color sidebar vs. the same resume flattened to a plain single column. Caption: "One toggle. ATS parsers eat it up."
4. **Export options**: the toolbar with Export PDF / Export .txt / Copy plain text highlighted, plus the one-page overflow warning banner visible. Caption: "Real PDF. Portal-ready plain text."
5. **Price comparison card**: "Zety: $284/year vs Resumecraft: $19 once" side by side. Caption: "Your job hunt is not a subscription."
