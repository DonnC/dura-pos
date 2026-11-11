// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../theme/dura_context.dart';
import 'dura_amount_size.dart';
import 'dura_amount_text.dart';

/// The dark card that holds a screen's main figure ("Sales after returns ·
/// USD 86.50") or its main instruction ("Count your starting cash.").
class DuraSummaryCard extends StatelessWidget {
  /// A figure: [currency] and [amount] are both required.
  const DuraSummaryCard.amount({
    required this.eyebrow,
    required String this.currency,
    required String this.amount,
    this.footnote,
    super.key,
  }) : headline = null;

  /// An instruction in words.
  const DuraSummaryCard.headline({
    required this.eyebrow,
    required String this.headline,
    this.footnote,
    super.key,
  }) : currency = null,
       amount = null;

  /// A few words above, such as "Sales after returns".
  final String eyebrow;
  final String? headline;
  final String? currency;
  final String? amount;

  /// What the figure covers: "24 sales · This till only".
  final String? footnote;

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    final colors = tokens.colors;
    final space = tokens.space;
    return ClipRRect(
      borderRadius: BorderRadius.all(tokens.radii.card),
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.all(space.lg),
        decoration: BoxDecoration(
          color: colors.summary,
          border: Border(
            left: BorderSide(
              color: colors.brand,
              width: tokens.sizes.accentEdge,
            ),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              eyebrow.toUpperCase(),
              style: tokens.text.eyebrow.copyWith(color: colors.summaryMuted),
            ),
            SizedBox(height: space.sm),
            if (headline case final words?)
              Text(
                words,
                style: tokens.text.title.copyWith(color: colors.onSummary),
              )
            else
              DuraAmountText(
                currency: currency!,
                amount: amount!,
                size: DuraAmountSize.hero,
                color: colors.onSummary,
                currencyColor: colors.summaryMuted,
              ),
            if (footnote case final note?) ...[
              SizedBox(height: space.sm),
              Text(
                note,
                style: tokens.text.small.copyWith(color: colors.summaryMuted),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
