// Maintained by the Dura POS contributors.
import 'package:flutter/material.dart';

import 'tokens.dart';

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

/// Confirmation returns a decision; the caller owns the authorised operation.
Future<bool> showDuraConfirmation(
  BuildContext context, {
  required String title,
  required String message,
  required String confirmLabel,
}) async =>
    await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(confirmLabel),
          ),
        ],
      ),
    ) ??
    false;
