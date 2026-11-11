// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../../app/app_copy.dart';
import '../../app/shell/tab_placeholder.dart';

/// STOCK-01. Products arrive in phase 2; deliveries and counts in phase 7.
class StockTab extends StatelessWidget {
  const StockTab({super.key});

  @override
  Widget build(BuildContext context) => const TabPlaceholder(
    title: AppCopy.stockTitle,
    subtitle: AppCopy.stockSubtitle,
    later: AppCopy.stockLater,
  );
}
