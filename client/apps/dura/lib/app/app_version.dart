// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// The product version, for problem reports and usage records.
///
/// `melos run check` keeps both values equal to `release.json`.
abstract final class AppVersion {
  static const version = '0.1.0-dev.2';
  static const build = 2;
}
