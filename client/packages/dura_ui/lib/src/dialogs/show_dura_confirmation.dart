// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../components/dura_button.dart';
import '../theme/dura_context.dart';

/// Confirmation returns a decision; the caller owns the authorised operation.
///
/// Keep these for money leaving the shop and for sharing private files. For
/// anything that can be undone, offer Undo instead of asking first.
Future<bool> showDuraConfirmation(
  BuildContext context, {
  required String title,
  required String message,
  required String confirmLabel,
  required String cancelLabel,
}) async =>
    await showDialog<bool>(
      context: context,
      builder: (context) {
        final tokens = context.dura;
        return AlertDialog(
          title: Text(title, style: tokens.text.title),
          content: Text(message, style: tokens.text.body),
          actionsOverflowButtonSpacing: tokens.space.xs,
          actions: [
            DuraButton.quiet(
              label: cancelLabel,
              onPressed: () => Navigator.of(context).pop(false),
            ),
            DuraButton(
              label: confirmLabel,
              expand: false,
              onPressed: () => Navigator.of(context).pop(true),
            ),
          ],
        );
      },
    ) ??
    false;
