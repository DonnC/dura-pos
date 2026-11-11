// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/dura_context.dart';
import 'dura_field_decoration.dart';
import 'dura_labelled.dart';

/// A money amount, typed in large figures, with its currency always in front.
///
/// It accepts only digits and up to [decimals] places. Turning the text into
/// money, and checking it, stays with the feature, using `dura_core` types.
/// The caller owns [controller] and [focusNode], and disposes them.
class DuraAmountField extends StatelessWidget {
  const DuraAmountField({
    required this.label,
    required this.currency,
    this.controller,
    this.hint,
    this.errorText,
    this.onChanged,
    this.onSubmitted,
    this.focusNode,
    this.decimals = 2,
    this.autofocus = false,
    super.key,
  }) : assert(decimals >= 0);

  final String label;

  /// The currency code shown in front of the figure, such as `USD`.
  final String currency;
  final TextEditingController? controller;
  final String? hint;
  final String? errorText;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final FocusNode? focusNode;
  final int decimals;
  final bool autofocus;

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    final pattern = decimals == 0 ? r'^\d*' : '^\\d*\\.?\\d{0,$decimals}';
    return DuraLabelled(
      label: '$label · $currency',
      errorText: errorText,
      child: ConstrainedBox(
        constraints: BoxConstraints(minHeight: tokens.sizes.amountField),
        child: TextField(
          controller: controller,
          focusNode: focusNode,
          autofocus: autofocus,
          onChanged: onChanged,
          onSubmitted: onSubmitted,
          keyboardType: TextInputType.numberWithOptions(decimal: decimals > 0),
          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(pattern))],
          style: tokens.text.amountLarge,
          decoration:
              duraFieldDecoration(
                tokens,
                hint: hint,
                invalid: errorText != null,
                restBorder: tokens.colors.actionInk,
                prefix: Padding(
                  padding: EdgeInsets.only(
                    left: tokens.space.md,
                    right: tokens.space.sm,
                  ),
                  child: ExcludeSemantics(
                    child: Text(
                      currency,
                      style: tokens.text.rowTitle.copyWith(
                        color: tokens.colors.muted,
                      ),
                    ),
                  ),
                ),
              ).copyWith(
                hintStyle: tokens.text.amountLarge.copyWith(
                  color: tokens.colors.muted,
                ),
              ),
        ),
      ),
    );
  }
}
