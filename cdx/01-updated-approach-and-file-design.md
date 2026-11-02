# Dura POS: business control, reliable records, and understandable files

29 October 2026.

> 2 November 2026: [the engineering contract](engineering/00-engineering-contract.md)
> adopts Flutter/Drift in place of the Room-specific app layer and extends the
> worksheet design with accounting, shift handover and provider settlement.
> Its records/lifecycle policy takes precedence where these notes differ.

This records the updated approach agreed in discussion after reviewing
`notes/10-build-plan.md` and its supporting notes. It is a design proposal and
implementation brief, not a claim that the application or recovery mechanisms
already exist. The existing generator and sample workbooks have not been
migrated to this design.

This document is in `cdx/` at the owner's request. Earlier notes describe the
previous design; differences are identified below rather than silently changing
those notes.

## 1. The product promise

Dura is a free, open-source Android POS for small Zimbabwean businesses. The
business controls its accounts, credentials, records, and ability to leave.
Paid consulting provides setup, training, migration, or custom work. Access to
records and core operations must not depend on a support subscription.

The practical promise is:

- Sell locally through the supported workflows when connectivity is unavailable.
- Keep a durable record before depending on a network request.
- Store uploaded business records in the business's own Google Drive.
- Let an owner or accountant understand the records without learning Dura's code.
- Export familiar Excel and CSV data, plus a complete documented archive.
- Recover or migrate with help from another competent person, without needing
  permission from Dura's developer.

External costs still exist: phones, printers, connectivity, merchant transaction
fees, and any applicable account or regulatory requirements. Free software does
not remove those costs. Fiscal operation remains subject to the applicable
ZIMRA requirements and approved device configuration.

Start by proving one owner-operated shop on one phone. Add a second phone,
staff operation, fiscalisation, and integrated payments through separately
verified steps. About ten phones remains an intended upper scope, not a tested
capacity guarantee.

## 2. Standing requirement: always show the data

**Every new or changed file design must include a preview of its contents.**
For tables, show headings and realistic example rows. For JSON, show a small
valid example. For a binary file, show a contents listing or the readable
information Dura presents beside it. For an image, describe what it shows and
how its associated record identifies it. Examples must use fictitious data and
must never contain real credentials or private customer information.

**Anything intended for the user must be clear enough to understand unaided.**

- Every workbook has a Read Me tab explaining its purpose and editing rules.
- Use headings such as `Sale ID`, `Amount received`, and `Last updated`, rather
  than unexplained abbreviations or implementation field names.
- Put currencies beside amounts. Put units beside quantities where needed.
- State the reporting period, location, time zone, and data completeness.
- Explain whether a number is recorded, calculated, estimated, or awaiting sync.
- Use words alongside colours: `Waiting to upload`, not just an orange dot.
- Explain corrections, reversals, and links to original transactions.
- Provide a data dictionary with exported tables, including signs and blanks.
- Distinguish blank/unknown from zero and not applicable.
- Preview imports, rebuilds, restores, and exports before the user applies them.
- Keep technical IDs available for reconciliation, alongside readable names.

An illustrative status panel:

| Information | Value |
|---|---|
| Business | Chipo's Shop — demonstration data |
| Period | October 2026 |
| Times | Africa/Harare; exported timestamps include the UTC offset |
| Pricing currency | USD — selected by this example owner |
| Records received through | 29 Oct 2026, 16:30 |
| P1: Front counter | Received through 16:30; no known pending records |
| P2: Second counter | Last seen 14:05; later activity is unknown |
| Completeness | May be incomplete: reconnect P2 before finalising October |

The system must not infer that an offline phone has no pending records merely
because it has not reported any.

## 3. Three layers, with clear authority

| Layer | Responsibility | Authority |
|---|---|---|
| Local Room database | Fast selling, durable checkout progress, pending events, and cached shared records | Durable origin for work on that phone until uploaded; shared data can be stale |
| Journal in the owner's Drive | Complete accepted business events, including master-data changes | Durable uploaded history for reconstruction and reconciliation |
| Sheets and exports | Readable inputs, detailed records, summaries, and migration tables | Accepted inputs plus derived views; a damaged report does not erase journal history |

