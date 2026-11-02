<!-- Maintained by the Dura POS contributors. -->
# Changelog

## Unreleased — 0.1.0-dev.1 foundation

### Added

- Flutter Android shell with Pub workspaces, Melos tasks and a shared root lockfile.
- Core contracts, Drift-backed non-secret preferences and reusable themed controls.
- On-device operational logs capped at ten 5 MiB files, bounded ZIP exports and
  confirmation before sharing from diagnostic settings.
- Unit/persistence/rotation/redaction/widget tests and shared-control visual baselines.
- Seven project-specific skills, architecture/records/roadmap policies in handbook,
  contribution templates, main-only CI and monthly grouped dependency updates.

### Design decisions

- Fiscalisation is optional per business and deferred; no fiscal plugin is installed.
- Python remains the core template generator, producing clean and mock-shop
  workbook pairs from shared definitions. The app copies approved templates;
  a small contract maps app-used fields. Existing copies receive deliberate
  upgrades that preserve owner additions.
- Native business records, sync, sales, authentication and gateways remain planned.

### Validation

- See handbook/engineering/08-foundation-validation.md for executed checks and limits.
- Publication is disabled; this is not a live-trading release or certification claim.
