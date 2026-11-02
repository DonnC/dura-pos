// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_core/dura_core.dart';

/// Future issue screens call this after the owner chooses to send a report.
///
/// Archives are attached automatically. A failed archive stops submission so a
/// screen can offer retry or a clearly labelled report without diagnostics.
/// The transport is injected; preparing a report never implies delivery.
Future<void> reportIssue({
  required DiagnosticStore diagnostics,
  required Future<void> Function(String archivePath) submit,
}) async {
  final archive = await diagnostics.createArchive();
  await submit(archive);
}
