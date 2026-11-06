// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:convert';

const _maxSafeInteger = 9007199254740991;

/// The protocol's signing string: keys sorted at every depth, no spacing,
/// integers only.
///
/// Every client must produce the same text for the same value, so anything
/// that could be written two ways is refused. Send amounts as strings.
String canonicalJson(Object? value) => switch (value) {
  null => 'null',
  final bool flag => flag.toString(),
  final String text => jsonEncode(text),
  final int number when number.abs() <= _maxSafeInteger => number.toString(),
  final List<Object?> items => '[${items.map(canonicalJson).join(',')}]',
  final Map<String, Object?> map => _object(map),
  _ => throw ArgumentError.value(value, 'value', 'cannot be signed'),
};

String _object(Map<String, Object?> map) {
  final keys = map.keys.toList()..sort();
  final fields = keys.map((k) => '${jsonEncode(k)}:${canonicalJson(map[k])}');
  return '{${fields.join(',')}}';
}
