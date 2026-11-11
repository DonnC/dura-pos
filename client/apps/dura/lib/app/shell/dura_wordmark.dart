// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../app_copy.dart';

/// The approved Shop Sign wordmark, drawn in the theme's ink, so it reads in
/// light and dark without a second file.
class DuraWordmark extends StatelessWidget {
  const DuraWordmark({super.key});

  static const asset = 'assets/branding/shop-sign-wordmark.svg';

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    return SvgPicture.asset(
      asset,
      height: tokens.sizes.markHeight,
      alignment: Alignment.centerLeft,
      colorFilter: ColorFilter.mode(tokens.colors.ink, BlendMode.srcIn),
      semanticsLabel: AppCopy.name,
    );
  }
}
