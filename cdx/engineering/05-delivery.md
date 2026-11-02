# Open-source delivery, versioning, CI and dependency policy

## Maintained repository files

At application scaffold activation, install a project overview, CONTRIBUTING.md,
SECURITY.md, CHANGELOG.md, root AGENTS.md, architecture/roadmap/testing/records
policies, decision records, PR/issue templates and release-note template. Keep
the existing GPL v3 licence unchanged; determine any "or later" designation
from the actual project's licensing statement rather than assuming it from the
licence text. Preserve third-party licence/NOTICE requirements when distributing.
No AI attribution trailers are added.

Current additions live in cdx. `cdx/scaffold` is an inactive staging area. Do not
mistake YAML templates for installed GitHub settings, or planned test commands
for an implemented test suite.

## Version model

Use one product release version across the app and private workspace packages;
do not run independent Melos package versioning initially. Melos orchestrates
tasks; it is not a second version authority. Public package releases, if later
needed, require an explicit separate policy.

| Version | Example | Rule |
|---|---|---|
| Product SemVer | 0.1.0-dev.1 | Pre-release while operational gates remain incomplete |
| Android build number | 17 | Monotonically increasing integer, never reused for a store upload |
| Event schema | 1 | Independently defined reader/writer compatibility |
| Workbook layout | 1 | Versioned migrations and preview fixtures |
| Local DB schema | 1 | Tested migrations |
| Hub protocol | 1 | Capability negotiation and supported version range |

Product patch: compatible correction. Minor: compatible new capability. Major:
breaking supported contract. Before 1.0, minor changes may break contracts only
with prominently documented migration and tests; patch remains compatible.
Never infer compatibility from the product version alone.

## Meaningful pushes and changelog

Every meaningful pushed change adds a concise entry under Unreleased: user
effect, compatibility/migration impact and relevant verification. Include
dependency, documentation and policy changes when meaningful. A typo fix can be
grouped; avoid noisy entries per formatting commit. Bug fixes explain before/after.

Conventional commits are preferred (`feat`, `fix`, `refactor`, `test`, `docs`,
`build`, `chore`; breaking change explicitly marked), but human release notes
remain required. A contributor edits the changelog as part of the same change.

Preview:

```markdown
## Unreleased
### Fixed
- Preserve an unconfirmed wallet payment after restart and recheck its original reference.
### Compatibility
- No file-layout migration required.
### Validation
- Restart/unknown-payment regression test; payment adapter contract suite.
```

## Release from main

Only `push` to `main` triggers the proposed workflow. No PR, tag, schedule or
manual workflow trigger is included. Contributor checks therefore run locally
before merging; main-only CI does not protect against merging untested code.
No automatic dependency merging. Repository branch/ruleset configuration is a
separate future action, not accomplished by these templates.

Every main push runs checks. A release-intent commit additionally changes the
release manifest, app/workspace version and reviewed release notes/changelog
together. After all checks, native tests and signed build pass, CI creates the
GitHub tag/release and uploads those exact verified artifacts. Documentation-only
pushes still update Unreleased when meaningful, but do not force an app release.
This intentionally avoids turning every spelling correction into a new APK.

Release manifest preview (staged example, not a published version):

```json
{
  "version": "0.1.0-dev.1",
  "buildNumber": 1,
  "publish": false,
  "prerelease": true,
  "notes": "release-notes/0.1.0-dev.1.md"
}
```

Release validation must reject an existing tag, mismatched app version, reused
build number, missing notes/changelog section, dirty generated outputs or missing
required checks. Validate previous release metadata, not only git commit wording.
The exact checked-out main commit is the release target; never build main again
later and attach a different commit's artifacts.

CI must first build and validate artifacts, then create the public release. Failed
tests/build/signing produce no public release. Reruns may resume a release created
by this same run/commit after a failed upload, checking tag target and asset hashes;
they must not overwrite an unrelated published tag. Concurrency must serialize
publication; do not cancel a run halfway through publishing an artifact.

Release notes include version/commit, user changes, known limits, schema versions,
migrations/backups, checks performed, checks not performed, supported platforms,
install/update instructions, artifact checksums and source/licence information.
Pre-release is not ZIMRA certification. CI never publishes to Play automatically.

Use short-lived GITHUB_TOKEN with read-only permissions in verification jobs and
contents:write only in publication. Pin third-party Actions to reviewed full commit
SHAs when activating. Separate release signing secrets from tests; no real payment
keys or production fiscal credentials. Missing signing configuration fails a
requested installable release; do not quietly label a debug build as production.

## Main pipeline gates

1. Verify pinned SDK/toolchain, lockfile resolution and workspace dependency graph.
2. Format, analyse, regenerate and reject drift; enforce core/UI import boundaries.
3. Unit, invariant, repository-contract, migration and sync failure suites.
4. Widget/semantic/golden tests on the pinned canonical environment.
5. Schema/sample reconciliation and workbook export portability checks.
6. Android emulator integration and native bridge/SDK tests. Hardware/merchant
   qualification is separately recorded; an emulator is not physical-device proof.
7. Build/sign and verify release artifacts, manifest and source alignment.
8. Publish only if a valid release intent is present and all required jobs passed.

Expensive platform jobs may be scoped by actual affected capabilities once a
baseline exists; release-critical suites cannot be bypassed because a path filter
was misclassified. Missing test targets must fail activation/CI, not pass via
`|| true` or an empty package filter. Keep golden diff and failure logs as artifacts.

## Monthly Dependabot

Routine updates: monthly, grouped minor/patch separately from major updates for
Pub, Gradle and GitHub Actions. Limit open routine PRs to two per ecosystem.
Start with these bounded groups rather than assume every ecosystem can share
one PR. Add npm only when the hub actually has an npm manifest; document that
addition. Security alerts are not suppressed until the monthly routine cycle;
security-update scheduling and limits are separate GitHub behaviour.

Review dependency licence, maintenance, platform support, minimum SDK effects,
generated files, release notes and lockfile diff. Major groups receive explicit
migration review. The same TDD/contract/golden/regression checks apply. No
unreviewed mass upgrade directly to main.

## Activation

Template placeholders and required helper commands must be resolved against the
real scaffold. Run the pipeline locally, then validate actual GitHub behaviour
before claiming automation works. See `../scaffold/ACTIVATION.md`.
