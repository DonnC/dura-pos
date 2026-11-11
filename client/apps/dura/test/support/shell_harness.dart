// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_core/dura_core.dart';
import 'package:dura_pos/app/analytics_provider.dart';
import 'package:dura_pos/app/app_router_provider.dart';
import 'package:dura_pos/app/breadcrumbs_provider.dart';
import 'package:dura_pos/app/preference_store_provider.dart';
import 'package:dura_pos/app/shell/shell_role.dart';
import 'package:dura_pos/app/shell/shell_role_provider.dart';
import 'package:dura_pos/features/diagnostics/diagnostic_store_provider.dart';
import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'fake_diagnostic_store.dart';
import 'memory_preferences.dart';
import 'recording_analytics.dart';

/// The whole app, routed, with in-memory stores.
Widget shellApp({
  required RecordingAnalytics analytics,
  Breadcrumbs? trail,
  ShellRole role = ShellRole.owner,
  Brightness brightness = Brightness.light,
  double textScale = 1,
}) => ProviderScope(
  overrides: [
    analyticsProvider.overrideWithValue(analytics),
    breadcrumbsProvider.overrideWithValue(trail ?? Breadcrumbs()),
    diagnosticStoreProvider.overrideWithValue(FakeDiagnosticStore()),
    preferenceStoreProvider.overrideWithValue(MemoryPreferences()),
    shellRoleProvider.overrideWithValue(role),
  ],
  child: Consumer(
    builder: (context, ref, _) => MaterialApp.router(
      debugShowCheckedModeBanner: false,
      theme: (brightness == Brightness.light ? DuraTheme.light : DuraTheme.dark)
          .copyWith(platform: TargetPlatform.android),
      routerConfig: ref.watch(appRouterProvider),
      builder: (context, app) => MediaQuery(
        data: MediaQuery.of(context)
            .copyWith(textScaler: TextScaler.linear(textScale)),
        child: app!,
      ),
    ),
  ),
);
