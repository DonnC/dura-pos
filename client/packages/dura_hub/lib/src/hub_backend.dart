// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';
import 'package:dura_core/dura_core.dart';

import 'canonical_json.dart';
import 'hub_action.dart';
import 'hub_replies.dart';
import 'hub_transport.dart';

const _protocolVersion = 1;

/// [ShopBackend] over the protocol in `backend/hub/PROTOCOL.md`.
///
/// This is the only code that knows the hub's message shapes. No Google type
/// appears here, because the protocol has none.
final class HubBackend implements ShopBackend {
  HubBackend({
    required this.address,
    required this.transport,
    required this.device,
    DateTime Function()? clock,
    String Function()? nonce,
  }) : _clock = clock ?? DateTime.now,
       _nonce = nonce ?? _randomNonce;

  final Uri address;
  final HubTransport transport;

  /// This phone's stored identity, or null before pairing.
  final PairedDevice? Function() device;
  final DateTime Function() _clock;
  final String Function() _nonce;

  @override
  Future<PairedDevice> pair(String code, String deviceName) async {
    final reply = await _exchange({
      'v': _protocolVersion,
      'ts': _seconds(),
      'action': HubAction.pair.wire,
      'body': {'code': code, 'name': deviceName},
    });
    return pairedDevice(reply);
  }

  @override
  Future<ShopReady> setUpShop(ShopSetup setup) async {
    final result = await _signed(HubAction.setupRun, {
      'name': setup.name,
      'timeZone': setup.timeZone,
      'pricingCurrency': setup.pricingCurrency.code,
    });
    return ShopReady(
      business: result['business']! as String,
      period: result['period']! as String,
    );
  }

  @override
  Future<JournalAck> putJournal(JournalBatch batch) async {
    final digest = sha256.convert(utf8.encode(canonicalJson(batch.events)));
    return journalAck(
      await _signed(HubAction.journalPut, {
        'batch': batch.number,
        'events': batch.events,
        'hash': digest.toString(),
      }),
    );
  }

  @override
  Future<MasterData> pullChanges({String? since}) async =>
      masterData(await _signed(HubAction.changesPull, {'since': ?since}));

  @override
  Future<PairingCode> createPairingCode() async {
    final result = await _signed(HubAction.pairingCreate, {});
    return PairingCode(
      code: result['code']! as String,
      expiresAt: secondsToDate(result['expires']! as int),
    );
  }

  @override
  Future<void> revokeDevice(String deviceId) async {
    await _signed(HubAction.deviceRevoke, {'device': deviceId});
  }

  @override
  Future<StoredFile> uploadAttachment(
    AttachmentKind kind,
    String id,
    String contentType,
    Uint8List bytes,
  ) async => storedFile(
    await _signed(HubAction.attachmentPut, {
      'kind': attachmentKindNames[kind],
      'id': id,
      'contentType': contentType,
      'data': base64Encode(bytes),
    }),
  );

  @override
  Future<StoredFile> requestExport(
    String file,
    ExportFormat format, {
    String? table,
  }) async => storedFile(
    await _signed(HubAction.exportRequest, {
      'file': file,
      'format': exportFormatNames[format],
      'table': ?table,
    }),
  );

  @override
  Future<void> setPaymentKeys(
    String provider,
    Currency currency,
    Map<String, String> keys,
  ) async {
    await _signed(HubAction.keysSet, {
      ...keys,
      'provider': provider,
      'currency': currency.code,
    });
  }

  @override
  Future<PaymentStatus> startPayment(PaymentRequest request) async {
    final amount = request.amount;
    return paymentStatus(
      await _signed(HubAction.paymentStart, {
        'reference': request.reference,
        'provider': request.provider,
        'method': request.method,
        'amount': amount.amount.toStringAsFixed(amount.currency.scale),
        'currency': amount.currency.code,
        'payer': request.payer,
        'sale': ?request.saleId,
      }, chargesMoney: true),
    );
  }

  @override
  Future<PaymentStatus> checkPayment(String reference) async => paymentStatus(
    await _signed(HubAction.paymentCheck, {'reference': reference}),
  );

  @override
  Future<BackendStatus> status() async =>
      backendStatus(await _signed(HubAction.status, {}));

  Future<Map<String, Object?>> _signed(
    HubAction action,
    Map<String, Object?> body, {
    bool chargesMoney = false,
  }) {
    final me = device();
    if (me == null) {
      throw const BackendFailure(
        BackendFailureKind.authenticationRequired,
        'not_paired',
      );
    }
    final envelope = <String, Object?>{
      'v': _protocolVersion,
      'device': me.id,
      'ts': _seconds(),
      'nonce': _nonce(),
      'action': action.wire,
      'body': body,
    };
    final key = utf8.encode(me.secret);
    final signature = Hmac(
      sha256,
      key,
    ).convert(utf8.encode(canonicalJson(envelope)));
    return _exchange({
      ...envelope,
      'sig': signature.toString(),
    }, chargesMoney: chargesMoney);
  }

  /// Sends a request and opens its reply.
  ///
  /// With [chargesMoney], a request that may have reached the hub but gave no
  /// readable answer is an unknown outcome, never something to retry. An answer
  /// the hub did give keeps its own category.
  Future<Map<String, Object?>> _exchange(
    Map<String, Object?> request, {
    bool chargesMoney = false,
  }) async {
    final Map<String, Object?> reply;
    try {
      reply = _decode(await transport.post(address, jsonEncode(request)));
    } on BackendFailure {
      if (!chargesMoney) rethrow;
      throw const BackendFailure(
        BackendFailureKind.unknownExternalOutcome,
        'payment_outcome_unknown',
      );
    }
    if (reply['ok'] == true) {
      return reply['result']! as Map<String, Object?>;
    }
    final error = reply['error']! as Map<String, Object?>;
    throw BackendFailure(
      failureKinds[error['category']] ??
          BackendFailureKind.retryableUnavailable,
      error['code'] as String? ?? 'unknown_error',
      error['message'] as String? ?? '',
    );
  }

  Map<String, Object?> _decode(String text) {
    try {
      final reply = jsonDecode(text) as Map<String, Object?>;
      if (reply['ok'] is bool) return reply;
    } on FormatException {
      // handled below
    } on TypeError {
      // handled below
    }
    throw const BackendFailure(
      BackendFailureKind.retryableUnavailable,
      'hub_bad_reply',
    );
  }

  int _seconds() => _clock().millisecondsSinceEpoch ~/ 1000;
}

String _randomNonce() {
  final random = Random.secure();
  final bytes = List.generate(16, (_) => random.nextInt(256));
  return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
}
