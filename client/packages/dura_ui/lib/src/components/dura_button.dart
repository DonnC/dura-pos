// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:flutter/material.dart';

import '../theme/dura_context.dart';
import '../theme/dura_tokens.dart';
import 'dura_button_variant.dart';

/// Dura's button. It wraps Flutter's own buttons, so focus, disabled state
/// and screen-reader behaviour stay native, and only the look is Dura's.
///
/// A disabled button (no [onPressed]) can't run, and says so to screen
/// readers. Give the reason it's disabled in the text near it.
class DuraButton extends StatelessWidget {
  /// The screen's one main action. [trailing] shows a total on the right,
  /// such as `USD 3.50`; without it, an arrow points onward.
  const DuraButton({
    required this.label,
    this.onPressed,
    this.trailing,
    this.icon,
    this.expand = true,
    super.key,
  }) : variant = DuraButtonVariant.primary;

  const DuraButton.secondary({
    required this.label,
    this.onPressed,
    this.icon,
    this.expand = false,
    super.key,
  }) : variant = DuraButtonVariant.secondary,
       trailing = null;

  const DuraButton.quiet({
    required this.label,
    this.onPressed,
    this.icon,
    this.expand = false,
    super.key,
  }) : variant = DuraButtonVariant.quiet,
       trailing = null;

  final String label;
  final VoidCallback? onPressed;
  final DuraButtonVariant variant;
  final String? trailing;
  final IconData? icon;

  /// Fill the available width.
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    final button = switch (variant) {
      DuraButtonVariant.primary => FilledButton(
        style: _primaryStyle(tokens),
        onPressed: onPressed,
        child: _primaryContent(tokens),
      ),
      DuraButtonVariant.secondary => OutlinedButton(
        style: _secondaryStyle(tokens),
        onPressed: onPressed,
        child: _content(tokens),
      ),
      DuraButtonVariant.quiet => TextButton(
        style: _quietStyle(tokens),
        onPressed: onPressed,
        child: _content(tokens),
      ),
    };
    return expand ? SizedBox(width: double.infinity, child: button) : button;
  }

  Widget _content(DuraTokens tokens) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      if (icon != null) ...[
        Icon(icon, size: tokens.sizes.smallIcon),
        SizedBox(width: tokens.space.xs),
      ],
      Flexible(child: Text(label, textAlign: TextAlign.center)),
    ],
  );

  /// The words on the left and the total or arrow on the right. When large
  /// text leaves no room for both, the total moves to its own line rather
  /// than breaking a word.
  Widget _primaryContent(DuraTokens tokens) {
    final words = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[
          Icon(icon, size: tokens.sizes.smallIcon),
          SizedBox(width: tokens.space.xs),
        ],
        Flexible(child: Text(label)),
      ],
    );
    final end = trailing == null
        ? ExcludeSemantics(
            child: Icon(Icons.arrow_forward, size: tokens.sizes.smallIcon),
          )
        : Text(
            trailing!,
            style: tokens.text.actionAmount.copyWith(
              color: tokens.colors.onBrand,
            ),
          );
    if (!expand) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Flexible(child: words),
          SizedBox(width: tokens.space.sm),
          end,
        ],
      );
    }
    return SizedBox(
      width: double.infinity,
      child: Wrap(
        alignment: WrapAlignment.spaceBetween,
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: tokens.space.sm,
        runSpacing: tokens.space.xxs,
        children: [words, end],
      ),
    );
  }

  WidgetStateProperty<BorderSide?> _focusRing(DuraTokens tokens, Color rest) =>
      WidgetStateProperty.resolveWith(
        (states) => states.contains(WidgetState.focused)
            ? BorderSide(
                color: tokens.colors.focus,
                width: tokens.sizes.focusRing,
              )
            : BorderSide(color: rest),
      );

  ButtonStyle _primaryStyle(DuraTokens tokens) {
    final colors = tokens.colors;
    return ButtonStyle(
      backgroundColor: WidgetStateProperty.resolveWith(
        (states) => states.contains(WidgetState.disabled)
            ? colors.brand.withValues(alpha: 0.5)
            : colors.brand,
      ),
      foregroundColor: WidgetStatePropertyAll(colors.onBrand),
      overlayColor: WidgetStatePropertyAll(
        colors.onBrand.withValues(alpha: 0.12),
      ),
      textStyle: WidgetStatePropertyAll(tokens.text.action),
      minimumSize: WidgetStatePropertyAll(Size(0, tokens.sizes.mainAction)),
      padding: WidgetStatePropertyAll(
        EdgeInsets.symmetric(
          horizontal: tokens.space.md,
          vertical: tokens.space.sm,
        ),
      ),
      shape: WidgetStatePropertyAll(
        RoundedRectangleBorder(
          borderRadius: BorderRadius.all(tokens.radii.medium),
        ),
      ),
      side: _focusRing(tokens, colors.brand.withValues(alpha: 0)),
      elevation: const WidgetStatePropertyAll(0),
      alignment: Alignment.centerLeft,
    );
  }

  ButtonStyle _secondaryStyle(DuraTokens tokens) {
    final colors = tokens.colors;
    return ButtonStyle(
      foregroundColor: WidgetStateProperty.resolveWith(
        (states) => states.contains(WidgetState.disabled)
            ? colors.actionInk.withValues(alpha: 0.5)
            : colors.actionInk,
      ),
      overlayColor: WidgetStatePropertyAll(colors.soft),
      textStyle: WidgetStatePropertyAll(tokens.text.label),
      minimumSize: WidgetStatePropertyAll(Size(0, tokens.sizes.tap)),
      padding: WidgetStatePropertyAll(
        EdgeInsets.symmetric(
          horizontal: tokens.space.md,
          vertical: tokens.space.sm,
        ),
      ),
      shape: WidgetStatePropertyAll(
        RoundedRectangleBorder(
          borderRadius: BorderRadius.all(tokens.radii.medium),
        ),
      ),
      side: _focusRing(tokens, colors.line),
    );
  }

  ButtonStyle _quietStyle(DuraTokens tokens) {
    final colors = tokens.colors;
    return ButtonStyle(
      foregroundColor: WidgetStateProperty.resolveWith(
        (states) => states.contains(WidgetState.disabled)
            ? colors.actionInk.withValues(alpha: 0.5)
            : colors.actionInk,
      ),
      overlayColor: WidgetStatePropertyAll(colors.soft),
      textStyle: WidgetStatePropertyAll(tokens.text.label),
      minimumSize: WidgetStatePropertyAll(
        Size(tokens.sizes.tap, tokens.sizes.tap),
      ),
      padding: WidgetStatePropertyAll(
        EdgeInsets.symmetric(horizontal: tokens.space.xs),
      ),
      shape: WidgetStatePropertyAll(
        RoundedRectangleBorder(
          borderRadius: BorderRadius.all(tokens.radii.medium),
        ),
      ),
      side: _focusRing(tokens, colors.paper.withValues(alpha: 0)),
    );
  }
}
