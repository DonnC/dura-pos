# Decision 0002: client workspace and MIT licence

Accepted 2 November 2026, following the owner's layout/header instructions.

All Flutter apps/packages and their Pub/Melos configuration, tooling and tests
live inside client/. Root remains available for samples, Python generation,
research, handbook, future Apps Script and repository-wide release/governance
files. Run Flutter commands in client/; CI and Dependabot use the new paths.

Choose MIT for original Dura POS work: straightforward reuse, modification and
commercial distribution fit the owner's control/portability direction. MIT also
allows proprietary forks; it does not require downstream changes to be published.
Apache-2.0 offers an explicit contributor patent grant, which MIT does not state
explicitly. Revisit that choice only through a deliberate licence decision.

The previous root licence was GPL-3.0. The visible repository history lists
Donald Chinhuru as author; this change applies MIT to current original project
work under the owner's instruction. It does not rewrite earlier Git history,
relicense third-party code or assert ownership of external reference material.
Preserve fonts/dependency/upstream notices. AUTHORS records DonnC and agreed
contributors; new original sources use the copyright/AUTHORS/MIT/SPDX pattern
in client/tool/source_header.dart. CLAUDE.md remains owner-maintained.

Sources: [MIT terms](https://opensource.org/license/mit) and
[Apache-2.0 terms](https://www.apache.org/licenses/LICENSE-2.0).
