// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../theme/dura_tokens.dart';

/// The frame every Dura field shares. The error words are shown by
/// [DuraLabelled], so the decoration only turns the border red.
InputDecoration duraFieldDecoration(
  DuraTokens tokens, {
  String? hint,
  bool invalid = false,
  Widget? prefix,
  Color? restBorder,
}) {
  final colors = tokens.colors;
  OutlineInputBorder border(Color color, [double width = 1]) =>
      OutlineInputBorder(
        borderRadius: BorderRadius.all(tokens.radii.medium),
        borderSide: BorderSide(color: color, width: width),
      );
  final rest = invalid ? colors.error : restBorder ?? colors.line;
  return InputDecoration(
    hintText: hint,
    hintStyle: tokens.text.body.copyWith(color: colors.muted),
    prefixIcon: prefix,
    prefixIconConstraints: const BoxConstraints(),
    filled: true,
    fillColor: colors.paper,
    isDense: true,
    contentPadding: EdgeInsets.symmetric(
      horizontal: tokens.space.sm,
      vertical: tokens.space.sm + tokens.space.xxs,
    ),
    border: border(rest),
    enabledBorder: border(rest),
    disabledBorder: border(colors.line.withValues(alpha: 0.5)),
    focusedBorder: border(invalid ? colors.error : colors.actionInk, 2),
    errorBorder: border(colors.error),
    focusedErrorBorder: border(colors.error, 2),
  );
}
