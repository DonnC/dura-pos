// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/widgets.dart';

import 'dura_palette.dart';

/// What each colour is for. Widgets read these, never the palette.
@immutable
final class DuraColors {
  const DuraColors({
    required this.brand,
    required this.onBrand,
    required this.actionInk,
    required this.onActionInk,
    required this.focus,
    required this.ink,
    required this.muted,
    required this.paper,
    required this.chrome,
    required this.line,
    required this.soft,
    required this.warn,
    required this.warnInk,
    required this.error,
    required this.errorContainer,
    required this.onErrorContainer,
    required this.summary,
    required this.onSummary,
    required this.summaryMuted,
    required this.scrim,
  });

  static const light = DuraColors(
    brand: DuraPalette.signRed,
    onBrand: DuraPalette.paper,
    actionInk: DuraPalette.ink,
    onActionInk: DuraPalette.paper,
    focus: DuraPalette.signRed,
    ink: DuraPalette.ink,
    muted: DuraPalette.muted,
    paper: DuraPalette.paper,
    chrome: DuraPalette.chalk,
    line: DuraPalette.line,
    soft: DuraPalette.soft,
    warn: DuraPalette.warn,
    warnInk: DuraPalette.warnInk,
    error: DuraPalette.error,
    errorContainer: DuraPalette.errorContainer,
    onErrorContainer: DuraPalette.onErrorContainer,
    summary: DuraPalette.ink,
    onSummary: DuraPalette.paper,
    summaryMuted: DuraPalette.summaryMuted,
    scrim: DuraPalette.scrim,
  );

  static const dark = DuraColors(
    brand: DuraPalette.signRed,
    onBrand: DuraPalette.paper,
    actionInk: DuraPalette.chalk,
    onActionInk: DuraPalette.ink,
    focus: DuraPalette.darkAccent,
    ink: DuraPalette.chalk,
    muted: DuraPalette.darkMuted,
    paper: DuraPalette.darkSurface,
    chrome: DuraPalette.ink,
    line: DuraPalette.darkLine,
    soft: DuraPalette.darkSoft,
    warn: DuraPalette.darkWarn,
    warnInk: DuraPalette.darkWarnInk,
    error: DuraPalette.darkError,
    errorContainer: DuraPalette.darkErrorContainer,
    onErrorContainer: DuraPalette.errorContainer,
    // One step lighter than the page, so the summary still reads as a card.
    summary: DuraPalette.darkSoft,
    onSummary: DuraPalette.chalk,
    summaryMuted: DuraPalette.darkMuted,
    scrim: DuraPalette.scrim,
  );

  /// The main action and the current selection.
  final Color brand;
  final Color onBrand;

  /// Secondary actions, links and the selected chip.
  final Color actionInk;
  final Color onActionInk;

  /// The keyboard focus ring.
  final Color focus;
  final Color ink;
  final Color muted;

  /// Work surfaces.
  final Color paper;

  /// The header band behind the shop name and status.
  final Color chrome;
  final Color line;
  final Color soft;
  final Color warn;
  final Color warnInk;
  final Color error;
  final Color errorContainer;
  final Color onErrorContainer;

  /// The dark summary card that holds the day's main figure.
  final Color summary;
  final Color onSummary;
  final Color summaryMuted;
  final Color scrim;

  DuraColors lerp(DuraColors other, double t) => DuraColors(
    brand: Color.lerp(brand, other.brand, t)!,
    onBrand: Color.lerp(onBrand, other.onBrand, t)!,
    actionInk: Color.lerp(actionInk, other.actionInk, t)!,
    onActionInk: Color.lerp(onActionInk, other.onActionInk, t)!,
    focus: Color.lerp(focus, other.focus, t)!,
    ink: Color.lerp(ink, other.ink, t)!,
    muted: Color.lerp(muted, other.muted, t)!,
    paper: Color.lerp(paper, other.paper, t)!,
    chrome: Color.lerp(chrome, other.chrome, t)!,
    line: Color.lerp(line, other.line, t)!,
    soft: Color.lerp(soft, other.soft, t)!,
    warn: Color.lerp(warn, other.warn, t)!,
    warnInk: Color.lerp(warnInk, other.warnInk, t)!,
    error: Color.lerp(error, other.error, t)!,
    errorContainer: Color.lerp(errorContainer, other.errorContainer, t)!,
    onErrorContainer: Color.lerp(onErrorContainer, other.onErrorContainer, t)!,
    summary: Color.lerp(summary, other.summary, t)!,
    onSummary: Color.lerp(onSummary, other.onSummary, t)!,
    summaryMuted: Color.lerp(summaryMuted, other.summaryMuted, t)!,
    scrim: Color.lerp(scrim, other.scrim, t)!,
  );
}
