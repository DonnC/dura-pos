// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/widgets.dart';
import 'package:google_fonts/google_fonts.dart';

/// Dura's type scale. Compact by design: phone screens are small, and a
/// counter screen has to show the shelf, the basket and the main action at once.
///
/// Sizes are logical pixels before the person's text scaling.
@immutable
final class DuraType {
  const DuraType({
    required this.display,
    required this.title,
    required this.heading,
    required this.body,
    required this.bodySmall,
    required this.label,
    required this.strong,
    required this.small,
    required this.rowTitle,
    required this.rowValue,
    required this.caption,
    required this.eyebrow,
    required this.nav,
    required this.price,
    required this.action,
    required this.actionAmount,
    required this.amountHero,
    required this.amountCurrency,
    required this.amountLarge,
    required this.amountMedium,
  });

  /// Builds the scale in [fontFamily], drawn in [ink].
  factory DuraType.of(String fontFamily, Color ink) {
    TextStyle style(
      double size,
      FontWeight weight, {
      double? height,
      double? spacing,
      bool figures = false,
    }) => GoogleFonts.getFont(
      fontFamily,
      textStyle: TextStyle(
        fontSize: size,
        fontWeight: weight,
        height: height,
        letterSpacing: spacing,
        color: ink,
        fontFeatures: figures ? const [FontFeature.tabularFigures()] : null,
      ),
    );
    const bold = FontWeight.w700;
    const medium = FontWeight.w500;
    const regular = FontWeight.w400;
    return DuraType(
      display: style(32, bold, height: 1.12, spacing: -1.2),
      title: style(20, bold, height: 1.25, spacing: -0.5),
      heading: style(16, bold, height: 1.3),
      body: style(16, regular, height: 1.4),
      bodySmall: style(13, regular, height: 1.5),
      label: style(13, medium, height: 1.3),
      strong: style(13, bold, height: 1.3, spacing: -0.2),
      small: style(12, regular, height: 1.5),
      rowTitle: style(14, medium, height: 1.35),
      rowValue: style(14, bold, height: 1.35, figures: true),
      caption: style(11, regular, height: 1.45),
      eyebrow: style(10, bold, height: 1.3, spacing: 1.5),
      nav: style(10, medium, height: 1.2),
      price: style(15, bold, height: 1.25, spacing: -0.3, figures: true),
      action: style(15, bold, height: 1.25),
      actionAmount: style(18, bold, height: 1.2, spacing: -0.4, figures: true),
      amountHero: style(46, bold, height: 1.2, spacing: -2, figures: true),
      amountCurrency: style(18, medium, height: 1.2),
      amountLarge: style(28, medium, height: 1.2, figures: true),
      amountMedium: style(22, bold, height: 1.2, spacing: -0.6, figures: true),
    );
  }

  /// A screen's own title: "Let's sell."
  final TextStyle display;

  /// A section title: "In the cash drawer".
  final TextStyle title;
  final TextStyle heading;
  final TextStyle body;

  /// Supporting lines under a title or row.
  final TextStyle bodySmall;

  /// Field labels and secondary buttons.
  final TextStyle label;

  /// The shop's name in the header.
  final TextStyle strong;

  /// Notes, notices and the toast.
  final TextStyle small;

  /// A list row's main line, and its figure on the right.
  final TextStyle rowTitle;
  final TextStyle rowValue;
  final TextStyle caption;

  /// Small capitals above a figure; the widget upper-cases the words.
  final TextStyle eyebrow;
  final TextStyle nav;
  final TextStyle price;

  /// The words on the main action.
  final TextStyle action;

  /// The total on the main action: "USD 3.50".
  final TextStyle actionAmount;

  /// The figure a screen exists to show: the amount due, the day's sales.
  final TextStyle amountHero;

  /// The currency in front of a large figure.
  final TextStyle amountCurrency;

  /// The figure typed into an amount field.
  final TextStyle amountLarge;

  /// A figure that answers a question: the change to give.
  final TextStyle amountMedium;

  DuraType lerp(DuraType other, double t) => DuraType(
    display: TextStyle.lerp(display, other.display, t)!,
    title: TextStyle.lerp(title, other.title, t)!,
    heading: TextStyle.lerp(heading, other.heading, t)!,
    body: TextStyle.lerp(body, other.body, t)!,
    bodySmall: TextStyle.lerp(bodySmall, other.bodySmall, t)!,
    label: TextStyle.lerp(label, other.label, t)!,
    strong: TextStyle.lerp(strong, other.strong, t)!,
    small: TextStyle.lerp(small, other.small, t)!,
    rowTitle: TextStyle.lerp(rowTitle, other.rowTitle, t)!,
    rowValue: TextStyle.lerp(rowValue, other.rowValue, t)!,
    caption: TextStyle.lerp(caption, other.caption, t)!,
    eyebrow: TextStyle.lerp(eyebrow, other.eyebrow, t)!,
    nav: TextStyle.lerp(nav, other.nav, t)!,
    price: TextStyle.lerp(price, other.price, t)!,
    action: TextStyle.lerp(action, other.action, t)!,
    actionAmount: TextStyle.lerp(actionAmount, other.actionAmount, t)!,
    amountHero: TextStyle.lerp(amountHero, other.amountHero, t)!,
    amountCurrency: TextStyle.lerp(amountCurrency, other.amountCurrency, t)!,
    amountLarge: TextStyle.lerp(amountLarge, other.amountLarge, t)!,
    amountMedium: TextStyle.lerp(amountMedium, other.amountMedium, t)!,
  );
}
