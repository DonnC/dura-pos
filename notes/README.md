# Design notes

The numbered notes from the research phase (27 October to 2 November 2026).
They hold the detailed reasoning behind Dura: ZIMRA, payments, files, staff,
sync, finance. They were written for a Kotlin app writing straight into Sheets.
Where a later decision differs, the [handbook](../handbook/README.md) wins. Its
"What changed since the notes" table lists each difference.

New notes go here, numbered `NN-topic.md`.

| Note | About | Still current? |
|---|---|---|
| [01](01-assessment.md) | Honest market and risk assessment | Sections 2 to 5 and 8; sections 1, 6 and 7 superseded (business model by `03`, licence by decision 0002) |
| [02](02-questions-for-zimra.md) | Questions to send ZIMRA before fiscalising | Yes. File the answers here |
| [03](03-feature-design.md) | Features and their right size | Features yes; files and sync superseded by `04`, `12` and decision 0003 |
| [04](04-data-files.md) | The data model: files, tabs, columns, IDs, currencies, dropdowns | Mostly; the sample still follows it. Ledgers and year end change under decision 0003 |
| [05](05-archiving-and-security.md) | Archiving, what a phone keeps, PINs, keys, checklists | Security yes; destructive year end replaced by decision 0003 |
| [06](06-apps-script-gateway-assessment.md) | Why Apps Script is the Shop Hub, not the sync path | Yes |
| [07](07-customers-sync-onboarding-updates.md) | Big lists, five-minute onboarding, updating sheets safely | Yes, except currency defaults (see `12` §7) |
| [08](08-change-invoices-suppliers-ux-support.md) | Kept change, invoices, suppliers, the five-second rule, problem reports | Yes |
| [09](09-locations-phones-staff.md) | Locations, phones and staff, roles, reporting | Yes |
| [10](10-build-plan.md) | The original build plan and settled decisions | Decisions and payments yes; platform, sync, layout and phases replaced by the handbook |
| [11](11-talk-to-your-data.md) | Guide for owners using an AI on their files | Yes; ships with the app |
| [12](12-hub-test-mode-files-migration.md) | Shop Hub, test mode, folders, photos, pricing currency, migration | Yes, except §1, §3 and §5 (direct writes; built from code), replaced by decision 0003 |
| [13](13-financial-records.md) | Which financial records Dura produces | Yes |
| [14](14-ai-assistant-plan.md) | The future "Ask Dura" assistant | Yes; later |
