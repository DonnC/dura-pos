// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:async';
import 'dart:io';

import 'package:dura_core/dura_core.dart';
import 'package:http/http.dart' as http;

import 'hub_transport.dart';

const _maxRedirects = 5;
const _redirects = {301, 302, 303, 307, 308};

/// [HubTransport] over HTTPS.
///
/// Apps Script answers a POST with a redirect to a one-time address, which
/// must be fetched with GET. Dart's client won't follow a redirect on a POST,
/// so this does it. Requests carry no credentials in headers, so following a
/// redirect to another host exposes nothing. The caller owns [client].
final class HttpHubTransport implements HubTransport {
  HttpHubTransport(this.client, {this.timeout = const Duration(seconds: 60)});

  final http.Client client;
  final Duration timeout;

  @override
  Future<String> post(Uri address, String body) async {
    try {
      return await _exchange(address, body).timeout(timeout);
    } on TimeoutException {
      throw _unavailable('hub_timeout');
    } on http.ClientException {
      throw _unavailable('hub_unreachable');
    } on SocketException {
      throw _unavailable('hub_unreachable');
    }
  }

  Future<String> _exchange(Uri address, String body) async {
    final request = http.Request('POST', address)
      ..followRedirects = false
      ..headers['Content-Type'] = 'text/plain; charset=utf-8'
      ..body = body;
    var reply = await http.Response.fromStream(await client.send(request));
    var hops = 0;
    while (_redirects.contains(reply.statusCode)) {
      final location = reply.headers['location'];
      if (location == null || ++hops > _maxRedirects) {
        throw _unavailable('hub_bad_redirect');
      }
      reply = await client.get(reply.request!.url.resolve(location));
    }
    if (reply.statusCode != 200) throw _unavailable('hub_http_error');
    return reply.body;
  }

  BackendFailure _unavailable(String code) =>
      BackendFailure(BackendFailureKind.retryableUnavailable, code);
}