Save events and their outbox entries together locally. Treat a Google Sheet
edit as a proposed input: validate it, display errors, record the accepted
change, and then propagate it. A bootstrap/import must record the starting
catalogue, settings, stock, and balances so recovery does not depend on an
unrecorded spreadsheet edit.

Preserve historical names, prices, rates, taxes, and other necessary transaction
facts. Changing today's product must not change yesterday's receipt.

Completed journal batches are immutable. Corrections and later outcomes are new
events linked to their originals. Reports must process each event ID once and
recognise the completeness of the transaction, rather than sum whatever rows
happened to arrive.

Sheets append does not enforce unique business IDs. The upload, acknowledgement,
deduplication, and report-rebuild protocol must be prototyped under lost
responses and concurrent uploads before it is considered settled.

## 4. Folder layout

```text
Dura POS/
└── Chipo's Shop/
    ├── business.json
    ├── My Shop                         Google spreadsheet
    ├── 2026/
    │   ├── 2026-10 October             Google spreadsheet
    │   ├── 2026-11 November            Google spreadsheet
    │   ├── Journal/
    │   │   ├── 10/
    │   │   │   ├── P1-000001.json
    │   │   │   └── P2-000001.json
    │   │   └── 11/
    │   └── Supplier documents/
    │       └── PURCHASE-ID.jpg
    ├── Product photos/
    │   └── PRODUCT-ID.jpg
    ├── Backups/
    │   ├── P1/
    │   └── P2/
    └── Exports/
```

Folders and names help people browse. Operational references use recorded Drive
IDs. A rename must not break normal operation. A separate business has its own
folder and identity. Practice/test uploads use a separate clearly labelled
business folder and local database; live and test references must not mix.

## 5. Core file 1: business.json

**Quantity:** one per business.

**Purpose:** a small directory that lets a new installation find the business
and interpret its records. It is not a transaction store or a second catalogue.

Illustrative contents; all IDs are placeholders:

```json
{
  "formatVersion": 1,
  "businessId": "shop-demo-001",
  "displayName": "Chipo's Shop",
  "mode": "live",
  "timeZone": "Africa/Harare",
  "myShopFileId": "example-my-shop-file-id",
  "journalRootFolderId": "example-journal-folder-id",
  "backupRootFolderId": "example-backups-folder-id",
  "phones": [
    {"id": "P1", "name": "Front counter", "active": true}
  ],
  "hub": null
}
```

Dura shows this as a readable Business files screen, with business name, file
links, connected phones, and hub status. The owner need not edit JSON.

No passwords, PINs, pairing secrets, merchant keys, or fiscal private keys belong
here. Directory changes need controlled writers and recoverable updates. A lost
directory must be reconstructable from the journal and file metadata. Pairing
and recovery must verify the business identity before trusting a directory.

## 6. Core file 2: My Shop

**Quantity:** one permanent Google spreadsheet per business.

**Purpose:** current business inputs and a readable view across months. It
exports to Excel; the live file is not an uploaded `.xlsx` workbook.

| Tab group | Contents | Editing rule |
|---|---|---|
| Read Me | Purpose, currencies, signs, completeness, and links | Generated guidance |
| Products | IDs, names, barcodes, units, prices, tax classification, photo links | Owner inputs, validated on acceptance |
| Contacts | Customers and suppliers | Owner inputs; minimise personal information |
| Settings and Lists | Pricing currency, categories, dropdown values | Supported changes only |
| Exchange Rates | Dated rates and effective times | Owner inputs with a clear direction of conversion |
| Locations, Phones, Staff | Names, assignments, roles, active status | Validated administrative inputs; no secrets |
| Stock and Balances | Current stock and outstanding amounts | Generated; correct through supported adjustments |
| Months and Reports | Cross-month summary values and useful reports | Generated with last-updated information |
| Files and Status | File links, layout versions, and reconciliation state | Generated |

Example Products preview — this fictitious business is not VAT registered:

