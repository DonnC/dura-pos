// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/diagnostics/diagnostic_store_provider.dart';
import 'breadcrumbs_provider.dart';
import 'install_error_tracing.dart';

final runtimeTracingProvider = Provider.autoDispose<void>((ref) {
  final restore = installErrorTracing(
    ref.watch(diagnosticStoreProvider),
    trail: ref.watch(breadcrumbsProvider),
  );
  ref.onDispose(restore);
});
