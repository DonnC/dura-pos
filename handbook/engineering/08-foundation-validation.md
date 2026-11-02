<!-- Maintained by the Dura POS contributors. -->
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

## Verification status

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