| Product ID | Product | Barcode | Selling unit | Price (USD) | Tax classification | Active |
|---|---|---|---|---:|---|---|
| PR001 | Bread loaf | DEMO-BREAD-001 | loaf | 1.00 | Non-VAT business | Yes |
| PR002 | Cooking oil 2 L | DEMO-OIL-002 | bottle | 4.50 | Non-VAT business | Yes |

These demonstration identifiers are not scannable barcode specifications. Tax
classification is illustrative; real classifications require the correct
business registration and applicable rules.

Example Exchange Rates preview:

| Effective from | Pricing currency | Other currency | Units of other currency for 1 pricing unit | Entered by |
|---|---|---|---:|---|
| 2026-10-29 08:00 +02:00 | USD | ZWG | 30.00 | Chipo |

This is a made-up example rate, not a current market rate. The heading defines
the direction: USD 1.00 converts to ZWG 30.00 in this example.

Example Stock preview:

| Product | Location | Quantity on hand | Unit | Position includes records through | Status |
|---|---|---:|---|---|---|
| Bread loaf | Main shop | 18 | loaf | 29 Oct, 16:30 | Low stock: threshold 20 |
| Cooking oil 2 L | Main shop | 12 | bottle | 29 Oct, 16:30 | OK |

Do not accumulate all detailed transactions indefinitely in this workbook.
Cross-month summaries are generated values, with reconciliation and freshness
information. Formulas need not cross spreadsheet files.

## 7. Core file 3: the monthly workbook

**Quantity:** one per active month, across the business's phones and locations.

**Purpose:** familiar detailed business records for one period. Supported tabs
may be hidden until used.

| Tab | One row represents |
|---|---|
| Read Me | Guidance and period/completeness information |
| Sales | A sale or credit note |
| Items Sold | A historical product line |
| Payments | A tender or subsequent payment event |
| Stock Movements | A movement, receipt, transfer, return, loss, or adjustment |
| Money Movements | A supported expense, drawing, deposit, or other money event |
| Purchases | A supplier document and its payment position |
| Cash-ups | Counted and expected amounts for a shift and currency |
| Fiscal Days | Fiscal-day references, results, and status |
| Activity | A significant action or accepted change |
| Summary | Derived totals and reconciliation checks |

Example: two loaves at USD 1.00 each, paid with USD 5.00 cash and USD 3.00
change. This is a non-fiscal demonstration sale for the non-VAT example business.

Sales:

| Sale ID | Time | Phone | Seller | Total (USD) | Sale status | Fiscal status |
|---|---|---|---|---:|---|---|
| P1-S000031 | 2026-10-29 16:20 +02:00 | Front counter | Chipo | 2.00 | Completed | Not applicable |

Items Sold:

| Sale ID | Product ID | Product at sale | Quantity | Unit | Unit price (USD) | Line total (USD) |
|---|---|---|---:|---|---:|---:|
| P1-S000031 | PR001 | Bread loaf | 2 | loaf | 1.00 | 2.00 |

Payments:

| Payment ID | Sale ID | Method | Currency | Amount received | Change given | Net applied to sale | Confirmation |
|---|---|---|---|---:|---:|---:|---|
| P1-P000031 | P1-S000031 | Cash | USD | 5.00 | 3.00 | 2.00 | Recorded cash |

Stock Movements:

| Movement ID | Time | Product | Location | Reason | Quantity change | Unit | Reference |
|---|---|---|---|---|---:|---|---|
| P1-M000031 | 2026-10-29 16:20 +02:00 | Bread loaf | Main shop | Sold | -2 | loaf | P1-S000031 |

Cash-ups — example shift containing only that sale:

| Shift | Currency | Opening float | Net cash sales | Expected cash | Counted cash | Difference |
|---|---|---:|---:|---:|---:|---:|
| P1-SH000009 | USD | 10.00 | 2.00 | 12.00 | 12.00 | 0.00 |

Activity:

