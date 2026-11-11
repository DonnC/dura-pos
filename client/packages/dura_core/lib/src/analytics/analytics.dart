// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// Records how the app is used: screens opened, main actions taken, how long
/// they took, and what went wrong. Never shop data: the journal already holds
/// sales and money, and analytics must not copy them.
///
/// Use names from `AnalyticsEvents` and `AnalyticsFields`. A call never
/// throws and never blocks the screen; a record that can't be written is lost.
abstract interface class Analytics {
  Future<void> track(String event, {Map<String, Object?> fields = const {}});
}
