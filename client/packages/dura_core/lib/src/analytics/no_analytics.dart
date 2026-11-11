// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'analytics.dart';

/// Records nothing: for tests, and for builds or places with no recorder.
final class NoAnalytics implements Analytics {
  const NoAnalytics();

  @override
  Future<void> track(
    String event, {
    Map<String, Object?> fields = const {},
  }) async {}
}
