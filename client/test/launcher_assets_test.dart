// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:io';

import 'package:image/image.dart' as image;
import 'package:test/test.dart';

const resources = 'apps/dura/android/app/src/main/res';

image.Image png(String relative) =>
    image.decodePng(File('$resources/$relative').readAsBytesSync())!;

void main() {
  test('legacy launchers carry the approved red at every density', () {
    for (final entry in {
      'mdpi': 48,
      'hdpi': 72,
      'xhdpi': 96,
      'xxhdpi': 144,
      'xxxhdpi': 192,
    }.entries) {
      final icon = png('mipmap-${entry.key}/ic_launcher.png');
      expect((icon.width, icon.height), (entry.value, entry.value));
      final corner = icon.getPixel(0, 0);
      // Area resampling can round a constant channel down by one level.
      expect(corner.r, closeTo(195, 1));
      expect(corner.g, closeTo(69, 1));
      expect(corner.b, closeTo(45, 1));
    }
  });

  test('adaptive artwork is transparent and fits the 66dp safe circle', () {
    final foreground = png('drawable-nodpi/ic_launcher_foreground.png');
    expect(foreground.numChannels, 4);
    expect(foreground.getPixel(0, 0).a, 0);
    final radius = foreground.width * 33 / 108;
    var visible = 0;
    for (final pixel in foreground) {
      if (pixel.a <= 8) continue;
      visible++;
      final x = pixel.x + 0.5 - foreground.width / 2;
      final y = pixel.y + 0.5 - foreground.height / 2;
      expect(x * x + y * y, lessThanOrEqualTo(radius * radius));
    }
    expect(visible, greaterThan(foreground.width * foreground.height * 0.05));
    final adaptive = File('$resources/mipmap-anydpi-v26/ic_launcher.xml')
        .readAsStringSync();
    expect(adaptive, contains('<monochrome'));
    expect(
      File('$resources/values/splash_colors.xml').readAsStringSync(),
      contains('#c3452d'),
    );
    expect(png('drawable-nodpi/splash_logo.png').getPixel(0, 0).a, 0);
  });
}
