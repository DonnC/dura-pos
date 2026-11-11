// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_core/dura_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/analytics_provider.dart';
import '../../app/app_storage.dart';
import '../../app/preference_store_provider.dart';

/// Whether usage was being recorded when the app started. Bootstrap reads it
/// from this phone's settings.
final usageRecordingStartProvider = Provider<bool>((ref) => true);

/// Turns the recorder itself on or off. Bootstrap supplies it.
final usageSwitchProvider = Provider<void Function(bool on)>((ref) => (_) {});

final usageRecordingProvider = NotifierProvider<UsageRecording, bool>(
  UsageRecording.new,
);

/// The owner's choice to keep usage records, remembered on this phone.
final class UsageRecording extends Notifier<bool> {
  @override
  bool build() => ref.watch(usageRecordingStartProvider);

  Future<void> set({required bool on}) async {
    if (on == state) return;
    state = on;
    ref.read(usageSwitchProvider)(on);
    if (on) {
      await ref.read(analyticsProvider).track(AnalyticsEvents.recordingOn);
    }
    try {
      await ref
          .read(preferenceStoreProvider)
          .write(
            AppStorage.usageRecordingKey,
            on ? AppStorage.on : AppStorage.off,
          );
    } on Object {
      // The switch still applies now; it's only forgotten after a restart.
    }
  }
}
