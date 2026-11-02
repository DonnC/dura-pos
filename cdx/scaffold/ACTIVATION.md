# Scaffold templates: status and activation

These are prepared templates under cdx, not active repository configuration.
The user requested the engineering foundation before the application begins.
No Flutter app, dependency lockfile, GitHub workflow or Apps Script deployment
has been created by this blueprint.

| Staged file | Intended location after scaffold | Preview/purpose |
|---|---|---|
| pubspec.yaml.template | root pubspec.yaml | Pub workspace and named Melos tasks |
| .github/workflows/main.yml.template | .github/workflows/main.yml | push main → verify → native tests → build → release |
| .github/dependabot.yml.template | .github/dependabot.yml | Monthly grouped Pub/Gradle/Action updates |
| .github/PULL_REQUEST_TEMPLATE.md | same root-relative path | Behaviour, red/green tests, migrations, visual evidence |
| .github/ISSUE_TEMPLATE/bug_report.yml | same root-relative path | Reproduction without credentials/private records |
| .github/ISSUE_TEMPLATE/feature_request.yml | same root-relative path | Shop workflow, expected outcome, scope |
| CONTRIBUTING.md | root CONTRIBUTING.md | Contributor workflow and quality expectations |
| SECURITY.md | root SECURITY.md | Actual reporting channel must be verified |
| CHANGELOG.md | root CHANGELOG.md | Unreleased human-facing change record |
| AGENTS.md | root AGENTS.md | Durable repository-specific rules |
| handbook/decisions/0000-template.md | same root-relative path | Architecture decision format |
| release-notes/TEMPLATE.md | same root-relative path | Versioned release and migration notes |
| release.json.template | root release.json | Explicit version/build/publish intent |
| hub/PLAN.md | root hub/PLAN.md | Future Apps Script scope and boundaries |
| ../skills/*/SKILL.md | root .agents/skills/*/SKILL.md | Project-specific agent workflows |

Activation checklist:

1. Confirm scaffold phase is being started; preserve existing user edits and
   existing licence. Reconcile the current tiny README with real setup commands.
2. Generate Android app/plugin and pure Dart/UI/data packages. Choose and pin an
   SDK/toolchain that builds the current fzimra adapter. Resolve pubspec version
   tokens and create one root lockfile. Commit exact tool versions.
3. Implement all Melos helper commands and their meaningful tests. The template
   names are contracts, not existing executables. Missing targets must fail.
4. Copy engineering documents to docs and fix relative links. Install project
   skills into .agents/skills and change their policy reference to docs. The cdx
   skill sources can be invoked explicitly by path, but are not automatically
   discovered as installed skills merely because these files exist.
5. Resolve reviewed full-SHA Action placeholders; install CI and Dependabot only
   after the actual manifests/Gradle paths and test targets exist. Check workspace
   updates on a test PR; Pub workspace behaviour needs practical validation.
6. Implement tool/ci entrypoints: verify.dart, android_integration.dart,
   prepare_release.dart, publish_release.dart. They follow the delivery policy
   and use structured arguments/environment rather than shell-built descriptions.
   Scripts must be cross-platform where contributors need them.
7. Configure repository signing and private reporting channel using real owner
   settings. Never invent credentials/contact addresses or claim configuration
   from a template. No publication until the release manifest is enabled.
8. Exercise local checks and the main-only workflow. Confirm failed tests prevent
   publication, release assets match the checked commit, and reruns are safe.
9. Add initial real goldens, migration fixtures and schema/sample checks. Validate
   the sample workbook in Google Sheets and the agreed Excel version.
10. Update roadmap/changelog with evidence and announce precisely what is active.

The current engineering documents take priority over older incompatible notes.
Do not overwrite those notes silently; link supersession or migrate them through
a documented change when activating the application scaffold.
