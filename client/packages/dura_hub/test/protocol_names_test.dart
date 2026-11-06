// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:convert';
import 'dart:io';

import 'package:dura_core/dura_core.dart';
import 'package:dura_hub/dura_hub.dart';
import 'package:dura_hub/src/hub_replies.dart';
import 'package:test/test.dart';

/// Shared with the hub's own tests, so Dart and JavaScript can't drift apart.
final _names = jsonDecode(
  File('test/fixtures/protocol_names.json').readAsStringSync(),
) as Map<String, Object?>;

Set<String> _listed(String key) =>
    (_names[key]! as List<Object?>).cast<String>().toSet();

void main() {
  test('every action is spelled as the hub spells it', () {
    expect(HubAction.values.map((a) => a.wire).toSet(), _listed('actions'));
  });

  test('every error category has a failure kind', () {
    expect(failureKinds.keys.toSet(), _listed('errorCategories'));
    expect(failureKinds.values.toSet(), BackendFailureKind.values.toSet());
  });

  test('every payment state is spelled as the hub spells it', () {
    expect(
      PaymentState.values.map((s) => s.name).toSet(),
      _listed('paymentStates'),
    );
  });

  test('attachment kinds and export formats match the hub', () {
    expect(attachmentKindNames.keys, unorderedEquals(AttachmentKind.values));
    expect(attachmentKindNames.values.toSet(), _listed('attachmentKinds'));
    expect(exportFormatNames.keys, unorderedEquals(ExportFormat.values));
    expect(exportFormatNames.values.toSet(), _listed('exportFormats'));
  });
}
