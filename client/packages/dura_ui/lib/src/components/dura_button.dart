// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../theme/dura_spacing.dart';

/// A consistent primary action, preserving native disabled/focus semantics.
class DuraButton extends StatelessWidget {
  const DuraButton({required this.label, this.onPressed, super.key});
  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) => SizedBox(
    width: double.infinity,
    child: FilledButton(
      style: FilledButton.styleFrom(
        minimumSize: const Size(0, DuraSpacing.minimumTapHeight),
        padding: const EdgeInsets.all(DuraSpacing.medium),
      ),
      onPressed: onPressed,
      child: Text(label, textAlign: TextAlign.center),
    ),
  );
}
