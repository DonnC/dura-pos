// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'upload_state.dart';

/// What one upload run achieved.
final class UploadResult {
  const UploadResult(this.state, this.uploaded, [this.code]);

  final UploadState state;

  /// Batches confirmed stored during this run.
  final int uploaded;

  /// The reason, when the run stopped early.
  final String? code;
}
