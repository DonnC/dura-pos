// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:io';

import 'package:image/image.dart' as image;

/// Build-time resizing only; the approved artwork remains the source of identity.
void main() {
  const sourcePath = 'apps/dura/assets/branding/launcher-source.png';
  const resourceRoot = 'apps/dura/android/app/src/main/res';
  const sizes = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
  };
  final source = image.decodePng(File(sourcePath).readAsBytesSync());
  if (source == null || source.width != source.height) {
    throw StateError('Launcher source must be a readable square PNG.');
  }
  for (final entry in sizes.entries) {
    final directory = Directory('$resourceRoot/mipmap-${entry.key}')
      ..createSync(recursive: true);
    File('${directory.path}/ic_launcher.png').writeAsBytesSync(
      image.encodePng(
        image.copyResize(
          source,
          width: entry.value,
          height: entry.value,
          interpolation: image.Interpolation.average,
        ),
      ),
    );
  }
  // Full-bleed background and inset source mark tolerate adaptive launcher masks.
  final foreground = Directory('$resourceRoot/drawable-nodpi')
    ..createSync(recursive: true);
  File('${foreground.path}/ic_launcher_foreground.png').writeAsBytesSync(
    image.encodePng(
      image.copyResize(
        source,
        width: 432,
        height: 432,
        interpolation: image.Interpolation.average,
      ),
    ),
  );
  final adaptive = Directory('$resourceRoot/mipmap-anydpi-v26')
    ..createSync(recursive: true);
  final pixel = source.getPixel(0, 0);
  final background = [
    pixel.r,
    pixel.g,
    pixel.b,
  ].map((channel) => channel.toInt().toRadixString(16).padLeft(2, '0')).join();
  File('${adaptive.path}/ic_launcher.xml').writeAsStringSync('''
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
''');
  File('$resourceRoot/values/launcher_colors.xml').writeAsStringSync('''
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="launcher_background">#$background</color>
</resources>
''');
  stdout.writeln(
    'Generated five legacy launcher sizes and adaptive resources.',
  );
}
