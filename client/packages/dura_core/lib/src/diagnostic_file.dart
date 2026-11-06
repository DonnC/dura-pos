// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// Safe metadata for the preview shown before a support archive is shared.
final class DiagnosticFile {
  const DiagnosticFile({required this.name, required this.sizeBytes});
  final String name;
  final int sizeBytes;
}
