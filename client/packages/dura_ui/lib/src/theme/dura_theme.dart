// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import 'dura_palette.dart';

/// Shared typography is bundled, so first launch never needs a font download.
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
    final surface = dark ? DuraPalette.darkSurface : DuraPalette.paper;
    final chrome = dark ? DuraPalette.ink : DuraPalette.chalk;
    final ink = dark ? DuraPalette.chalk : DuraPalette.ink;
    final soft = dark ? DuraPalette.darkSoft : DuraPalette.soft;
    final scheme =
        ColorScheme.fromSeed(
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
          secondary: ink,
          onSecondary: surface,
          secondaryContainer: soft,
          onSecondaryContainer: ink,
          tertiary: ink,
          onTertiary: surface,
          tertiaryContainer: soft,
          onTertiaryContainer: ink,
          surface: surface,
          onSurface: ink,
          surfaceDim: soft,
          surfaceBright: chrome,
          surfaceContainerLowest: surface,
          surfaceContainerLow: chrome,
          surfaceContainer: chrome,
          surfaceContainerHigh: soft,
          surfaceContainerHighest: soft,
          onSurfaceVariant: dark ? DuraPalette.darkMuted : DuraPalette.muted,
          outline: dark ? DuraPalette.darkOutline : DuraPalette.outline,
          outlineVariant: dark ? DuraPalette.darkLine : DuraPalette.line,
          inverseSurface: dark ? DuraPalette.chalk : DuraPalette.ink,
          onInverseSurface: dark ? DuraPalette.ink : DuraPalette.chalk,
          inversePrimary: dark ? DuraPalette.signRed : DuraPalette.darkAccent,
          surfaceTint: DuraPalette.transparent,
          error: dark ? DuraPalette.darkError : DuraPalette.error,
          onError: dark ? DuraPalette.onErrorContainer : DuraPalette.paper,
          errorContainer: dark
              ? DuraPalette.darkErrorContainer
              : DuraPalette.errorContainer,
          onErrorContainer: dark
              ? DuraPalette.errorContainer
              : DuraPalette.onErrorContainer,
        );
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: surface,
      appBarTheme: AppBarTheme(
        backgroundColor: chrome,
        foregroundColor: ink,
        surfaceTintColor: DuraPalette.transparent,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: DuraPalette.signRed,
          foregroundColor: DuraPalette.paper,
        ),
      ),
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(),
      ),
    );
    return base.copyWith(
      textTheme: GoogleFonts.getTextTheme(fontFamily, base.textTheme),
      primaryTextTheme: GoogleFonts.getTextTheme(
        fontFamily,
        base.primaryTextTheme,
      ),
    );
  }
}
