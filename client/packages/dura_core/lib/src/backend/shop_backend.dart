// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:typed_data';

import '../money/currency.dart';
import 'attachment_kind.dart';
import 'backend_status.dart';
import 'export_format.dart';
import 'journal_ack.dart';
import 'journal_batch.dart';
import 'master_data.dart';
import 'paired_device.dart';
import 'pairing_code.dart';
import 'payment_request.dart';
import 'payment_status.dart';
import 'shop_ready.dart';
import 'shop_setup.dart';
import 'stored_file.dart';

/// The app's one view of any backend (decision 0005).
///
/// It's written in shop words, so moving to another backend means writing a
/// new implementation, not a new app. Failures are `BackendFailure`s. Nothing
/// here is needed to complete a sale.
abstract interface class ShopBackend {
  /// Exchanges a one-time code for this phone's identity.
  Future<PairedDevice> pair(String code, String deviceName);

  /// Creates the shop's records. Safe to repeat. Owner only.
  Future<ShopReady> setUpShop(ShopSetup setup);

  /// Uploads a sealed batch. Safe to repeat after a lost reply.
  Future<JournalAck> putJournal(JournalBatch batch);

  /// Master data, or a short answer if [since] is still the latest version.
  Future<MasterData> pullChanges({String? since});

  /// Owner only: a short-lived code to add a phone.
  Future<PairingCode> createPairingCode();

  /// Owner only: removes a phone.
  Future<void> revokeDevice(String deviceId);

  Future<StoredFile> uploadAttachment(
    AttachmentKind kind,
    String id,
    String contentType,
    Uint8List bytes,
  );

  /// Owner only: saves a copy. [file] is `myShop` or a month like `2026-11`.
  /// [table] names the tab for a CSV.
  Future<StoredFile> requestExport(
    String file,
    ExportFormat format, {
    String? table,
  });

  /// Owner only: stores a provider's keys, which never come back.
  Future<void> setPaymentKeys(
    String provider,
    Currency currency,
    Map<String, String> keys,
  );

  /// Asks the provider to prompt the customer.
  ///
  /// Never retry this after a failure of kind `unknownExternalOutcome`: the
  /// customer may already have been charged.
  Future<PaymentStatus> startPayment(PaymentRequest request);

  Future<PaymentStatus> checkPayment(String reference);

  Future<BackendStatus> status();
}
