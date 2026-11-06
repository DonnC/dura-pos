// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// Non-secret local preferences. Credentials require a separate secure store.
abstract interface class PreferenceStore {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
}
