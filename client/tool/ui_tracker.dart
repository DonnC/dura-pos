// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// The tracker's columns, in order. A table with this header is checked.
const trackerColumns = [
  'ID',
  'Item',
  'Prototype',
  'Phase',
  'Shell',
  'Built',
  'Tested',
  'Golden',
  'Responsive',
  'A11y',
  'Vendor',
];

const ticked = '[x]';
const open = '[ ]';

/// A step that doesn't apply, such as a shell for a component.
const notApplicable = '—';

/// The line near the top that says how far the work has come.
final progressLine = RegExp(r'\*\*(Built: \d+ of \d+\.)\*\*');

final trackerId = RegExp(r'^[A-Z]+-\d{2}$');
final _quotedId = RegExp(r"'([A-Z]+-\d{2})'");
const _ticks = ['Shell', 'Built', 'Tested', 'Golden', 'Responsive', 'A11y'];

/// IDs the app's code registers as screens: quoted literals such as
/// `'SELL-01'` in `TrackedScreen`.
Set<String> registeredIds(Iterable<String> sources) => {
  for (final source in sources)
    for (final match in _quotedId.allMatches(source)) match.group(1)!,
};

/// Everything wrong with [tracker] (the markdown of
/// `handbook/design/ui-tracker.md`), given the screen IDs the app registers
/// and the text of every test file.
List<String> trackerProblems({
  required String tracker,
  required Set<String> registered,
  required Map<String, String> tests,
}) {
  final problems = <String>[];
  final rows = <String, Map<String, String>>{};
  var inTable = false;
  for (final line in tracker.split('\n')) {
    final cells = _cells(line);
    if (cells == null) {
      inTable = false;
      continue;
    }
    if (_sameColumns(cells)) {
      inTable = true;
      continue;
    }
    if (!inTable || cells.every((cell) => RegExp(r'^:?-+:?$').hasMatch(cell))) {
      continue;
    }
    if (cells.length != trackerColumns.length) {
      problems.add('A tracker row has ${cells.length} cells: $line');
      continue;
    }
    final row = Map.fromIterables(trackerColumns, cells);
    final id = row['ID']!;
    if (!trackerId.hasMatch(id)) {
      problems.add('"$id" is not an ID like SELL-01');
      continue;
    }
    if (rows.containsKey(id)) problems.add('$id is listed twice');
    rows[id] = row;
  }
  if (rows.isEmpty) problems.add('The tracker has no rows');

  bool done(Map<String, String> row, String column) => row[column] == ticked;
  final goldenTests = {
    for (final MapEntry(:key, :value) in tests.entries)
      if (value.contains('matchesGoldenFile')) key: value,
  };
  bool named(Map<String, String> files, String id) =>
      files.values.any(RegExp('\\b$id\\b').hasMatch);

  for (final MapEntry(key: id, value: row) in rows.entries) {
    for (final column in [..._ticks, 'Vendor']) {
      final cell = row[column]!;
      if (cell != ticked && cell != open && cell != notApplicable) {
        problems.add('$id $column must be $ticked, $open or $notApplicable');
      }
    }
    if (!RegExp(r'^[1-8]$').hasMatch(row['Phase']!)) {
      problems.add('$id needs a roadmap phase from 1 to 8');
    }
    final screen = row['Shell'] != notApplicable;
    final built = done(row, 'Built');
    for (final later in ['Tested', 'Golden', 'Responsive', 'A11y', 'Vendor']) {
      if (done(row, later) && !built) {
        problems.add('$id is ticked $later but not Built');
      }
    }
    if (screen && built && !done(row, 'Shell')) {
      problems.add('$id is Built, so its Shell must be ticked too');
    }
    if (screen && done(row, 'Shell') && !registered.contains(id)) {
      problems.add(
        '$id is ticked in the tracker but the app has no such screen',
      );
    }
    if (done(row, 'Tested') && !named(tests, id)) {
      problems.add('$id is ticked Tested but no test names it');
    }
    if (done(row, 'Golden') && !named(goldenTests, id)) {
      problems.add('$id is ticked Golden but no golden test names it');
    }
  }
  final built = rows.values.where((row) => done(row, 'Built')).length;
  final progress = progressLine.firstMatch(tracker);
  final expected = 'Built: $built of ${rows.length}.';
  if (progress == null) {
    problems.add('The tracker needs its progress line: **$expected**');
  } else if (progress.group(1) != expected) {
    problems.add('The progress line says ${progress.group(1)} It is $expected');
  }
  for (final id in registered.difference(rows.keys.toSet())) {
    problems.add('$id is a screen in the app but missing from the tracker');
  }
  for (final id in registered) {
    final row = rows[id];
    if (row != null && !done(row, 'Shell')) {
      problems.add('$id exists in the app, so tick its Shell');
    }
  }
  return problems;
}

List<String>? _cells(String line) {
  final trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null;
  return trimmed
      .substring(1, trimmed.length - 1)
      .split('|')
      .map((cell) => cell.trim())
      .toList();
}

bool _sameColumns(List<String> cells) =>
    cells.length == trackerColumns.length &&
    [for (var i = 0; i < cells.length; i++) cells[i] == trackerColumns[i]]
        .every((same) => same);
