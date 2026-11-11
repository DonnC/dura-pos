// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:dura_core/dura_core.dart';
import 'package:dura_data/dura_data.dart';
import 'package:test/test.dart';

Future<List<Map<String, Object?>>> _lines(List<File> files) async => [
  for (final file in files)
    for (final line in await file.readAsLines())
      if (line.isNotEmpty) jsonDecode(line) as Map<String, Object?>,
];

void main() {
  late Directory directory;
  setUp(() async {
    directory = await Directory.systemTemp.createTemp('dura-records-test-');
  });
  tearDown(() => directory.delete(recursive: true));

  group('APP-02 crash records', () {
    test(
      'keep safe frames and the trail, and nothing unsafe inside them',
      () async {
        final logs = RotatingDiagnostics(directory);
        await logs.record(
          'runtime.error',
          fields: {
            'errorType': 'StateError',
            'fatal': false,
            'screen': 'SELL-01',
            'trail': ['SELL-01', 'Tariro owes USD 14.50', 'SHOP-13'],
            'frames': [
              'CashSale.change (dura_core/src/sale/cash_sale.dart:48)',
              'Customer Alice paid 500',
              'main (/data/user/0/secret.dart:5)',
            ],
            'message': 'Bad state: Alice',
          },
        );
        final record = (await _lines(await logs.files())).single;
        final fields = record['fields']! as Map<String, Object?>;
        expect(fields['screen'], 'SELL-01');
        expect(fields['trail'], ['SELL-01', 'SHOP-13']);
        expect(fields['frames'], [
          'CashSale.change (dura_core/src/sale/cash_sale.dart:48)',
        ]);
        final text = jsonEncode(record);
        for (final unsafe in ['Alice', 'Tariro', 'secret', 'Bad state']) {
          expect(text, isNot(contains(unsafe)));
        }
        await logs.close();
      },
    );

    test('a long trail is cut to its limit', () async {
      final logs = RotatingDiagnostics(directory);
      await logs.record(
        'runtime.error',
        fields: {
          'trail': [for (var i = 0; i < 50; i++) 'S-$i'],
        },
      );
      final record = (await _lines(await logs.files())).single;
      final fields = record['fields']! as Map<String, Object?>;
      expect(fields['trail'], hasLength(20));
      await logs.close();
    });
  });

  group('APP-03 usage records', () {
    test('keep known events and fields, with the session', () async {
      final usage = RotatingAnalytics(directory, random: Random(7));
      await usage.track(
        AnalyticsEvents.screenViewed,
        fields: {
          AnalyticsFields.screen: 'SELL-01',
          'customerName': 'Tariro',
          AnalyticsFields.action: 'Pay USD 5.00 now',
        },
      );
      await usage.track('sale.amount', fields: {AnalyticsFields.count: 3});
      final lines = await _lines(
        await usage.listFiles().then(
          (files) => [
            for (final f in files) File('${directory.path}/${f.name}'),
          ],
        ),
      );
      expect(lines.first['event'], AnalyticsEvents.screenViewed);
      final fields = lines.first['fields']! as Map<String, Object?>;
      expect(fields[AnalyticsFields.screen], 'SELL-01');
      expect(fields[AnalyticsFields.session], usage.session);
      expect(fields.containsKey('customerName'), isFalse);
      expect(fields.containsKey(AnalyticsFields.action), isFalse);
      expect(lines.last['event'], 'analytics.unknown');
      await usage.close();
    });

    test('record nothing while switched off', () async {
      final usage = RotatingAnalytics(directory, enabled: false);
      await usage.track(AnalyticsEvents.appOpened);
      usage.enabled = true;
      await usage.track(AnalyticsEvents.recordingOn);
      final names = await usage.listFiles();
      final lines = await _lines([
        for (final f in names) File('${directory.path}/${f.name}'),
      ]);
      expect(lines.map((line) => line['event']), [AnalyticsEvents.recordingOn]);
      await usage.close();
    });

    test('use their own files, apart from diagnostics', () async {
      final usage = RotatingAnalytics(directory);
      await usage.track(AnalyticsEvents.appOpened);
      final files = await usage.listFiles();
      expect(files.single.name, startsWith(RotatingAnalytics.filePrefix));
      await usage.close();
    });

    test('a failed write never reaches the caller', () async {
      final usage = RotatingAnalytics(directory);
      await usage.close();
      await usage.track(AnalyticsEvents.appOpened);
    });

    test('a person is recorded by staff ID once known', () async {
      final usage = RotatingAnalytics(directory)..person = 'S2';
      await usage.track(AnalyticsEvents.appOpened);
      final names = await usage.listFiles();
      final line = (await _lines([
        for (final f in names) File('${directory.path}/${f.name}'),
      ])).single;
      final fields = line['fields']! as Map<String, Object?>;
      expect(fields[AnalyticsFields.person], 'S2');
      await usage.close();
    });
  });
}
