// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// How much a button asks for attention.
enum DuraButtonVariant {
  /// The one main action on a screen: sign red, full width.
  primary,

  /// Another choice: outlined.
  secondary,

  /// A link-like action: "Back", "Sell an unlisted item".
  quiet,
}
