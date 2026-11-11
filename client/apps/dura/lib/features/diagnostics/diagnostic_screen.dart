// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:async';

import 'package:dura_core/dura_core.dart';
import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/analytics_provider.dart';
import '../../app/app_copy.dart';
import '../../app/app_routes.dart';
import 'diagnostic_providers.dart';
import 'usage_recording.dart';

/// SHOP-13. The problem-report files on this phone, shared only when the
/// person confirms, and the switch for usage records.
///
/// Widget/State pair is kept together for this local asynchronous action
/// lifecycle.
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
      cancelLabel: AppCopy.cancel,
    );
    if (!approved || !mounted) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(shareArchiveProvider)(archive);
      unawaited(
        ref.read(analyticsProvider).track(AnalyticsEvents.supportShared),
      );
    } on Exception {
      if (mounted) setState(() => _error = AppCopy.shareFailed);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = context.dura;
    final files = ref.watch(diagnosticFilesProvider);
    final recording = ref.watch(usageRecordingProvider);
    return DuraPage(
      dock: DuraActionDock(
        children: [
          if (_busy) ...[
            const LinearProgressIndicator(),
            Semantics(
              liveRegion: true,
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: tokens.space.xs),
                child: Text(AppCopy.working, style: tokens.text.small),
              ),
            ),
          ],
          DuraButton(
            label: _archive == null
                ? AppCopy.prepareArchive
                : AppCopy.shareArchive,
            onPressed: _busy || !files.hasValue
                ? null
                : (_archive == null ? _prepare : _share),
          ),
        ],
      ),
      children: [
        DuraPageHeading(
          title: AppCopy.diagnostics,
          subtitle: AppCopy.diagnosticsSubtitle,
          backLabel: AppCopy.back,
          onBack: () => context.go(AppRoutes.shop),
        ),
        Text(AppCopy.localLogs, style: tokens.text.title),
        DuraNotice(
          message: AppCopy.logPolicy(ref.watch(diagnosticPolicyProvider)),
        ),
        ...files.when(
          data: (files) => files.isEmpty
              ? [const DuraNotice(message: AppCopy.emptyLogs)]
              : [
                  for (final file in files)
                    DuraListRow(
                      title: file.name,
                      subtitle: AppCopy.fileSize(file.sizeBytes),
                    ),
                ],
          loading: () => [const LinearProgressIndicator()],
          error: (error, stack) => [
            const DuraNotice.error(message: AppCopy.unavailable),
            DuraButton.secondary(
              label: AppCopy.retry,
              onPressed: () => ref.invalidate(diagnosticFilesProvider),
            ),
          ],
        ),
        if (_error case final error?) ...[
          SizedBox(height: tokens.space.sm),
          DuraNotice.error(message: error),
        ],
        SizedBox(height: tokens.space.md),
        DuraToggleRow(
          title: AppCopy.usageRecording,
          subtitle: AppCopy.usageRecordingDetail,
          value: recording,
          onChanged: (on) =>
              unawaited(ref.read(usageRecordingProvider.notifier).set(on: on)),
        ),
      ],
    );
  }
}
