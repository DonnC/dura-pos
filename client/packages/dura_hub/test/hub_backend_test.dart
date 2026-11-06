// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:convert';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';
import 'package:dura_core/dura_core.dart';
import 'package:dura_hub/dura_hub.dart';
import 'package:test/test.dart';

import 'support/fake_hub.dart';

const _phone = PairedDevice(
  id: 'P2',
  secret: deviceSecret,
  role: 'owner',
  business: 'chipos-corner-shop-261103-a1b2',
);
final _payment = PaymentRequest(
  reference: 'P2-PAY261103-0001',
  provider: 'paynow',
  method: 'ecocash',
  amount: Money.parse('2.5', Currency.usd),
  payer: '0771234567',
);
final _paymentReply = ok({
  'reference': 'P2-PAY261103-0001',
  'state': 'pending',
  'amount': '2.50',
  'currency': 'USD',
});

HubBackend _backend(HubTransport hub, {PairedDevice? device = _phone}) =>
    HubBackend(
      address: Uri.parse('https://hub.test/exec'),
      transport: hub,
      device: () => device,
      clock: () => DateTime.utc(2026, 11, 3, 12),
      nonce: () => '0' * 32,
    );

Matcher _fails(BackendFailureKind kind, String code) => throwsA(
  isA<BackendFailure>()
      .having((f) => f.kind, 'kind', kind)
      .having((f) => f.code, 'code', code),
);

final class _NoReply implements HubTransport {
  int calls = 0;

  @override
  Future<String> post(Uri address, String body) {
    calls += 1;
    throw const BackendFailure(
      BackendFailureKind.retryableUnavailable,
      'hub_timeout',
    );
  }
}

