// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// Where an upload run stopped. None of these stops a sale.
enum UploadState {
  /// Everything waiting has been stored.
  allSent,

  /// The backend couldn't be reached or was busy. Try again later.
  tryLater,

  /// The owner or support needs to look: sending again won't help.
  needsAttention,
}
