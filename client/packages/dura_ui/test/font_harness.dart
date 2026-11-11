// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

/// Compare the same bundled Google Fonts typography that the app renders,
/// and real icons instead of the test font's boxes.
Future<void> loadGoldenFonts() async {
  await DuraTheme.prepareFonts();
  final icons = FontLoader('MaterialIcons')
    ..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'));
  await icons.load();
}

/// A screen at [size] logical pixels, in [brightness], at [textScale].
Widget duraHarness(
  Widget child, {
  Brightness brightness = Brightness.light,
  double textScale = 1,
  bool scaffold = true,
}) => MaterialApp(
  debugShowCheckedModeBanner: false,
  theme: (brightness == Brightness.light ? DuraTheme.light : DuraTheme.dark)
      .copyWith(platform: TargetPlatform.android),
  builder: (context, app) => MediaQuery(
    data: MediaQuery.of(context)
        .copyWith(textScaler: TextScaler.linear(textScale)),
    child: app!,
  ),
  home: scaffold ? Scaffold(body: child) : child,
);

/// Sets the test window to [size] at one pixel per logical pixel.
void setSurface(WidgetTester tester, Size size) {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
}
