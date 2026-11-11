// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// How prominent an amount is.
enum DuraAmountSize {
  /// The figure a screen exists to show: the amount due, the day's sales.
  hero,

  /// A figure that answers a question: the change to give.
  medium,

  /// A price in a tile or row.
  inline,
}
