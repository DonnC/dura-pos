// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_pos/features/support/report_issue.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/report_diagnostic_store.dart';

void main() {
  test(
    'owner report automatically prepares and attaches diagnostics',
    () async {
      final store = ReportDiagnosticStore();
      final attachments = <String>[];
      await reportIssue(
        diagnostics: store,
        submit: (path) async {
          expect(store.archives, 1);
          attachments.add(path);
        },
      );
      expect(attachments, [ReportDiagnosticStore.archivePath]);
    },
  );

  test('archive failure does not silently send an incomplete report', () async {
    var submissions = 0;
    await expectLater(
      reportIssue(
        diagnostics: ReportDiagnosticStore()..failArchive = true,
        submit: (_) async => submissions++,
      ),
      throwsStateError,
    );
    expect(submissions, 0);
  });

  test(
    'transport failure remains a failure for the screen to recover',
    () async {
      await expectLater(
        reportIssue(
          diagnostics: ReportDiagnosticStore(),
          submit: (_) async => throw StateError('offline'),
        ),
        throwsStateError,
      );
    },
  );
}
