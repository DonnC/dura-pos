// Maintained by the Dura POS contributors.
import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/app_copy.dart';
import 'diagnostic_providers.dart';

class DiagnosticScreen extends ConsumerStatefulWidget {
  const DiagnosticScreen({super.key});

  @override
  ConsumerState<DiagnosticScreen> createState() => _DiagnosticScreenState();
}

class _DiagnosticScreenState extends ConsumerState<DiagnosticScreen> {
  String? _archive;
  String? _error;
  bool _busy = false;

  Future<void> _prepare() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final path = await ref.read(diagnosticStoreProvider).createArchive();
      if (mounted) setState(() => _archive = path);
    } on Exception {
      if (mounted) setState(() => _error = AppCopy.archiveFailed);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _share() async {
    final archive = _archive;
    if (archive == null) return;
    final approved = await showDuraConfirmation(
      context,
      title: AppCopy.shareTitle,
      message: AppCopy.shareWarning,
      confirmLabel: AppCopy.share,
    );
    if (!approved || !mounted) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(shareArchiveProvider)(archive);
    } on Exception {
      if (mounted) setState(() => _error = AppCopy.shareFailed);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final files = ref.watch(diagnosticFilesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text(AppCopy.diagnostics)),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(
              maxWidth: DuraSpacing.contentWidth,
            ),
            child: ListView(
              padding: const EdgeInsets.all(DuraSpacing.large),
              children: [
                Text(
                  AppCopy.localLogs,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: DuraSpacing.medium),
                const Text(AppCopy.logPolicy),
                const SizedBox(height: DuraSpacing.large),
                ...files.when(
                  data: (files) => files.isEmpty
                      ? [const Text(AppCopy.emptyLogs)]
                      : files
                            .map(
                              (file) => ListTile(
                                contentPadding: EdgeInsets.zero,
                                title: Text(file.name),
                                subtitle: Text('${file.sizeBytes} bytes'),
                              ),
                            )
                            .toList(),
                  loading: () => [const LinearProgressIndicator()],
                  error: (error, stack) => [
                    const Text(AppCopy.unavailable),
                    TextButton(
                      onPressed: () => ref.invalidate(diagnosticFilesProvider),
                      child: const Text(AppCopy.retry),
                    ),
                  ],
                ),
                const SizedBox(height: DuraSpacing.large),
                if (_error case final error?)
                  Text(
                    error,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                DuraButton(
                  label: _archive == null
                      ? AppCopy.prepareArchive
                      : AppCopy.shareArchive,
                  onPressed: _busy || !files.hasValue
                      ? null
                      : (_archive == null ? _prepare : _share),
                ),
                if (_busy) ...[
                  const SizedBox(height: DuraSpacing.medium),
                  const LinearProgressIndicator(),
                  Semantics(
                    liveRegion: true,
                    child: const Text(AppCopy.working),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
