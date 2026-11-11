// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import 'dura_colors.dart';
import 'dura_radii.dart';
import 'dura_sizes.dart';
import 'dura_space.dart';
import 'dura_type.dart';

/// Every design value a Dura widget uses, carried by the theme.
///
/// Read it with `context.dura`. Widgets never hold their own colours, sizes or
/// text styles, so one change here restyles the whole app.
@immutable
final class DuraTokens extends ThemeExtension<DuraTokens> {
  const DuraTokens({
    required this.colors,
    required this.text,
    this.space = const DuraSpace(),
    this.radii = const DuraRadii(),
    this.sizes = const DuraSizes(),
  });

  final DuraColors colors;
  final DuraType text;
  final DuraSpace space;
  final DuraRadii radii;
  final DuraSizes sizes;

  @override
  DuraTokens copyWith({
    DuraColors? colors,
    DuraType? text,
    DuraSpace? space,
    DuraRadii? radii,
    DuraSizes? sizes,
  }) => DuraTokens(
    colors: colors ?? this.colors,
    text: text ?? this.text,
    space: space ?? this.space,
    radii: radii ?? this.radii,
    sizes: sizes ?? this.sizes,
  );

  @override
  DuraTokens lerp(covariant DuraTokens? other, double t) {
    if (other == null) return this;
    // Measurements snap; only colours and text animate between themes.
    return DuraTokens(
      colors: colors.lerp(other.colors, t),
      text: text.lerp(other.text, t),
      space: t < 0.5 ? space : other.space,
      radii: t < 0.5 ? radii : other.radii,
      sizes: t < 0.5 ? sizes : other.sizes,
    );
  }
}
