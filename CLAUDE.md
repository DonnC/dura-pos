# Dura POS

A free, open-source Android POS for Zimbabwean street vendors and small shops.
It sells offline in USD, ZWG and ZAR, fiscalises with ZIMRA on the phone (via
fzimra), and keeps every record in the owner's own Google Drive as Google
Sheets.

**Start with `notes/10-build-plan.md`.** It has the settled decisions, the
architecture, the build phases, and which note to read for what.

## Standing rules

- **No AI attribution** (no Co-Authored-By or "generated with" lines) in
  commits, PRs or files.
- **Notes go in `notes/`, numbered** (`NN-topic.md`).
- **Work in phases:** agree the scope, build it with tests, update the
  changelog, commit, then the next phase. Commit only when asked.
- **The business model is settled,** so don't relitigate it:
  - no vendor cloud;
  - bring your own keys;
  - consulting revenue;
  - small shops, at most about 10 phones.
- **Check what already exists before building anything for ZIMRA:**
  - fzimra (`DonnC/zimra-fdms-android`);
  - the TypeScript `zimra-fdms` SDK;
  - the `zw_compliance` ERPNext app.
- **Read ZIMRA's spec strictly.** Offer only what it allows, and never an
  option that can stop a shop from trading.
- **Sheets are for people:**
  - a Read Me in every file, and tabs colour-coded by who writes them;
  - dropdowns from the `Lists` tab instead of typing, and date validation;
  - red negatives, status dots and charts.
- **Formulas never cross files, and never name a year.** Live tabs in
  `My Shop` have stable names; the year is `Settings` → `Data year`.
- **Phones add rows; they don't rewrite them,** except status cells. Only the
  owner's phone creates files and runs the year-end archive.
- **Public posts:**
  - no code blocks;
  - don't claim ZIMRA certification;
  - credit Shaun Chivandire for the original TypeScript SDK.

## The executable spec

`samples/generate_samples.py` builds a complete sample shop (`samples/Dura
POS/`): every file, tab, column, dropdown, colour rule, formula and chart the
app must create. When the sheet layout changes, change the generator,
regenerate, and run both checks:

```
cd samples
python3 generate_samples.py          # needs openpyxl
python3 check_samples.py "Dura POS"
python3 check_formulas.py "Dura POS"
```

`reference/zimra_hs_codes.csv` is ZIMRA's HS code list.
