// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/dura_context.dart';
import 'dura_field_decoration.dart';
import 'dura_labelled.dart';

/// Dura's text field: Flutter's own text editing, keyboard, selection and
/// autofill, in Dura's frame. Validation stays with the feature that owns it.
///
/// The caller owns [controller] and [focusNode], and disposes them.
class DuraTextField extends StatelessWidget {
  const DuraTextField({
    required this.label,
    this.controller,
    this.hint,
    this.errorText,
    this.onChanged,
    this.onSubmitted,
    this.keyboardType,
    this.textInputAction,
    this.inputFormatters,
    this.focusNode,
    this.autofillHints,
    this.enabled = true,
    super.key,
  });

  final String label;
  final TextEditingController? controller;

  /// An example of what to type: "e.g. Chipo's corner shop".
  final String? hint;
  final String? errorText;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final List<TextInputFormatter>? inputFormatters;
  final FocusNode? focusNode;
  final Iterable<String>? autofillHints;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    return DuraLabelled(
      label: label,
      errorText: errorText,
      child: ConstrainedBox(
        constraints: BoxConstraints(minHeight: tokens.sizes.field),
        child: TextField(
          controller: controller,
          focusNode: focusNode,
          onChanged: onChanged,
          onSubmitted: onSubmitted,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          inputFormatters: inputFormatters,
          autofillHints: autofillHints,
          enabled: enabled,
          style: tokens.text.body,
          decoration: duraFieldDecoration(
            tokens,
            hint: hint,
            invalid: errorText != null,
          ),
        ),
      ),
    );
  }
}
