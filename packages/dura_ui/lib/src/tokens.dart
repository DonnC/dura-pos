// Maintained by the Dura POS contributors.
import 'package:flutter/material.dart';

/// Brand colours are defined here; widgets consume semantic theme colours.
abstract final class DuraPalette {
  static const evergreen = Color(0xff174c3c);
  static const grain = Color(0xffd6a64b);
}

abstract final class DuraSpacing {
  static const small = 8.0;
  static const medium = 16.0;
  static const large = 24.0;
  static const contentWidth = 560.0;
  static const minimumTapHeight = 48.0;
}

abstract final class DuraTheme {
  static ThemeData get light => _build(Brightness.light);
  static ThemeData get dark => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: DuraPalette.evergreen,
      brightness: brightness,
    ),
    inputDecorationTheme: const InputDecorationTheme(
      border: OutlineInputBorder(),
    ),
  );
}
