// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// What a notice is telling the person.
enum DuraNoticeTone {
  /// A quiet tip under a field: "No float? Leave it at zero."
  hint,

  /// Something to know before going on: "Shop total incomplete."
  warning,

  /// Something went wrong, and what to do about it.
  error,
}
