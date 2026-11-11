// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../theme/dura_context.dart';
import 'dura_amount_size.dart';

/// An amount with its currency: `USD 3.50`, never a bare `3.50`.
///
/// [amount] arrives already formatted by `dura_core`, so this widget never
/// rounds or converts money.
class DuraAmountText extends StatelessWidget {
  const DuraAmountText({
    required this.currency,
    required this.amount,
    this.size = DuraAmountSize.inline,
    this.color,
    this.currencyColor,
    super.key,
  });

  final String currency;
  final String amount;
  final DuraAmountSize size;

  /// Overrides the figure's colour, as on the dark summary card.
  final Color? color;
  final Color? currencyColor;

  /// Large figures grow with the person's text size, up to this much, so a
  /// total still fits a phone at 200% text.
  static const largestScale = 1.5;

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    final text = tokens.text;
    final figure = switch (size) {
      DuraAmountSize.hero => text.amountHero,
      DuraAmountSize.medium => text.amountMedium,
      DuraAmountSize.inline => text.price,
    }.copyWith(color: color);
    final code = switch (size) {
      DuraAmountSize.inline => figure,
      _ => text.amountCurrency.copyWith(
        color: currencyColor ?? tokens.colors.muted,
      ),
    };
    final scaler = MediaQuery.textScalerOf(context);
    return Semantics(
      label: '$currency $amount',
      excludeSemantics: true,
      child: Text.rich(
        TextSpan(
          children: [
            TextSpan(text: '$currency ', style: code),
            TextSpan(text: amount, style: figure),
          ],
        ),
        textScaler: size == DuraAmountSize.inline
            ? scaler
            : scaler.clamp(maxScaleFactor: largestScale),
      ),
    );
  }
}
