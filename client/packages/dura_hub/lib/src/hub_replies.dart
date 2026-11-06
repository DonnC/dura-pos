// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_core/dura_core.dart';

/// The protocol's error categories, by their wire names.
const failureKinds = {
  'validation': BackendFailureKind.validation,
  'permission': BackendFailureKind.permission,
  'authentication_required': BackendFailureKind.authenticationRequired,
  'retryable_unavailable': BackendFailureKind.retryableUnavailable,
  'unknown_external_outcome': BackendFailureKind.unknownExternalOutcome,
  'integrity_conflict': BackendFailureKind.integrityConflict,
};

PairedDevice pairedDevice(Map<String, Object?> result) => PairedDevice(
  id: result['device']! as String,
  secret: result['secret']! as String,
  role: result['role']! as String,
  business: result['business']! as String,
);

JournalAck journalAck(Map<String, Object?> result) => result['status'] == 'gap'
    ? JournalAck.gap(result['need']! as int)
    : JournalAck.accepted(result['through']! as int);

MasterData masterData(Map<String, Object?> result) {
  final version = result['version']! as String;
  if (result['unchanged'] == true) return MasterData.unchanged(version);
  final tables = (result['tables']! as Map<String, Object?>).map(
    (table, rows) => MapEntry(table, [
      for (final row in rows! as List<Object?>)
        (row! as Map<String, Object?>).cast<String, String>(),
    ]),
  );
  return MasterData.changed(
    version: version,
    tables: tables,
    skipped: [
      for (final row in result['skipped']! as List<Object?>)
        _skipped(row! as Map<String, Object?>),
    ],
  );
}

SkippedRow _skipped(Map<String, Object?> row) => SkippedRow(
  table: row['table']! as String,
  row: row['row']! as int,
  reason: row['reason']! as String,
);

BackendStatus backendStatus(Map<String, Object?> result) {
  final views = result['views']! as Map<String, Object?>;
  return BackendStatus(
    version: result['hub']! as String,
    protocols: (result['protocols']! as List<Object?>).cast<int>(),
    business: result['business']! as String,
    pricingCurrency: result['pricingCurrency']! as String,
    batchesWaiting: views['queued']! as int,
    rowsSkipped: views['skipped']! as int,
    paymentAccounts: (result['payments']! as List<Object?>).cast<String>(),
    phones: [
      for (final phone in result['phones']! as List<Object?>)
        _phone(phone! as Map<String, Object?>),
    ],
  );
}

PhoneStatus _phone(Map<String, Object?> phone) {
  final seen = phone['lastSeen']! as int;
  return PhoneStatus(
    device: phone['device']! as String,
    name: phone['name']! as String,
    role: phone['role']! as String,
    uploadedThrough: phone['through']! as int,
    viewedThrough: phone['viewed']! as int,
    lastSeen: seen == 0 ? null : secondsToDate(seen),
  );
}

PaymentStatus paymentStatus(Map<String, Object?> result) {
  final currency = Currency(result['currency']! as String, scale: 2);
  return PaymentStatus(
    reference: result['reference']! as String,
    state: PaymentState.values.byName(result['state']! as String),
    amount: Money.parse(result['amount']! as String, currency),
    note: result['note'] as String?,
  );
}

StoredFile storedFile(Map<String, Object?> result) =>
    StoredFile(id: result['file']! as String, name: result['name']! as String);

DateTime secondsToDate(int seconds) =>
    DateTime.fromMillisecondsSinceEpoch(seconds * 1000, isUtc: true);