| Time | Person | Action | Record | Explanation |
|---|---|---|---|---|
| 2026-10-29 16:20 +02:00 | Chipo | Sale completed | P1-S000031 | 2 loaves; USD 2.00; cash |

Every other tab must receive the same kind of preview when its detailed schema
is implemented. Explain signs: negative stock means stock left the location;
cash-up difference means counted minus expected. Never add unrelated currencies
into one money total.

Monthly files are derived from journal history. A linked adjustment corrects a
historical business transaction. A deliberate report rebuild may replace derived
rows; this must be controlled, previewed, resumable, and safe against concurrent
uploads. Directly edited report values do not rewrite the journal.

## 8. Core file 4: journal batches

**Quantity:** grows with activity; multiple complete events per file.

**Purpose:** durable uploaded history, deduplication, independent reconstruction,
and recovery from partial spreadsheet updates.

Illustrative small batch. This is a preview, not the complete production schema:

```json
{
  "formatVersion": 1,
  "businessId": "shop-demo-001",
  "batchId": "P1-000001",
  "originPhoneId": "P1",
  "events": [
    {
      "eventId": "P1-E000031",
      "type": "sale.completed",
      "occurredAt": "2026-10-29T16:20:00+02:00",
      "saleId": "P1-S000031",
      "currency": "USD",
      "total": "2.00",
      "items": [
        {
          "productId": "PR001",
          "nameAtSale": "Bread loaf",
          "quantity": "2",
          "unit": "loaf",
          "unitPrice": "1.00",
          "lineTotal": "2.00"
        }
      ],
      "payments": [
        {
          "paymentId": "P1-P000031",
          "method": "cash",
          "received": "5.00",
          "change": "3.00",
          "applied": "2.00"
        }
      ],
      "stockMovements": [
        {
          "movementId": "P1-M000031",
          "productId": "PR001",
          "locationId": "MAIN",
          "quantityChange": "-2"
        }
      ],
      "fiscal": {"status": "not_applicable"}
    }
  ]
}
```

Decimal quantities and money use explicitly defined decimal representations;
the production schema must specify scale and rounding. IDs in these previews
are illustrative, not a final collision-prevention design.

Production events also need the relevant seller, currency conversion, costs,
taxes, references, and integrity metadata. Fiscal events preserve the required
signed receipt data and submission outcomes, excluding private keys. Later
outcomes are linked events, not edits to completed batches.

Do not create one file per item. Choose batch size and upload cadence through
measurement. Upload freshness, file counts, quotas, and recovery all matter.
No device should acknowledge an event as durably uploaded until the storage
protocol has verified it. Journal-uploaded and spreadsheet-updated are separate
statuses.

The owner sees a readable journal preview in Dura, for example:

| Batch | Phone | Events | Uploaded record |
|---|---|---:|---|
| P1-000001 | Front counter | 1 | Sale P1-S000031: 2 loaves, USD 2.00 |

## 9. Backups

**Quantity:** a limited rolling set per phone; retention is configurable and
must be documented. The final default is not fixed here.

**Purpose:** restore the phone's business working state, including pending
events captured by the last successful backup. The journal preserves uploaded
history; a backup is a convenient recovery checkpoint.

Example archive preview:

```text
P1-2026-10-29.backup
├── manifest.json
├── business-database.snapshot
└── recovery-readme.txt
```

Readable preview before restore:

| Information | Value |
|---|---|
| Business | Chipo's Shop |
| Original phone | P1 — Front counter |
| Backup completed | 2026-10-29 16:30 +02:00 |
| Pending events included | 0 |
| Fiscal device identity/counters | Excluded; separate recovery procedure |
| Compatibility | Checked against this app's supported backup formats |
| Work after this backup | May be missing unless uploaded separately |

Use a consistent database snapshot, not a casual copy of a live database file.
The final archive format and encryption are implementation work. If encrypted,
the owner must retain a recovery method independently of the original phone.

Use the visible Backups folder for owner-controlled recovery. Do not include
fiscal private keys or restore old fiscal counters. Replacement of a fiscal
device is separate from restoring ordinary business data. Reconcile restored
pending events against uploaded history before replaying them.

