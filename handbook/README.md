# The Dura POS handbook

The current, authoritative description of what Dura is and how it's built. If
you're new, read the four product pages first (about 20 minutes). Then read
whichever engineering page matches your work.

## Start here

1. [Vision](product/01-vision.md): the goal, who it's for, the promise, and
   why it's built this way.
2. [Capability map](product/02-capabilities.md): every feature, its status and
   its roadmap phase.
3. [Experience principles](product/03-experience-principles.md): the
   five-second rule, and how screens and sheets must behave.
4. [Glossary](product/04-glossary.md): journal, view, Shop Hub, cash-up, kept
   change, and other terms.

## Engineering

| Page | Read it when you're |
|---|---|
| [00 Engineering contract](engineering/00-engineering-contract.md) | Starting any code change; it lists the settled technical decisions |
| [01 Architecture](engineering/01-architecture.md) | Adding a package, feature, adapter or provider |
| [02 Testing](engineering/02-testing.md) | Writing tests, changing goldens, or doing TDD |
| [03 Records and Sheets](engineering/03-records-and-sheets.md) | Touching the journal, workbooks, formulas, exports or year end |
| [04 Security and diagnostics](engineering/04-security-and-diagnostics.md) | Working on PINs, roles, devices, restore, networking or logs |
| [05 Delivery](engineering/05-delivery.md) | Changing CI, versions, the changelog or dependencies |
| [06 Roadmap](engineering/06-roadmap.md) | Choosing what to work on next |
| [07 Coding and diagnostics](engineering/07-coding-and-diagnostics.md) | Writing Dart: file size, headers, constants, disposal, logging |
| [08 Foundation validation](engineering/08-foundation-validation.md) | Checking what has actually been verified so far |
| [09 Conventions](engineering/09-conventions.md) | Naming, headers, tests and verify commands in every language |
| [10 Real-account test](engineering/10-real-account-test.md) | Trying the hub on a real Google account |
| [11 Payments](engineering/11-payments.md) | Working on how a payment moves through the hub |

## Decisions

Numbered, never rewritten: a later decision supersedes an earlier one.

| Decision | Summary |
|---|---|
| [0001](decisions/0001-foundation.md) | Local-first Flutter foundation: Pub workspace, Melos, Drift, Riverpod; fiscal deferred |
| [0002](decisions/0002-client-layout-and-licence.md) | All Flutter code under `client/`; MIT licence |
| [0003](decisions/0003-records-journal-and-views.md) | The journal is the history and Sheets are views; workbooks are template-first; no destructive year end |
| [0004](decisions/0004-repository-layout-and-pr-checks.md) | This map, the research archive, and CI on pull requests |
| [0005](decisions/0005-shop-hub-as-the-backend.md) | The shop's own Apps Script hub is the backend; phones pair by QR; the app reaches it through one server-agnostic port |
| [0006](decisions/0006-backend-folder-and-uniform-conventions.md) | `backend/` holds the hub and templates; the hub is JavaScript; templates must be Excel-compatible; uniform conventions |
| [0007](decisions/0007-generator-package-and-cli.md) | The workbook generator is the `dura_templates` package with a CLI; refactors proven by fingerprints |
| [0008](decisions/0008-clean-templates.md) | Clean templates, one set per pricing currency, byte-reproducible with a hash manifest; setup requires the pricing currency |

Use the [template](decisions/0000-template.md) for a new decision.

The owner-approved [Shop Sign identity](decisions/0011-shop-sign-identity.md)
supersedes foundation branding: custom wordmark and d, charcoal/chalk/sign red.

## Design references

- [Records file design](design/records-file-design.md): every file in the
  owner's Drive, with example rows.
- [Mobile concept](design/mobile-concept.md): the first screens, with an
  interactive [HTML prototype](design/prototype/).
- [Current mobile design](design/prototype/cdx/-cdx-preview.html): interactive
  daily journeys for the owner and seller.
- [Branding](design/branding/04-shop-sign.md): the Shop Sign wordmark and d.

## Outside the handbook

| Where | What |
|---|---|
| [`../notes/`](../notes/README.md) | The numbered design notes: detailed reasoning on files, ZIMRA, payments, staff, sync and finance |
| [`../research/`](../research/README.md) | The original AI research conversations; historical |
| [`../backend/templates/`](../backend/templates/README.md) | The executable spec: the `dura_templates` generator and CLI, the sample shop, and its checks |
| [`../backend/hub/`](../backend/hub/README.md) | The Shop Hub (Apps Script, JavaScript) |
| [`../data/`](../data/) | ZIMRA's HS code list |

## When documents disagree

Read them in this order ([decision 0004](decisions/0004-repository-layout-and-pr-checks.md)):

1. **The code and its tests,** for what exists. A document is a
   specification, not proof something is built.
2. **Decisions,** newest first.
3. **The rest of this handbook.**
4. **The notes:** `12`, then `10`, then the others.
5. **Research.**

### What changed since the notes

The notes were written when the plan was a Kotlin app writing straight into
Sheets. These points have since changed:

| The notes say | Now | Where |
|---|---|---|
| Kotlin, Jetpack Compose, Room, WorkManager | Flutter, Riverpod, Drift; fzimra through a typed Android bridge | [0001](decisions/0001-foundation.md), [architecture](engineering/01-architecture.md) |
| Phones append rows to Sheets; Sheets are the record | An uploaded journal is the history; Sheets are views and checked inputs | [0003](decisions/0003-records-journal-and-views.md) |
| Phones call the Sheets and Drive APIs; the hub is optional | Everything that reaches Google goes through the shop's own hub; phones pair by QR and hold no Google token | [0005](decisions/0005-shop-hub-as-the-backend.md), [note 15](../notes/15-apps-script-route.md) |
| Files built from code, from `schema/dura-sheets.json`; no template file | Template-first: Python generates templates, and the hub converts them into the shop's Drive | [0003](decisions/0003-records-journal-and-views.md), [`backend/templates/`](../backend/templates/README.md) |
| The year-end archive removes last year's rows | No destructive clearing in the first release; journals kept | [0003](decisions/0003-records-journal-and-views.md) |
| 7 days of sales kept on the phone | A retention policy based on real offline needs | [records design](design/records-file-design.md) §12 |
| Onboarding turns on USD and ZWG | No default: the owner picks the pricing currency | [note 12](../notes/12-hub-test-mode-files-migration.md) §7 |
| GPL-3.0 recommended | MIT | [0002](decisions/0002-client-layout-and-licence.md) |
| Phases 0 to 7 in note 10 | Phases 0 to 8 in the roadmap | [roadmap](engineering/06-roadmap.md) |

Everything else in the notes still holds, unless a decision says otherwise.
That includes no vendor cloud, own keys, ZIMRA strictness, test mode, the Shop
Hub's role, payments, rates, kept change, staff and locations.
