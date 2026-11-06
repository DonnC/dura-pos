# Foundation validation log

2 November 2026. Results below describe the local foundation checks, not a
production qualification.

## Environment

- Flutter stable 3.47.9; Dart 3.13.7; Windows host.
- Android SDK and Java 17 available. No Windows desktop C++ toolchain qualification.
- Pub resolved one root lockfile; Melos 8.10.0 bootstraps four workspace members.
- No application fiscal dependency or live account/provider configuration.

## Red/green evidence

- Rotating diagnostics tests first failed on one unbounded file instead of three,
  leaked fixture secrets, and unimplemented ZIP creation. Implemented rotation,
  allowlisted metadata and archive support. A subsequent test exposed an unsendable
  isolate closure; moved that boundary to a top-level function. Five focused
  diagnostic tests then passed, including concurrent record/export and reopening.
- SQLite persistence test first returned null after a close/reopen instead of the
  stored value. Implemented the Drift adapter; both persistence/isolation tests
  subsequently passed in the workspace runner.
- Shared-control interaction tests passed. Initial goldens used Ahem geometry;
  readable licensed Roboto fixtures replace them, with render review required.
- The large-text diagnostic test exposed a lazy-list visibility assumption; use
  scrollUntilVisible to exercise the real scrollable layout.

## Initial foundation verification

- `dart run melos run verify`: passed. Formatting, repository policy and Flutter
  analysis passed; all 21 tests passed across root tooling and four packages.
  This includes four golden comparisons using the pinned Roboto fixtures.
- Reviewed light and dark large-text golden renders for legibility and overflow.
- `dart run melos run generate`: passed, including the final regeneration of
  Drift mappings. Generated mappings are tracked for fresh checkouts.
- All seven installed project skills passed the skill metadata validator.
- Workflow configuration checks passed for main-only pushes, pinned actions,
  restricted permissions and monthly grouped dependency updates. These are static
  checks, not evidence of a remote workflow run.
- The disabled release command returned without publishing anything.
- Android APK compilation remains blocked on this host: both the normal attempt
  and a process-local IPv4 retry failed with
  `java.io.IOException: Unable to establish loopback connection`. No successful
  APK build, installation or device run is claimed.
- An earlier analysis attempt crashed during an SDK analytics network request.
  The final passing runner uses process-local analytics suppression.

GitHub Actions/Dependabot execution, signed releases, physical-device sharing,
native background recovery and any payment/fiscal/Google integration remain
unverified. The initial manifest disables publication. No live-trading readiness
or performance benchmark is claimed.

## Client layout, logging and ownership follow-up

2 November 2026. Commands now run from client/.

- Pub resolution and Melos bootstrap passed for all four packages after moving
  apps, packages, tooling, tests, analysis rules, SDK pin and lockfile into client/.
- `dart run melos run verify` passed: formatting, copyright/size/boundary policy,
  Flutter analysis and all 31 tests (tooling 3, core 1, data 11, UI 7, app 9).
- `dart run melos run generate` passed after the move; regenerated Drift output
  matches the previous tracked mapping.
- The four golden comparisons use the app's bundled Roboto through google_fonts
  8.2.1, with runtime fetching disabled. Inspected the large-text control render
  and the generated native launcher preview. Failure screenshots stay ignored.
- Read rotation_log documentation and resolved 0.1.2 source, including the active
  file/archived-file distinction, append/prune/close and ZIP implementation.
  Regression tests cover lowered count/byte limits, injected ZIP retention,
  redaction, concurrent writes, reopening and prevention of writes after close.
  The lowered-count regression first failed with three files instead of one.
- Report tests cover automatic archive attachment, archive failure stopping
  submission, and transport failure. Widget/lifecycle tests cover completion
  after unmount and restoration of the original global error handlers.
- Static checks passed for main-only CI, pinned actions, client paths, monthly
  dependency groups, disabled publication and five Android launcher PNG sizes.
- All seven project skills passed metadata validation. Header checks cover the
  DonnC/AUTHORS/MIT/SPDX pattern and preserve generated/third-party exceptions.
- Confirmed CLAUDE.md matches the owner's pre-scaffold original (e72640b).
- The release command resolves root metadata from client/ and returns with
  publication disabled. No issue submission, push, tag or release was performed.
- All 73 former workspace tracked paths are accounted for at their new location
  or by deliberate component/font relocation. Only ignored, editor-locked
  Gradle cache files remain under the old root apps path; no app source remains.
- Automatic approval review rejected a command to remove an empty legacy font
  directory with "blocked by policy". It remains untracked; no source depends on it.

The previous Android Java loopback build failure is not resolved by these checks.
No APK/device run, actual report transport, heap profile or remote CI execution
is claimed. See decision 0002 for the root MIT licence and client layout.
