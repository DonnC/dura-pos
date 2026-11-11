// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/app_copy.dart';
import '../../app/shell/shell_role.dart';
import '../../app/shell/shell_role_provider.dart';
import '../../app/shell/tab_placeholder.dart';

/// MONEY-01. "Your money" for the owner, "My till" for a seller.
class MoneyTab extends ConsumerWidget {
  const MoneyTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final owner = ref.watch(shellRoleProvider) == ShellRole.owner;
    return TabPlaceholder(
      title: owner ? AppCopy.moneyTitle : AppCopy.tillTitle,
      subtitle: owner ? AppCopy.moneySubtitle : AppCopy.tillSubtitle,
      later: AppCopy.moneyLater,
    );
  }
}
