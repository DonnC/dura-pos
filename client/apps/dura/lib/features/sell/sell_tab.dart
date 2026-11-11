// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../../app/app_copy.dart';
import '../../app/shell/tab_placeholder.dart';

/// SELL-01. The home screen; selling arrives with the practice sale (phase 2).
class SellTab extends StatelessWidget {
  const SellTab({super.key});

  @override
  Widget build(BuildContext context) => const TabPlaceholder(
    title: AppCopy.sellTitle,
    subtitle: AppCopy.sellSubtitle,
    later: AppCopy.sellLater,
  );
}
