// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:async';

import 'package:dura_core/dura_core.dart';
import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../analytics_provider.dart';
import '../app_copy.dart';
import '../tracked_screen.dart';
import 'dura_wordmark.dart';
import 'shell_destinations.dart';
import 'shell_role_provider.dart';

/// The frame around every tab: the shop header on top, and the four
/// destinations at the bottom on a phone or down the side on a wider window.
///
/// Each tab keeps its own history, so going to Stock and back to Sell returns
/// to where Sell was.
class AppShell extends ConsumerWidget {
  const AppShell({required this.shell, super.key});

  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = shellDestinations(ref.watch(shellRoleProvider));
    final rail = DuraWindow.of(context).hasRail;
    void select(int index) {
      unawaited(
        ref
            .read(analyticsProvider)
            .track(
              AnalyticsEvents.tabSelected,
              fields: {AnalyticsFields.tab: TrackedScreen.tabs[index].id},
            ),
      );
      // A second tap on the current tab returns to its start.
      shell.goBranch(index, initialLocation: index == shell.currentIndex);
    }

    final page = Column(
      children: [
        const DuraShopHeader(
          mark: DuraWordmark(),
          title: AppCopy.noShopYet,
          status: AppCopy.savedOnPhone,
        ),
        Expanded(child: shell),
      ],
    );
    return Scaffold(
      body: rail
          ? Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                DuraNavRail(
                  items: items,
                  selectedIndex: shell.currentIndex,
                  onSelected: select,
                ),
                Expanded(
                  // The rail already keeps clear of a side notch.
                  child: MediaQuery.removePadding(
                    context: context,
                    removeLeft: true,
                    child: page,
                  ),
                ),
              ],
            )
          : page,
      bottomNavigationBar: rail
          ? null
          : DuraNavBar(
              items: items,
              selectedIndex: shell.currentIndex,
              onSelected: select,
            ),
    );
  }
}