## 10. Optional attachments

**Quantity:** variable; no attachment is mandatory for an ordinary cash sale.

| File | Purpose | Data preview shown beside the file |
|---|---|---|
| `Product photos/PR001.jpg` | Recognise a product | Thumbnail: packaged bread; Product PR001; Bread loaf; updated 29 Oct 2026 |
| `Supplier documents/P1-B000007.jpg` | Preserve the original purchase document | Image: demonstration supplier invoice; Purchase P1-B000007; Demo Bakery; USD 20.00; 29 Oct 2026 |
| `Supplier documents/P1-B000008.pdf` | Preserve a supplier's original PDF | First-page preview; purchase ID; supplier; date; amount and currency; page count |

Product photos can have one current version initially. Purchase attachments
must remain linked to the correct purchase. Attachment replacement/deletion and
retention need explicit rules. A photo alone does not establish tax eligibility.

Do not store a PDF for every receipt by default merely to make another copy.
Retain the historical data required to reproduce its presentation and preserve
any outputs required by the applicable fiscal record rules. Confirm those rules
before finalising retention.

## 11. Exports

**Quantity:** created on request; none required for daily operation.

| Export | Contents | Purpose |
|---|---|---|
| Excel workbook | Read Me, documented tables, summaries, and data dictionary | Owner/accountant use |
| CSV ZIP | One UTF-8 CSV per table, dictionary, and export manifest | Import into another system |
| Complete business archive | Journal, directory/configuration, attachments, readable tables, documentation, and manifest | Independent recovery or migration |

CSV preview:

```csv
Sale ID,Time,Product ID,Product,Quantity,Unit,Currency,Unit price,Line total
P1-S000031,2026-10-29T16:20:00+02:00,PR001,Bread loaf,2,loaf,USD,1.00,2.00
```

Data dictionary preview:

| Column | Meaning | Example |
|---|---|---|
| Sale ID | Stable reference linking sale, items, and payments | P1-S000031 |
| Time | Event time with UTC offset | 2026-10-29T16:20:00+02:00 |
| Quantity | Number sold in the stated selling unit | 2 loaf |
| Line total | Recorded line amount in Currency; production schema defines discount/tax treatment | USD 2.00 |

Export manifest preview:

| Information | Value |
|---|---|
| Requested period | 1–31 October 2026 |
| Export created | 2026-10-29 16:35 +02:00 |
| Included records through | 2026-10-29 16:30 +02:00 |
| Completeness | Provisional: month not finished; P2 has not reconnected |
| Tables | Sales, Items Sold, Payments, Stock Movements, Cash-ups |
| Secrets included | None |

An incomplete export must say why. A complete migration export also needs
stock and outstanding balances at the selected cut-off, opening positions,
adjustments, currency/rate definitions, and fiscal references. Exporting only
summary reports is not sufficient.

If Excel users need exported summaries without recalculation, include readable
calculated values. Do not make essential interpretation depend on a proprietary
app, colour alone, or working cross-file formulas. Record exporter and schema
versions and document how another person can verify totals.

## 12. Local phone storage

These are implementation storage, not files an owner edits manually.

| Storage | Purpose | Readable preview in Dura |
|---|---|---|
| Room business database | Products, checkout progress, local events, outbox, cached shared data | `Sale P1-S000031 — Completed — Journal uploaded — Spreadsheet updated` |
| fzimra-managed storage | Device state, fiscal receipts, queued submissions | `Device: not configured` for this non-fiscal example; configured devices show pending receipts and fiscal-day status |
| Android Keystore entries | Protected device keys and credentials | `Fiscal key: present` or `Not configured`; never expose key material |
| Cache and temporary files | Thumbnails, downloaded views, share/print documents | `Receipt preview — P1-S000031 — USD 2.00`; disposable after its documented lifetime |

The SDK owns its physical storage layout; do not assume it is a single database
file. Separate live and practice storage. Choose local retention based on
offline work, older refunds, recovery, and actual device capacity; do not make
seven days a universal correctness assumption.

## 13. Optional Shop Hub

