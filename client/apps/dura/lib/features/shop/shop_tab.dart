// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/app_copy.dart';
import '../../app/app_routes.dart';
import '../../app/shell/shell_role.dart';
import '../../app/shell/shell_role_provider.dart';
import '../../app/shell/tab_placeholder.dart';

/// SHOP-01. "My shop" for the owner, "Me" for a seller. Problem reports are
/// here for both, so anyone can send them to whoever is helping.
class ShopTab extends ConsumerWidget {
  const ShopTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final owner = ref.watch(shellRoleProvider) == ShellRole.owner;
    return TabPlaceholder(
      title: owner ? AppCopy.shopTitle : AppCopy.meTitle,
      subtitle: owner ? AppCopy.shopSubtitle : AppCopy.meSubtitle,
      later: AppCopy.shopLater,
      children: [
        DuraListRow(
          title: AppCopy.problemReports,
          subtitle: AppCopy.problemReportsDetail,
          icon: Icons.support_outlined,
          onTap: () => context.go(AppRoutes.diagnostics),
        ),
      ],
    );
  }
}
