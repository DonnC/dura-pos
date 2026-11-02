// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_core/dura_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'diagnostic_store_provider.dart';

final diagnosticFilesProvider =
    FutureProvider.autoDispose<List<DiagnosticFile>>(
      (ref) => ref.watch(diagnosticStoreProvider).listFiles(),
    );