**Quantity:** one Apps Script project per business that uses hub features.

**Purpose:** authorised online payment operations, scheduled jobs, and, if
validated and selected, narrower access for paired staff devices. It belongs to
the business; there is no Dura-run business-data service in this design.

Readable deployment preview:

| Information | Value |
|---|---|
| Hub owner | Business's Google account |
| Installed version | Example 1.0 |
| Paired phone | P1 — Front counter |
| Payments | Not configured |
| Scheduled jobs | Monthly file preparation enabled |
| Last successful check | 29 Oct 2026, 16:30 |

Keep merchant credentials and pairing secrets out of spreadsheets and normal
exports. Provide source, installation, update, credential-replacement, and
recovery instructions so a different developer can help.

The hub is outside the cash-sale path. Integrated mobile-money checkout does
depend on it when the hub initiates and checks payment. Staff phones without
the owner's Google login require the proposed mediated access path; they cannot
use direct Sheets access as though they held the owner's authorisation.

The choice between direct owner-phone access and hub-mediated staff access
remains a prototype decision. Do not claim seller-only access while signing
the owner's Google account into unrestricted seller phones. Offline revocation
also requires an explicit policy.

## 14. File counts

There are four core cloud file types, not four fixed files:

| Stage | Core Drive files |
|---|---|
| Freshly configured, before any journal upload | 3: business.json, My Shop, current monthly workbook |
| Twelve active months | 14 before journals/backups/attachments/exports: two permanent files plus twelve monthly workbooks |

For one business, ordinary Drive file count is:

`2 + M + J + B + A + E`

- `M`: monthly workbooks actually created, including prepared future months.
- `J`: uploaded journal batch files.
- `B`: retained backup archives across phones.
- `A`: attachment files.
- `E`: retained export files/archives.

For example, 12 monthly workbooks, 240 batches, 14 backups, 30 attachments,
and 2 exports mean 300 files. This is arithmetic for illustration, not a
predicted batch volume. Folders, local storage, and the optional script project
are counted separately. Test businesses have their own counts.

The owner should normally navigate My Shop and the monthly workbooks. The
supporting files make those records recoverable and portable.

## 15. Differences from the earlier plan

| Earlier approach | Updated proposal |
|---|---|
| Sheets hold the only shared business record | Journal preserves uploaded events; Sheets provide accepted inputs and rebuildable views |
| Permanent detailed ledgers with destructive year-end clearing | Detailed monthly views and retained immutable journal; defer destructive cleanup |
| Row IDs assumed to make repeated append safe | Explicit verified upload, event deduplication, completeness, and reconciliation protocol |
| Owner account on all phones, with app-only seller access claimed | Simple owner-phone mode; separately validated staff-access model |
| Backup and restore introduced late | Recovery demonstrated before live piloting |
| Seven days of local sales assumed | Explicit retention policy based on real offline needs |
| Files described without consistent examples | Preview required for every file design; plain-language user data is mandatory |

No automatic deletion of original business history is introduced here. Storage
growth needs measurement and a documented retention policy. Checkpoints or
summaries may accelerate reconstruction later, but must not silently become
undocumented replacements for the original record.

## 16. Build gates

1. Publish the versioned event and table schemas, each with previews and a
   dictionary. The same definitions should guide app mapping and sample outputs.
2. Prove a complete cash sale survives process termination and restart.
3. Prove a lost upload response cannot double-count the sale, stock, or cash.
4. Prove partial workbook updates can be detected and repaired from the journal.
5. Prove accepted spreadsheet changes are validated and reconstructable.
6. Restore business data onto another phone without replaying fiscal state or
   duplicating restored events.
7. Export and reconstruct the opening position, transactions, stock, and balances
   using the archive and documentation.
8. Validate a second phone, stale stock displays, and staff access before making
   multi-phone promises.
9. Validate fiscal and payment recovery at their external side-effect boundaries
   before enabling those features for live trading.

Pilot success means the owner can sell, cash up, inspect understandable records,
recover, and leave with usable data. Additional features follow evidence from
that pilot.
