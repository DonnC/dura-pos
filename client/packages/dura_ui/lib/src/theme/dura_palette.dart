// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

/// Brand colours are defined here; widgets consume semantic theme colours.
abstract final class DuraPalette {
  static const transparent = Color(0x00000000);
  static const ink = Color(0xff252525);
  static const chalk = Color(0xfff4f0e8);
  static const signRed = Color(0xffc3452d);
  static const paper = Color(0xffffffff);
  static const muted = Color(0xff615b55);
  static const soft = Color(0xffede7df);
  static const line = Color(0xffd9d1c8);
  static const outline = Color(0xff80756a);
  static const accentContainer = Color(0xfff9ddd6);
  static const onAccentContainer = Color(0xff512016);
  static const error = Color(0xff9d2440);
  static const errorContainer = Color(0xffffe1e8);
  static const onErrorContainer = Color(0xff410018);

  static const darkSurface = Color(0xff1e1d1b);
  static const darkSoft = Color(0xff302d29);
  static const darkLine = Color(0xff524b43);
  static const darkOutline = Color(0xffa99f94);
  static const darkMuted = Color(0xffc9bfb4);
  static const darkAccent = Color(0xfff2a18e);
  static const darkAccentContainer = Color(0xff5a251b);
  static const darkError = Color(0xffffb3c5);
  static const darkErrorContainer = Color(0xff5d102b);
}
