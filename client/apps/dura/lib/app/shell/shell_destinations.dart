// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';

import '../app_copy.dart';
import 'shell_role.dart';

/// The four destinations, in the order of `TrackedScreen.tabs`.
///
/// A seller's third and fourth are their own till and their own access; they
/// lead to the same places, showing only what a seller may see.
List<DuraNavItem> shellDestinations(ShellRole role) => [
  const DuraNavItem(icon: Icons.shopping_basket_outlined, label: AppCopy.sell),
  const DuraNavItem(icon: Icons.inventory_2_outlined, label: AppCopy.stock),
  switch (role) {
    ShellRole.owner => const DuraNavItem(
      icon: Icons.account_balance_wallet_outlined,
      label: AppCopy.money,
    ),
    ShellRole.seller => const DuraNavItem(
      icon: Icons.point_of_sale_outlined,
      label: AppCopy.myTill,
    ),
  },
  switch (role) {
    ShellRole.owner => const DuraNavItem(
      icon: Icons.storefront_outlined,
      label: AppCopy.myShop,
    ),
    ShellRole.seller => const DuraNavItem(
      icon: Icons.person_outline,
      label: AppCopy.me,
    ),
  },
];
