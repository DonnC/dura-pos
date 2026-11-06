// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

/// Shared field styling; validation remains with the owning feature.
class DuraTextField extends StatelessWidget {
  const DuraTextField({
    required this.label,
    this.controller,
    this.errorText,
    this.onChanged,
    super.key,
  });
  final String label;
  final TextEditingController? controller;
  final String? errorText;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    onChanged: onChanged,
    decoration: InputDecoration(labelText: label, errorText: errorText),
  );
}
