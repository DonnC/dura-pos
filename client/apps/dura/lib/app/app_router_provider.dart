// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:async';

import 'package:dura_core/dura_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/diagnostics/diagnostic_screen.dart';
import '../features/money/money_tab.dart';
import '../features/sell/sell_tab.dart';
import '../features/shop/shop_tab.dart';
import '../features/stock/stock_tab.dart';
import 'analytics_provider.dart';
import 'app_routes.dart';
import 'breadcrumbs_provider.dart';
import 'shell/app_shell.dart';
import 'tracked_screen.dart';

final appRouterProvider = Provider.autoDispose<GoRouter>((ref) {
  final router = GoRouter(
    initialLocation: AppRoutes.sell,
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => AppShell(shell: shell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.sell,
                builder: (context, state) => const SellTab(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.stock,
                builder: (context, state) => const StockTab(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.money,
                builder: (context, state) => const MoneyTab(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.shop,
                builder: (context, state) => const ShopTab(),
                routes: [
                  GoRoute(
                    path: AppRoutes.diagnosticsSegment,
                    builder: (context, state) => const DiagnosticScreen(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );

  // Each screen opened joins the problem-report trail and the usage log.
  final trail = ref.read(breadcrumbsProvider);
  final analytics = ref.read(analyticsProvider);
  TrackedScreen? last;
  void opened() {
    final path = router.routerDelegate.currentConfiguration.uri.path;
    final screen = TrackedScreen.forPath(path);
    if (screen == null || screen == last) return;
    last = screen;
    trail.add(screen.id);
    unawaited(
      analytics.track(
        AnalyticsEvents.screenViewed,
        fields: {AnalyticsFields.screen: screen.id},
      ),
    );
  }

  router.routerDelegate.addListener(opened);
  ref.onDispose(() {
    router.routerDelegate.removeListener(opened);
    router.dispose();
  });
  return router;
});
