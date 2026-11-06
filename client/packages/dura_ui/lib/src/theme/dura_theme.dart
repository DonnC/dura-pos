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
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: DuraPalette.evergreen,
        brightness: brightness,
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