void main() {
  group('requests', () {
    test('pairing sends no device, nonce or signature', () async {
      final hub = FakeHub(
        (_, _) => ok({
          'device': 'P2',
          'secret': deviceSecret,
          'role': 'seller',
          'business': 'shop',
        }),
      );
      final device = await _backend(hub, device: null).pair('c' * 32, 'Till');
      expect(device.id, 'P2');
      expect(device.isOwner, isFalse);
      expect(hub.requests.single.keys, ['v', 'ts', 'action', 'body']);
    });

    test('a signed request carries the protocol envelope', () async {
      final hub = FakeHub((_, _) => ok({'code': 'ab', 'expires': 1793700600}));
      await _backend(hub).createPairingCode();
      final request = hub.requests.single;
      expect(request['v'], 1);
      expect(request['device'], 'P2');
      expect(request['ts'], 1793707200);
      expect(request['nonce'], '0' * 32);
      expect(request['sig'], hasLength(64));
    });

    test('a phone that has not paired sends nothing', () {
      final hub = FakeHub((_, _) => ok({}));
      expect(
        () => _backend(hub, device: null).status(),
        _fails(BackendFailureKind.authenticationRequired, 'not_paired'),
      );
      expect(hub.requests, isEmpty);
    });

    test('the pricing currency goes by code', () async {
      final hub = FakeHub((_, _) => ok({'business': 'b', 'period': '2026-11'}));
      final ready = await _backend(hub).setUpShop(
        const ShopSetup(
          name: "Chipo's",
          timeZone: 'Africa/Harare',
          pricingCurrency: Currency.zwg,
        ),
      );
      expect(ready.period, '2026-11');
      expect(
        hub.requests.single['body'],
        containsPair('pricingCurrency', 'ZWG'),
      );
    });
  });

  group('journal', () {
    final events = <Map<String, Object?>>[
      {
        'id': 'P2-E261103-0001',
        'data': {'total': '2.00'},
      },
    ];

    test('a batch carries the hash of its canonical events', () async {
      final hub = FakeHub((_, _) => ok({'status': 'accepted', 'through': 4}));
      final ack = await _backend(hub)
          .putJournal(JournalBatch(number: 4, events: events));
      expect(ack.isAccepted, isTrue);
      expect(ack.through, 4);
      final body = hub.requests.single['body']! as Map<String, Object?>;
      expect(body['batch'], 4);
      expect(
        body['hash'],
        sha256.convert(utf8.encode(canonicalJson(events))).toString(),
      );
    });

    test('a gap says which batch to send', () async {
      final hub = FakeHub((_, _) => ok({'status': 'gap', 'need': 3}));
      final ack = await _backend(hub)
          .putJournal(JournalBatch(number: 5, events: events));
      expect(ack.isAccepted, isFalse);
      expect(ack.need, 3);
    });
  });

  group('master data', () {
    test('changed data arrives by table, with skipped rows', () async {
      final hub = FakeHub(
        (_, _) => ok({
          'unchanged': false,
          'version': 'v2',
          'tables': {
            'Products': [
              {'product_id': 'P001', 'price_pricing': '1.50'},
            ],
          },
          'skipped': [
            {'table': 'Products', 'row': 4, 'reason': 'No price'},
          ],
        }),
      );
      final data = await _backend(hub).pullChanges(since: 'v1');
      expect(data.isUnchanged, isFalse);
      expect(data.tables['Products']!.single['price_pricing'], '1.50');
      expect(data.skipped.single.row, 4);
      expect(hub.requests.single['body'], {'since': 'v1'});
    });

    test('a first pull sends no version', () async {
      final hub = FakeHub((_, _) => ok({'unchanged': true, 'version': 'v1'}));
      final data = await _backend(hub).pullChanges();
      expect(data.isUnchanged, isTrue);
      expect(hub.requests.single['body'], <String, Object?>{});
    });
  });

  group('payments', () {
    test('an amount goes as a decimal string, to its full scale', () async {
      final hub = FakeHub((_, _) => _paymentReply);
      final status = await _backend(hub).startPayment(_payment);
      final body = hub.requests.single['body']! as Map<String, Object?>;
      expect(body['amount'], '2.50');
      expect(body['currency'], 'USD');
      expect(status.state, PaymentState.pending);
      expect(status.amount, Money.parse('2.50', Currency.usd));
    });

    test('a lost reply is an unknown outcome, and is sent once', () async {
      final hub = _NoReply();
      await expectLater(
        _backend(hub).startPayment(_payment),
        _fails(
          BackendFailureKind.unknownExternalOutcome,
          'payment_outcome_unknown',
        ),
      );
      expect(hub.calls, 1);
    });

    test('an unreadable reply is an unknown outcome too', () async {
      final hub = FakeHub((_, _) => '<html>Sorry</html>');
      await expectLater(
        _backend(hub).startPayment(_payment),
        _fails(
          BackendFailureKind.unknownExternalOutcome,
          'payment_outcome_unknown',
        ),
      );
    });

    test('a refusal from the hub keeps its own category', () async {
      final hub = FakeHub(
        (_, _) => refused('validation', 'payments_not_set_up'),
      );
      await expectLater(
        _backend(hub).startPayment(_payment),
        _fails(BackendFailureKind.validation, 'payments_not_set_up'),
      );
    });

    test('a lost reply to a check is safe to retry', () async {
      await expectLater(
        _backend(_NoReply()).checkPayment('P2-PAY261103-0001'),
        _fails(BackendFailureKind.retryableUnavailable, 'hub_timeout'),
      );
    });

    test('every state the protocol names can be read', () async {
      for (final state in PaymentState.values) {
        final hub = FakeHub(
          (_, _) => ok({
            'reference': 'r',
            'state': state.name,
            'amount': '1.00',
            'currency': 'ZWG',
            'note': 'Why',
          }),
        );
        final status = await _backend(hub).checkPayment('r');
        expect(status.state, state);
        expect(status.note, 'Why');
      }
    });

    test('keys go out with the provider and currency', () async {
      final hub = FakeHub((_, _) => ok({'set': true}));
      await _backend(hub)
          .setPaymentKeys('paynow', Currency.usd, {'integrationId': '1234'});
      expect(hub.requests.single['body'], {
        'integrationId': '1234',
        'provider': 'paynow',
        'currency': 'USD',
      });
    });
  });

  group('errors', () {
    test('every protocol category maps to its own kind', () async {
      const categories = {
        'validation': BackendFailureKind.validation,
        'permission': BackendFailureKind.permission,
        'authentication_required': BackendFailureKind.authenticationRequired,
        'retryable_unavailable': BackendFailureKind.retryableUnavailable,
        'unknown_external_outcome': BackendFailureKind.unknownExternalOutcome,
        'integrity_conflict': BackendFailureKind.integrityConflict,
      };
      for (final MapEntry(key: category, value: kind) in categories.entries) {
        final hub = FakeHub((_, _) => refused(category, 'some_code'));
        await expectLater(_backend(hub).status(), _fails(kind, 'some_code'));
      }
    });

    test('a page that is not JSON is retryable', () async {
      final hub = FakeHub((_, _) => '<html>Authorization needed</html>');
      await expectLater(
        _backend(hub).status(),
        _fails(BackendFailureKind.retryableUnavailable, 'hub_bad_reply'),
      );
    });

    test('the secret never reaches a log line', () {
      expect(_phone.toString(), isNot(contains(deviceSecret)));
    });
  });

  group('files and status', () {
    test('a photo goes as base64, and invoices use the wire name', () async {
      final hub = FakeHub((_, _) => ok({'file': 'f1', 'name': 'P1.jpg'}));
      final file = await _backend(hub).uploadAttachment(
        AttachmentKind.supplierInvoice,
        'P1',
        'image/jpeg',
        Uint8List.fromList([1, 2, 3]),
      );
      expect(file.name, 'P1.jpg');
      final body = hub.requests.single['body']! as Map<String, Object?>;
      expect(body['kind'], 'invoice');
      expect(body['data'], 'AQID');
    });

    test('an Excel export names no table', () async {
      final hub = FakeHub((_, _) => ok({'file': 'f', 'name': 'n'}));
      await _backend(hub).requestExport('2026-11', ExportFormat.excel);
      expect(hub.requests.single['body'], {
        'file': '2026-11',
        'format': 'xlsx',
      });
    });

    test(
      'status reads each phone, and a phone never seen has no date',
      () async {
        final hub = FakeHub(
          (_, _) => ok({
            'hub': '0.1.0-dev.1',
            'protocols': [1],
            'business': 'b',
            'pricingCurrency': 'USD',
            'views': {'queued': 2, 'skipped': 1},
            'payments': ['paynow:USD'],
            'phones': [
              {
                'device': 'P1',
                'name': 'Till',
                'role': 'owner',
                'through': 3,
                'viewed': 1,
                'lastSeen': 0,
              },
            ],
          }),
        );
        final status = await _backend(hub).status();
        expect(status.batchesWaiting, 2);
        expect(status.paymentAccounts, ['paynow:USD']);
        expect(status.phones.single.uploadedThrough, 3);
        expect(status.phones.single.lastSeen, isNull);
      },
    );
  });
}
