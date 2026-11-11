// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:test/test.dart';

import '../tool/ui_tracker.dart';

const _header =
    '| ID | Item | Prototype | Phase | Shell | Built | Tested | Golden | '
    'Responsive | A11y | Vendor |\n'
    '|---|---|---|---|---|---|---|---|---|---|---|\n';

String _tracker(List<String> rows, {String progress = 'Built: 1 of 2.'}) =>
    '# Tracker\n\n**$progress**\n\n$_header${rows.join('\n')}\n';

const _component =
    '| UI-04 | Buttons | `.primary` | 1 | — | [x] | [x] | [x] | [x] | [x] | [ ] |';
const _screen =
    '| SELL-01 | Sell | `sell` | 2 | [x] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |';

List<String> _problems({
  List<String> rows = const [_component, _screen],
  Set<String> registered = const {'SELL-01'},
  Map<String, String> tests = const {
    'buttons_test.dart': "group('UI-04 buttons', matchesGoldenFile)",
  },
}) => trackerProblems(
  tracker: _tracker(rows),
  registered: registered,
  tests: tests,
);

void main() {
  test('a tracker that matches the code passes', () {
    expect(_problems(), isEmpty);
  });

  test('a screen in the app but not in the tracker is named', () {
    expect(
      _problems(registered: {'SELL-01', 'SELL-02'}).single,
      contains('SELL-02 is a screen in the app but missing'),
    );
  });

  test('a ticked screen the app lacks is named', () {
    expect(
      _problems(registered: {}).single,
      contains('SELL-01 is ticked in the tracker but the app has no'),
    );
  });

  test('a screen in the app must have its shell ticked', () {
    final row = _screen.replaceFirst('| [x] |', '| [ ] |');
    expect(
      _problems(rows: [_component, row]).single,
      contains('SELL-01 exists in the app, so tick its Shell'),
    );
  });

  test('Tested and Golden need tests that name the ID', () {
    final problems = _problems(tests: {});
    expect(problems, contains(contains('UI-04 is ticked Tested')));
    expect(problems, contains(contains('UI-04 is ticked Golden')));
  });

  test('a golden tick needs a golden test, not any test', () {
    expect(
      _problems(tests: {'a_test.dart': "group('UI-04 buttons')"}).single,
      contains('UI-04 is ticked Golden but no golden test'),
    );
  });

  test('later ticks need Built first', () {
    final row = _component.replaceFirst('| — | [x] |', '| — | [ ] |');
    expect(
      _problems(rows: [row, _screen]),
      contains(contains('UI-04 is ticked Tested but not Built')),
    );
  });

  test('bad IDs, duplicates, ticks and phases are named', () {
    final problems = _problems(
      rows: [
        _component,
        _component,
        '| sell-1 | Sell | — | 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |',
        '| UI-09 | Row | — | 9 | — | yes | [ ] | [ ] | [ ] | [ ] | [ ] |',
        _screen,
      ],
    );
    expect(problems, contains('UI-04 is listed twice'));
    expect(problems, contains(contains('"sell-1" is not an ID')));
    expect(problems, contains(contains('UI-09 Built must be')));
    expect(problems, contains(contains('UI-09 needs a roadmap phase')));
  });

  test('the progress line must match the ticks', () {
    final problems = trackerProblems(
      tracker: _tracker([_component, _screen], progress: 'Built: 2 of 2.'),
      registered: {'SELL-01'},
      tests: {'a_test.dart': 'UI-04 matchesGoldenFile'},
    );
    expect(problems.single, contains('It is Built: 1 of 2.'));
  });

  test('registered IDs are the quoted ones in the app code', () {
    expect(
      registeredIds([
        "sell('SELL-01', AppRoutes.sell),",
        '/// SELL-02 is only a comment',
      ]),
      {'SELL-01'},
    );
  });
}
