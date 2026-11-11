// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import 'dura_colors.dart';
import 'dura_palette.dart';
import 'dura_tokens.dart';
import 'dura_type.dart';

/// Shared typography is bundled, so first launch never needs a font download.
///
/// Dura components read [DuraTokens] from this theme. The Material parts are
/// set too, so a dialog, sheet or text cursor matches without extra styling.
abstract final class DuraTheme {
  static const fontFamily = 'Roboto';
  static bool _licenceRegistered = false;
  static final light = _build(Brightness.light);
  static final dark = _build(Brightness.dark);

  static Future<void> prepareFonts() async {
    if (!_licenceRegistered) {
      LicenseRegistry.addLicense(() async* {
        final licence = await rootBundle.loadString(
          'packages/dura_ui/assets/fonts/LICENSE.txt',
        );
        yield LicenseEntryWithLineBreaks([fontFamily], licence);
      });
      _licenceRegistered = true;
    }
    await GoogleFonts.pendingFonts([light.textTheme, dark.textTheme]);
  }

  static ThemeData _build(Brightness brightness) {
    GoogleFonts.config.allowRuntimeFetching = false;
    final dark = brightness == Brightness.dark;
    final colors = dark ? DuraColors.dark : DuraColors.light;
    final tokens = DuraTokens(
      colors: colors,
      text: DuraType.of(fontFamily, colors.ink),
    );
    final scheme = _scheme(brightness, colors);
    final base = ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: colors.paper,
      canvasColor: colors.paper,
      dividerColor: colors.line,
      focusColor: colors.soft,
      hoverColor: colors.soft,
      highlightColor: DuraPalette.transparent,
      // A plain ripple: the sparkle shader costs more on cheap phones.
      splashFactory: InkRipple.splashFactory,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      visualDensity: VisualDensity.standard,
      extensions: [tokens],
      appBarTheme: AppBarTheme(
        backgroundColor: colors.chrome,
        foregroundColor: colors.ink,
        surfaceTintColor: DuraPalette.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: colors.brand,
          foregroundColor: colors.onBrand,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.all(tokens.radii.medium),
          borderSide: BorderSide(color: colors.line),
        ),
      ),
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: colors.actionInk,
        selectionColor: scheme.primaryContainer,
        selectionHandleColor: colors.brand,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: colors.paper,
        surfaceTintColor: DuraPalette.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(tokens.radii.sheet),
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: colors.paper,
        surfaceTintColor: DuraPalette.transparent,
        modalBarrierColor: colors.scrim,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: tokens.radii.sheet),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: colors.ink,
        contentTextStyle: tokens.text.label.copyWith(color: colors.paper),
        actionTextColor: dark ? DuraPalette.signRed : DuraPalette.darkAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(tokens.radii.small),
        ),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: colors.brand,
        linearTrackColor: colors.soft,
      ),
    );
    final text = tokens.text;
    return base.copyWith(
      textTheme: GoogleFonts.getTextTheme(fontFamily, base.textTheme).copyWith(
        headlineSmall: text.title,
        titleLarge: text.title,
        titleMedium: text.heading,
        bodyLarge: text.body,
        bodyMedium: text.body,
        bodySmall: text.bodySmall,
        labelLarge: text.label,
        labelMedium: text.label,
        labelSmall: text.caption,
      ),
      primaryTextTheme: GoogleFonts.getTextTheme(
        fontFamily,
        base.primaryTextTheme,
      ),
    );
  }

  static ColorScheme _scheme(Brightness brightness, DuraColors colors) {
    final dark = brightness == Brightness.dark;
    return ColorScheme.fromSeed(
      seedColor: DuraPalette.signRed,
      brightness: brightness,
    ).copyWith(
      primary: dark ? DuraPalette.darkAccent : DuraPalette.signRed,
      onPrimary: dark ? DuraPalette.ink : DuraPalette.paper,
      primaryContainer: dark
          ? DuraPalette.darkAccentContainer
          : DuraPalette.accentContainer,
      onPrimaryContainer: dark
          ? DuraPalette.chalk
          : DuraPalette.onAccentContainer,
      secondary: colors.ink,
      onSecondary: colors.paper,
      secondaryContainer: colors.soft,
      onSecondaryContainer: colors.ink,
      tertiary: colors.ink,
      onTertiary: colors.paper,
      tertiaryContainer: colors.soft,
      onTertiaryContainer: colors.ink,
      surface: colors.paper,
      onSurface: colors.ink,
      surfaceDim: colors.soft,
      surfaceBright: colors.chrome,
      surfaceContainerLowest: colors.paper,
      surfaceContainerLow: colors.chrome,
      surfaceContainer: colors.chrome,
      surfaceContainerHigh: colors.soft,
      surfaceContainerHighest: colors.soft,
      onSurfaceVariant: colors.muted,
      outline: dark ? DuraPalette.darkOutline : DuraPalette.outline,
      outlineVariant: colors.line,
      inverseSurface: dark ? DuraPalette.chalk : DuraPalette.ink,
      onInverseSurface: dark ? DuraPalette.ink : DuraPalette.chalk,
      inversePrimary: dark ? DuraPalette.signRed : DuraPalette.darkAccent,
      surfaceTint: DuraPalette.transparent,
      error: colors.error,
      onError: dark ? DuraPalette.onErrorContainer : DuraPalette.paper,
      errorContainer: colors.errorContainer,
      onErrorContainer: colors.onErrorContainer,
    );
  }
}
