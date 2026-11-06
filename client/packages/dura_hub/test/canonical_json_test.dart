// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:dura_hub/dura_hub.dart';
import 'package:test/test.dart';

/// Shared with the hub's own tests, so Dart and JavaScript can't drift apart.
final _vectors = jsonDecode(
  File('test/fixtures/signing_vectors.json').readAsStringSync(),
) as Map<String, Object?>;

void main() {
  group('canonicalJson', () {
    test('matches the hub on every shared vector', () {
      for (final vector in _vectors['vectors']! as List<Object?>) {
        final entry = vector! as Map<String, Object?>;
        expect(canonicalJson(entry['value']), entry['canonical']);
      }
    });

    test('signatures match the hub on every shared vector', () {
      final key = utf8.encode(_vectors['secret']! as String);
      for (final vector in _vectors['vectors']! as List<Object?>) {
        final entry = vector! as Map<String, Object?>;
        final text = canonicalJson(entry['value']);
        final digest = Hmac(sha256, key).convert(utf8.encode(text));
        expect(digest.toString(), entry['sig']);
      }
    });

    test('sorts keys at every depth', () {
      expect(
        canonicalJson({
          'b': 1,
          'a': {'z': true, 'y': null},
        }),
        '{"a":{"y":null,"z":true},"b":1}',
      );
    });

    test('refuses numbers that could be written two ways', () {
      expect(() => canonicalJson(1.5), throwsArgumentError);
      expect(() => canonicalJson(9007199254740992), throwsArgumentError);
    });
  });
}
