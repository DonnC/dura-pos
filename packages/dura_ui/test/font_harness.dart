// Maintained by the Dura POS contributors.
import 'dart:io';

import 'package:flutter/services.dart';

/// Pinned test-only fonts make text readable without depending on host fonts.
Future<void> loadGoldenFonts() async {
  final loader = FontLoader('Roboto');
  for (final name in ['Roboto-Regular.ttf', 'Roboto-Medium.ttf']) {
    final bytes = await File('test/fonts/$name').readAsBytes();
    loader.addFont(Future.value(ByteData.sublistView(bytes)));
  }
  await loader.load();
}
