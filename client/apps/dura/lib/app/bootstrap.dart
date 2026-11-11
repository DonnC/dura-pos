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
import '../features/diagnostics/usage_recording.dart';
import 'analytics_provider.dart';
import 'app_copy.dart';
import 'app_storage.dart';
import 'app_version.dart';
import 'dura_app.dart';
import 'preference_store_provider.dart';

Future<void> bootstrap({
  DiagnosticPolicy diagnosticPolicy = const DiagnosticPolicy.fromEnvironment(),
}) async {
  WidgetsFlutterBinding.ensureInitialized();
  // Whatever opens before a failure is closed again, newest first.
  final opened = <Future<void> Function()>[];
  try {
    diagnosticPolicy.validate();
    await DuraTheme.prepareFonts();
    final support = await getApplicationSupportDirectory();
    final logs = RotatingDiagnostics(
      Directory('${support.path}/${DiagnosticPolicy.logDirectory}'),
      policy: diagnosticPolicy,
    );
    opened.add(logs.close);
    // Bootstrap owns this connection for the app's lifetime; features that
    // need their own tables open them through their own providers.
    final database = LocalDatabase.open(
      File('${support.path}/${AppStorage.databaseFile}'),
    );
    opened.add(database.close);
    final preferences = SqlitePreferences(database);
    final recording =
        await preferences.read(AppStorage.usageRecordingKey) != AppStorage.off;
    final usage = RotatingAnalytics(
      Directory('${support.path}/${RotatingAnalytics.directoryName}'),
      enabled: recording,
    );
    opened.add(usage.close);
    final version = {
      'appVersion': AppVersion.version,
      'buildNumber': AppVersion.build,
    };
    await logs.record(
      'app.started',
      fields: {
        ...version,
        'schemaVersion': database.schemaVersion,
        'os': Platform.operatingSystem,
      },
    );
    unawaited(usage.track(AnalyticsEvents.appOpened, fields: version));
    void quietly(Future<void> Function() close) =>
        unawaited(close().catchError((Object _, StackTrace _) {}));
    runApp(
      ProviderScope(
        overrides: [
          diagnosticStoreProvider.overrideWith((ref) {
            ref.onDispose(() => quietly(logs.close));
            return logs;
          }),
          preferenceStoreProvider.overrideWith((ref) {
            ref.onDispose(() => quietly(database.close));
            return preferences;
          }),
          analyticsProvider.overrideWith((ref) {
            ref.onDispose(() => quietly(usage.close));
            return usage;
          }),
          usageRecordingStartProvider.overrideWithValue(recording),
          usageSwitchProvider.overrideWithValue((on) => usage.enabled = on),
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
    // A failed start releases what it opened before showing the message.
    for (final close in opened.reversed) {
      await close().catchError((Object _, StackTrace _) {});
    }
    runApp(
      MaterialApp(
        theme: DuraTheme.light,
        home: Scaffold(
          body: SafeArea(
            child: Builder(
              builder: (context) => Center(
                child: Padding(
                  padding: EdgeInsets.all(context.dura.space.xl),
                  child: const Text(AppCopy.startupFailed),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
