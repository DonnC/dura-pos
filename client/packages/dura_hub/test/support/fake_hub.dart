// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:dura_hub/dura_hub.dart';

const deviceSecret =
    'abababababababababababababababababababababababababababababababab';

/// Answers like a hub, and checks each signature the way `PROTOCOL.md` says.
final class FakeHub implements HubTransport {
  FakeHub(this.answer);

  /// Returns the reply for an action's body, or throws.
  final Object? Function(String action, Map<String, Object?> body) answer;
  final requests = <Map<String, Object?>>[];

  @override
  Future<String> post(Uri address, String body) async {
    final request = jsonDecode(body) as Map<String, Object?>;
    requests.add(request);
    if (request.containsKey('sig')) _checkSignature(request);
    final reply = answer(
      request['action']! as String,
      request['body']! as Map<String, Object?>,
    );
    return reply is String ? reply : jsonEncode(reply);
  }

  void _checkSignature(Map<String, Object?> request) {
    final unsigned = {...request}..remove('sig');
    final digest = Hmac(
      sha256,
      utf8.encode(deviceSecret),
    ).convert(utf8.encode(canonicalJson(unsigned)));
    if (digest.toString() != request['sig']) {
      throw StateError('The signature does not match');
    }
  }
}

Map<String, Object?> ok(Object? result) => {
  'v': 1,
  'ok': true,
  'result': result,
};

Map<String, Object?> refused(String category, String code) => {
  'v': 1,
  'ok': false,
  'error': {'category': category, 'code': code, 'message': 'For logs'},
};
