// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:io';
import 'dart:isolate';

import 'package:rotation_log/rotation_log.dart';

/// A top-level boundary avoids capturing the writer's unsendable Future queue.
Future<void> writeSupportArchiveInBackground(
  String directoryPath,
  List<String> inputs,
  String destination,
  int maxFileBytes,
) => Isolate.run(() async {
  // Export-only use: do not initialize or append from this worker.
  final archiver = RotationLogger(
    RotationLogTerm.size(maxFileBytes),
    directoryProvider: () async => Directory(directoryPath),
  );
  await archiver.archiveLogs(archiveFileName: destination, filePaths: inputs);
});
