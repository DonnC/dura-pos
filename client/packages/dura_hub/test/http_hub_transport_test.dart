// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:async';

import 'package:dura_core/dura_core.dart';
import 'package:dura_hub/dura_hub.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:test/test.dart';

final _hub = Uri.parse('https://script.google.com/macros/s/ID/exec');

Matcher _unavailable(String code) => throwsA(
  isA<BackendFailure>()
      .having((f) => f.kind, 'kind', BackendFailureKind.retryableUnavailable)
      .having((f) => f.code, 'code', code),
);

void main() {
  group('HttpHubTransport', () {
    test('follows the hub redirect with GET, without the body', () async {
      final seen = <http.Request>[];
      final transport = HttpHubTransport(
        MockClient((request) async {
          seen.add(request);
          if (request.method == 'POST') {
            return http.Response(
              '',
              302,
              headers: {
                'location': 'https://script.googleusercontent.com/o?x=1',
              },
              request: request,
            );
          }
          return http.Response('{"ok":true}', 200, request: request);
        }),
      );
      expect(await transport.post(_hub, '{"a":1}'), '{"ok":true}');
      expect(seen.map((r) => r.method), ['POST', 'GET']);
      expect(seen.first.followRedirects, isFalse);
      expect(seen.first.body, '{"a":1}');
      expect(seen.last.url.host, 'script.googleusercontent.com');
      expect(seen.last.body, isEmpty);
    });

    test('a reply with no redirect is used directly', () async {
      final transport = HttpHubTransport(
        MockClient((request) async => http.Response('reply', 200)),
      );
      expect(await transport.post(_hub, 'x'), 'reply');
    });

    test('a redirect loop stops after a few hops', () async {
      var requests = 0;
      final transport = HttpHubTransport(
        MockClient((request) async {
          requests += 1;
          return http.Response(
            '',
            302,
            headers: {'location': 'https://hub.test/again'},
            request: request,
          );
        }),
      );
      await expectLater(
        transport.post(_hub, 'x'),
        _unavailable('hub_bad_redirect'),
      );
      expect(requests, 6);
    });

    test('a server error is retryable', () async {
      final transport = HttpHubTransport(
        MockClient((request) async => http.Response('', 503)),
      );
      await expectLater(
        transport.post(_hub, 'x'),
        _unavailable('hub_http_error'),
      );
    });

    test('no connection is retryable', () async {
      final transport = HttpHubTransport(
        MockClient((request) => throw http.ClientException('No network')),
      );
      await expectLater(
        transport.post(_hub, 'x'),
        _unavailable('hub_unreachable'),
      );
    });

    test('a slow hub times out', () async {
      final transport = HttpHubTransport(
        MockClient((request) => Completer<http.Response>().future),
        timeout: const Duration(milliseconds: 10),
      );
      await expectLater(transport.post(_hub, 'x'), _unavailable('hub_timeout'));
    });
  });
}
