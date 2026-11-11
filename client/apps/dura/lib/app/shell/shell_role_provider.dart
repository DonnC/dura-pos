// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'shell_role.dart';

/// The owner, until people and PINs arrive in phase 4.
final shellRoleProvider = Provider<ShellRole>((ref) => ShellRole.owner);
