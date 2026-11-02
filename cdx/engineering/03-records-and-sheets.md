# Business files, worksheets and lifecycle policy

## Ownership and authority

The business owns Drive records and merchant accounts. The local database is the
durable origin of unuploaded work; the immutable uploaded journal is the shared
history. Sheets are readable views and supported input surfaces. Owner edits to
input tabs are proposals until validated, journalled and acknowledged. Directly
editing a report is not an accounting correction.

Read `../01-updated-approach-and-file-design.md` for file and data previews. This
policy adds accounting, both settlement workflows and Excel portability.
Every changed file/tab/column design needs a realistic preview and dictionary.

## File registry

| File | Created by / when | Purpose | Preview |
|---|---|---|---|
| business.json | Owner setup after Google connection | Stable business identity and file directory, no secrets | businessId: shop-demo-001; mode: live; myShopFileId: example-id |
| My Shop | Owner setup | Permanent master data and current summaries | Products: PR001, Bread loaf, loaf, USD 1.00 |
| 2026-11 November | Owner phone or hub before/at first use of November | Detailed monthly records and views | Sale P1-S000031, USD 2.00, Cash |
| P1-000001.json | Sync coordinator seals and uploads an event batch | Complete durable events | sale.completed; P1-S000031; two loaves; USD 2.00 |
| P1-2026-11-02.backup | Successful scheduled/on-demand checkpoint | Phone recovery excluding old fiscal device state | Device P1; completed 18:10; pending events included: 0 |
| Product/supplier attachments | User captures; uploader stores | Recognition/document evidence | PR001 bread thumbnail; purchase B007 invoice USD 20.00 |
| Export workbook / ZIP | Owner requests and previews | Offline use, accountant handoff or exit | October; provisional; missing P2 after 14:05 |

Ordinary cloud file count: 2 permanent files + monthly workbooks + journal batches
+ retained backups + attachments + retained exports. The optional hub is one
script project per business, not another workbook. Test/practice uploads use a
separate folder. No per-cashier or per-account workbook is required.

## My Shop worksheets

| Tab | Role | Key preview |
|---|---|---|
| Read Me | Generated guidance | Owner-editable tabs: green; generated records: grey |
| Products | Validated owner input | PR001; Bread loaf; loaf; price USD 1.00 |
| Contacts | Validated owner input | C001; Demo Bakery; Supplier |
| Settings | Validated owner input | Pricing currency: USD, chosen by example owner |
| Lists | Controlled dropdown sources | Expense category: Transport |
| Exchange Rates | Effective-dated input | USD 1 = ZWG 30; fictional rate; from 08:00 |
| Locations | Administrative input | MAIN; Main shop |
| Phones | Controlled administration | P1; Front counter; last seen 16:30 |
| Staff | Controlled administration | ST01; Rudo; Cashier; active; no PIN data |
| Accounts | Controlled accounting definitions | 1100; Till cash; Asset; USD |
| Stock | Derived current position | PR001; MAIN; 18 loaves; records through 16:30 |
| Balances | Derived receivables/payables/credit | C003; customer owes; USD 5.00 |
| Months | Derived period totals | 2026-10; net sales USD 100.00; provisional |
| Reports | Derived owner summaries | Sales, gross margin where costs known, cash, outstanding amounts |
| Files and Status | Generated links and completeness | October file ID; layout v1; missing P2 |

Role and account edits need domain-level authorisation even if the user can edit
the underlying sheet. The ability to edit an arbitrary cell is not proof of an
approved administrative command.

## Monthly worksheets

| Tab | Contents / example |
|---|---|
| Read Me | Period, currency policy, signs, editing restrictions, completeness |
| Sales | P1-S000031; net charge USD 2.00; completed |
| Items Sold | Sale reference; 2 × Bread loaf at USD 1.00 |
| Payments | Received USD 5.00; change USD 3.00; applied USD 2.00 |
| Stock Movements | PR001; MAIN; Sold; -2 loaves; sale reference |
| Money Movements | Transport; paid from Till cash; USD 3.00 |
| Purchases | B007; Demo Bakery; USD 20.00; document link |
| Shifts | SH014; Rudo; P1; opened 08:03; cash-up submitted |
| Cash-up Counts | SH014; USD; expected 85.00; counted 84.00; difference -1.00 |
| Cash Handovers | SH014; USD 74.00 received by Chipo; USD 10.00 float retained |
| Provider Settlements | SET001; gross USD 100.00; fee 3.00; expected bank 97.00 |
| Settlement Matches | SET001 linked to payment IDs, fees and actual bank evidence |
| Accounting Entries | J001; Provider clearing; debit USD 10.00; sale reference |
| Trial Balance | Account balances including the period's opening position |
| Fiscal Days | Device/day references and external status; blank if not applicable |
| Activity | Requested by, approved by, reason and affected record |
| Summary | Human-readable period totals, charts, outstanding work and differences |

