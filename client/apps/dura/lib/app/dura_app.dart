// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_copy.dart';
import 'app_router_provider.dart';
import 'runtime_tracing_provider.dart';

class DuraApp extends ConsumerWidget {
  const DuraApp({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(runtimeTracingProvider);
    return MaterialApp.router(
      title: AppCopy.name,
      theme: DuraTheme.light,
      darkTheme: DuraTheme.dark,
      routerConfig: ref.watch(appRouterProvider),
    );
  }
}
