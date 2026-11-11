# Decision: the Counter design and the app's UI foundation

Status: Accepted
Date: 2026-11-10
Roadmap slice: phase 1 (reusable UI), ahead of the phase 2 practice sale

## Problem and evidence

The owner approved the Counter design in
[`design/prototype/cdx`](../design/prototype/cdx/-cdx-design.md) as the direction for
the mobile app from now on. It has 49 screens, plus sheets, for owners and sellers.
It will be built in phases, so most screens exist only as shells for a long time.
Contributors need to see what is done and what is open.

The app had two shared controls, and both were Material widgets with light styling.
Material's default sizes and type read too large for a busy counter screen. Spacing
and sizes were fixed constants, not theme values. There was one layout width, and the
app has to work on phones, tablets and computer windows. The problem log kept only an
error's type. There was no record of how the app is used.

## Decision and alternatives

**The Counter design is the reference** for every app screen. Where it and older
concepts differ, the Counter design wins.

**Dura components are thin wrappers around Flutter's standard widgets.** Examples are
`DuraButton` around `FilledButton` and `DuraTextField` around `TextField`. They keep
native focus, keyboard, selection, autofill and screen-reader behaviour, and give
every screen the same compact look. Screens use Dura components, never Material's
directly, so a component can change underneath without touching a screen. Building
widgets from scratch was rejected, because it would re-create text editing and
accessibility for no gain.

**Every design value comes from the theme.** `DuraTokens` is a `ThemeExtension`
read with `context.dura`. It holds colours, spacing, corners, sizes and a compact
type scale taken from the prototype's CSS. A screen outside a Dura theme fails
loudly instead of falling back to Material defaults.

**Layout is decided by the window, never the platform.**
- Compact, under 600: a bottom bar.
- Medium, under 840: a side rail.
- Expanded: a side rail, with one readable column of at most 560 that later screens
  may split into two panes.
- Under 351, the side margin narrows.
- Large figures and titles grow with text size up to 1.5 times. At large text, rows
  stack instead of breaking words.

**The tracker is enforced.** [`design/ui-tracker.md`](../design/ui-tracker.md)
lists every component and screen, with its prototype reference and roadmap phase.
Boxes run from shell to observed with a vendor. `melos run check` fails when the
tracker and the code disagree. A plain checklist was rejected, because it drifts.

**Problem reports stay local, and gain detail.** Each error records:
- its type and source;
- up to 12 code frames, as function name and package file and line;
- the screen it happened on, and the last 20 screens before it.

Error messages and device paths are never written. Frames and the trail are checked
again when the record is written. This replaces the planned optional Firebase crash
reporting (capability map, phase 7): no vendor service is needed, which fits the
settled "no vendor cloud" model. People still share the support ZIP from Problem
reports themselves.

**Usage records start on the phone.** They are a separate rotated log: five files
of 1 MiB, apart from diagnostics and the journal.
- Event and field names are defined once, in `AnalyticsEvents` and
  `AnalyticsFields`. Anything else is dropped when written.
- They record screens opened, tabs, main actions, durations and errors. Never
  sales, amounts or names, which the journal already holds.
- A person is recorded only by staff ID, and each launch by a random session ID.
- Recording is on by default because nothing leaves the phone. The owner can switch
  it off in Problem reports.
- A later release uploads the files to the owner's own Drive through the Shop Hub.
  That's a new protocol action (tracker APP-04, phase 6), and only happens when the
  owner turns it on.

**Memory leaks fail tests.** Every widget test in `dura_ui` and the app runs with
Flutter's leak tracker, with the same settings as Flutter's own framework tests.

## Compatibility and migration

- **No data changes.** No journal, workbook, hub protocol or business data changes.
  The local database schema is unchanged.
- **Usage setting.** It's stored in the existing preferences table under
  `analytics.recording`. A missing value means on.
- **Problem log format.** It gains fields, and older log lines still read.
- **Navigation.** The foundation screen is replaced by the four-tab shell, with Sell
  as home. Diagnostics moves under My shop as Problem reports.
- **Dependencies.** `flutter_svg` is added to draw the approved wordmark from its SVG
  master. `leak_tracker_flutter_testing` is added for tests; it is already part of
  Flutter's own test tooling.
- **Version.** `AppVersion` repeats the product version, and the version-drift check
  covers it.

## Acceptance and reversal

**Evidence:**
- Component behaviour and screen-reader tests, labelled with tracker IDs.
- Contrast checks for every token pair in light and dark.
- 18 reviewed component golden images, at 320 wide, at normal and doubled text, plus
  a tablet rail.
- 4 reviewed shell images.
- Tests for owner and seller navigation, the rail, the usage and trail records,
  crash frames, the usage switch and the tracker guard.
- A deliberately leaky widget made the leak tracker fail, then was removed.

**Not yet verified:** TalkBack on a real phone, physical keyboard and insets, and any
vendor use.

**Reversal:** switching off usage recording stops all writes. Removing the usage log
needs no migration. The wrappers keep each Material dependency in one file per
component.