These are illustrative independent rows, not a claim that every value above is
one reconciled sample business. The generator must create a fully coherent
business fixture and prove all cross-table totals before these become templates.
Unused feature tabs may be hidden but remain documented in the schema.

Accounting entry rows may cover all accounts in one table. Separate ledgers are
filtered views, not separate independent copies. Posting IDs and event IDs must
prevent duplicate counting. Never treat provider payout or shift handover as a
second sale. A counted shortfall is reviewable evidence, not automatic staff debt.

## Human-facing workbook design

- Read Me first, Summary next; consistently order related detail tabs.
- Green tab/header treatment means supported owner input; grey means generated
  record; blue means report. Add text labels so colour is not the only cue.
- Freeze headings, use filterable contiguous tables, sensible widths, wrapped
  descriptions, number/date formats and explicit currency/unit columns.
- Protect generated ranges against accidental edits; this is usability, not
  protection against an account owner or a malicious editor.
- Use dropdown validation from Lists, date/number validation, explanations of
  rejected inputs, red negative values plus explicit warning/status text.
- Include complete IDs, historical values and links without burying readable
  names. Show blanks as unknown/not applicable according to the dictionary.
- Summary has a few useful charts: daily net sales, payment mix separated by
  currency, stock alerts, and expected-versus-counted cash. No decorative chart
  should obscure incomplete data or unknown cost.
- Pivots can support exploration by product, cashier or day; keep a standard
  formula/value summary available if pivot refresh does not work after export.
- No required formula crosses workbook files. Cross-month values are generated
  from accepted journal facts, with a last-updated marker.

## Formula portability

Prefer Excel-compatible SUM, SUMIFS, COUNTIFS, IF, IFERROR and INDEX/MATCH. Use
bounded ranges and helper columns where they improve clarity and speed. Example
for a fixed documented layout: `=SUMIFS(Payments!$G$2:$G$5000,Payments!$D$2:$D$5000,"USD")`
where G is Net applied and D is Currency. The schema generator resolves actual
columns; this preview is not permission to hardcode positions throughout the app.

Never total cash received as revenue without subtracting change. Never add
currencies into one nominal total. Specify functional-currency conversion and
rounding before consolidating accounting reports. Costs missing means margin
incomplete, not zero cost.

Do not make Google-only QUERY, GOOGLEFINANCE, IMPORTRANGE, custom Apps Script
functions or live URLs essential to exported calculations. Modern dynamic
arrays can be optional enhancements only with documented older-Excel behaviour.
Locale-dependent display is separate from invariant exported numeric values.

Export includes raw tables, standard formulas where supported, precomputed
readable summaries, dictionary and completeness manifest. A cached result alone
is not proof that formulas recalculate correctly. Workbook validation must cover
Google Sheets, an agreed desktop Excel version, and optionally LibreOffice.
State which application/version was actually checked; never claim all Excel
versions work from an openpyxl structural check.

## Creation, late events and archiving

1. Create the business identity and local database during setup. Connect Google
   and create the directory, My Shop and current month without blocking a local
   practice workflow. Warn about records not yet uploaded.
2. One authorised writer creates each month. Use logical business/month identity,
   a registry and recovery checks; filenames alone are not uniqueness keys.
3. Prepare next month ahead of time. If unavailable, queue events and create the
   view later. The missing workbook does not erase a journal event.
4. Route records using business period rules and the recorded event facts, not
   upload time. Late events keep original dates and IDs. Clock anomalies need
   review, not invented timestamps.
5. Month closure records device sequence/checkpoint completeness and accounting
   reconciliation. A later event affecting a closed period creates an explicit
   revision/adjustment workflow; do not silently overwrite approved totals.
6. Year-end groups retained files by year and generates opening-position views.
   Those views must not create a second economic transaction or double-count
   balances when replaying the journal.
7. Retain original journals. No destructive annual clearing in the first release.
   Snapshots accelerate replay; they do not justify deleting original evidence.
8. Backup pruning only removes eligible redundant backup snapshots under a stated
   policy. Legal business-record retention must be confirmed separately; do not
   reuse cache cleanup settings as a legal retention rule.

Renames use stable IDs. Missing files trigger diagnosis/rebuild. Schema changes
need versioned, resumable migrations tested with owner-added columns, moved tabs,
old layouts, late uploads and a failed intermediate step. Preview recovery and
preserve user-created sheets; do not overwrite an unknown workbook blindly.
