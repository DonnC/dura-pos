// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// One stack frame, as a problem report keeps it:
/// `SellScreen.build (dura_pos/features/sell/sell_screen.dart:42)`.
final safeFramePattern = RegExp(
  r'^[A-Za-z0-9_.<>$ ]{1,96} \([A-Za-z0-9_]+/[A-Za-z0-9_/.]+\.dart:\d+\)$',
);

final _dartFrame = RegExp(
  r'^#\d+\s+(.+?)\s+\(package:([A-Za-z0-9_]+/[A-Za-z0-9_/.]+\.dart):(\d+)'
  r'(?::\d+)?\)$',
);

/// The frames of [stack] that point into package code, newest first.
///
/// A frame keeps only the function's name and the package path and line,
/// which are code, never shop data. Error messages, device paths (`file:`)
/// and the SDK's own `dart:` frames are dropped. Release builds made with
/// `--split-debug-info` have no symbols, and give an empty list.
List<String> safeFrames(StackTrace stack, {int limit = 12}) {
  final frames = <String>[];
  for (final line in stack.toString().split('\n')) {
    final match = _dartFrame.firstMatch(line.trim());
    if (match == null) continue;
    final frame = '${match.group(1)} (${match.group(2)}:${match.group(3)})';
    if (!safeFramePattern.hasMatch(frame)) continue;
    frames.add(frame);
    if (frames.length == limit) break;
  }
  return frames;
}
