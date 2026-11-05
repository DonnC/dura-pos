# Dura POS

A free, open-source POS for Zimbabwean street vendors and small shops,
Android first, in Flutter. It sells offline in USD, ZWG and ZAR, fiscalises
with ZIMRA on the phone (via fzimra), and keeps every record in the owner's
own Google Drive, with Google Sheets as the face of the records.

**Start with `handbook/README.md`.** It maps every document, lists what
changed since the notes, and says which document wins when they disagree:
code, then decisions, then the handbook, then notes (`12`, then `10`), then
research. Also follow `AGENTS.md` and the skills in `.agents/skills/`.

## Standing rules

- **No AI attribution** (no Co-Authored-By or "generated with" lines) in
  commits, PRs or files.
- **Notes go in `notes/`, numbered** (`NN-topic.md`). Decisions that change
  earlier notes go in `handbook/decisions/`.
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
- **UI/UX is king:** follow `handbook/product/03-experience-principles.md`.
  - the five-second rule;
  - never block a sale;
  - amounts always show their currency;
  - plain shop words.
- **Sheets are for people:**
  - a Read Me in every file, and tabs colour-coded by who writes them;
  - dropdowns from the `Lists` tab instead of typing, and date validation;
  - red negatives, status dots and charts.
- **The pricing currency is chosen by the owner.** Never assume USD.
- **Records (decision 0003):**
  - a sale completes on the phone;
  - each phone uploads an append-only journal to the owner's Drive, through
    the Shop Hub; it's the shared history;
  - Sheets are views built from it, plus input tabs the owner edits, which
    are checked before they're accepted;
  - events are never rewritten, and a correction is a new linked event;
  - the Shop Hub is the only view writer;
  - workbooks are template-first: the hub creates them from the Python
    generator's templates;
  - there's no destructive year-end clearing in the first release.
- **The Shop Hub is the backend (decision 0005):**
  - a standalone Apps Script web app in the shop's own account, running as
    the owner;
  - every upload, file, Sheets view, photo, payment and scheduled job goes
    through it, so all usage counts against the shop's account;
  - Dura's Google Cloud project is used only to install and update it;
  - phones pair with it by QR code, sign every request, and never hold a
    Google token;
  - it's never needed to complete a sale, and never touches ZIMRA.
- **The Flutter app is server-agnostic.** It reaches any backend through one
  port in `dura_core`. The hub client is one adapter, in `dura_hub`, speaking
  the protocol in `backend/hub/PROTOCOL.md`. No Google type appears above that
  adapter.
- **Test mode never touches live data:** a separate folder and database,
  `T-` IDs, ZIMRA's test environment, and gateway sandboxes.
- **Formulas never cross files, and never name a year.**
- **Financial records and AI:**
  - `notes/13` covers which financial records Dura produces;
  - `notes/14` is the future paid "Ask Dura" assistant: the phone works out
    the numbers with tools; the model only explains.
- **Public posts:**
  - no code blocks;
  - don't claim ZIMRA certification;
  - credit Shaun Chivandire for the original TypeScript SDK.

## The executable spec

`backend/templates/dura_templates` (a package with a CLI) builds a complete
sample shop (`backend/templates/sample/Dura POS/`): every file, tab, column,
dropdown, colour rule, formula and chart the app must create. It still has note 12's layout until the records phase moves
it to the handbook's (decision 0003). When the sheet layout changes, change
the generator, regenerate, and run the checks. Templates must stay
Excel-compatible (decision 0006):

```
cd backend/templates
python -m pip install -r requirements.txt
python -m dura_templates fingerprint --write before.json   # before a change
python -m dura_templates sample
python -m dura_templates verify
python -m dura_templates fingerprint --compare before.json
python -m dura_templates templates                         # rebuild dist/ if the layout changed
```

The Flutter workspace is in `client/`. Run `dart run melos run verify` there
before committing.

Skills are written in `.agents/skills/`; `python .agents/sync_skills.py` keeps
the pointers in `.claude/skills/` in step. Start with `dura-project`.

`data/zimra_hs_codes.csv` is ZIMRA's HS code list. The Apps Script hub
lives in `backend/hub/`. Shared conventions: `handbook/engineering/09-conventions.md`.
