// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_core/dura_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// This phone's settings. Supplied by bootstrap, which owns the database.
final preferenceStoreProvider = Provider<PreferenceStore>(
  (ref) => throw StateError('Preferences must be supplied at bootstrap.'),
);
