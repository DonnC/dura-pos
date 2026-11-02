// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:async';
import 'dart:io';

import 'package:dura_core/dura_core.dart';
import 'package:dura_data/dura_data.dart';
import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../features/diagnostics/diagnostic_providers.dart';
import 'app_copy.dart';
import 'app_storage.dart';
import 'dura_app.dart';

Future<void> bootstrap({
  DiagnosticPolicy diagnosticPolicy = const DiagnosticPolicy.fromEnvironment(),
}) async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    diagnosticPolicy.validate();
    await DuraTheme.prepareFonts();
    final support = await getApplicationSupportDirectory();
    final logs = RotatingDiagnostics(
      Directory('${support.path}/${DiagnosticPolicy.logDirectory}'),
      policy: diagnosticPolicy,
    );
    final database = LocalDatabase.open(
      File('${support.path}/${AppStorage.databaseFile}'),
    );
    try {
      await SqlitePreferences(database).read(AppStorage.themeKey);
    } finally {
      // This bootstrap probe owns its connection; features will own theirs.
      await database.close();
    }
    await logs.record('app.started');
    runApp(
      ProviderScope(
        overrides: [
          diagnosticStoreProvider.overrideWith((ref) {
            ref.onDispose(
              () => unawaited(
                logs.close().catchError((Object _, StackTrace _) {}),
              ),
            );
            return logs;
          }),
          diagnosticPolicyProvider.overrideWithValue(diagnosticPolicy),
          shareArchiveProvider.overrideWithValue((archive) async {
            await SharePlus.instance.share(
              ShareParams(files: [XFile(archive)], title: AppCopy.diagnostics),
            );
          }),
        ],
        child: const DuraApp(),
      ),
    );
  } on Object {
    runApp(
      const MaterialApp(
        home: Scaffold(
          body: SafeArea(
            child: Center(
              child: Padding(
                padding: EdgeInsets.all(DuraSpacing.large),
                child: Text(AppCopy.startupFailed),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
