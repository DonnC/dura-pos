// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import '../backend/backend_failure.dart';
import '../backend/backend_failure_kind.dart';
import '../backend/shop_backend.dart';
import 'outbox.dart';
import 'sealed_events.dart';
import 'upload_result.dart';
import 'upload_state.dart';

/// Seals what's waiting and sends it, oldest first.
///
/// A batch counts as uploaded only when the backend confirms it. A lost reply
/// leaves it unsent, so the next run sends the same batch and the backend
/// recognises it. A run that fails loses nothing, and never holds up a sale.
final class OutboxUploader {
  OutboxUploader({
    required this.outbox,
    required this.backend,
    required this.device,
    this.maxEvents = 100,
  });

  final Outbox outbox;
  final ShopBackend backend;
  final String device;
  final int maxEvents;

  Future<UploadResult> run() async {
    var uploaded = 0;
    int? lastGap;
    int? override;
    while (true) {
      final number = override ?? await _next();
      override = null;
      if (number == null) return UploadResult(UploadState.allSent, uploaded);
      final batch = await outbox.batch(number);
      if (batch == null) {
        return UploadResult(
          UploadState.needsAttention,
          uploaded,
          'batch_not_on_phone',
        );
      }
      try {
        final ack = await backend.putJournal(batch);
        if (ack.isAccepted) {
          await outbox.markUploaded(number);
          uploaded += 1;
          continue;
        }
        if (ack.need == lastGap) {
          return UploadResult(
            UploadState.needsAttention,
            uploaded,
            'batch_gap',
          );
        }
        lastGap = override = ack.need;
      } on BackendFailure catch (failure) {
        return UploadResult(_stateFor(failure.kind), uploaded, failure.code);
      }
    }
  }

  Future<int?> _next() async =>
      await outbox.firstUnsent() ??
      await outbox.seal(
        maxEvents,
        (number, events) => sealedEvents(number, device, events),
      );

  static UploadState _stateFor(BackendFailureKind kind) => switch (kind) {
    BackendFailureKind.retryableUnavailable ||
    BackendFailureKind.unknownExternalOutcome => UploadState.tryLater,
    _ => UploadState.needsAttention,
  };
}
