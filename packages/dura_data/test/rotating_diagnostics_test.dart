// Maintained by the Dura POS contributors.
import 'dart:convert';
import 'dart:io';

import 'package:archive/archive.dart';
import 'package:dura_core/dura_core.dart';
import 'package:dura_data/src/diagnostics/rotating_diagnostics.dart';
import 'package:test/test.dart';

void main() {
  late Directory directory;
  setUp(() async {
    directory = await Directory.systemTemp.createTemp('dura-diagnostics-test-');
  });
  tearDown(() => directory.delete(recursive: true));

  test('rotates within both limits and retains newest records', () async {
    final logs = RotatingDiagnostics(
      directory,
      policy: const DiagnosticPolicy(maxFiles: 3, maxFileBytes: 256),
    );
    for (var index = 0; index < 30; index++) {
      await logs.record('sync.attempt', fields: {'count': index});
    }
    final files = await logs.files();
    expect(files.length, 3);
    for (final file in files) {
      expect(await file.length(), lessThanOrEqualTo(256));
    }
    expect(await files.last.readAsString(), contains('29'));
  });

  test('does not persist secrets, payloads or unsafe values', () async {
    final logs = RotatingDiagnostics(directory);
    await logs.record(
      'payment.failed',
      traceId: 'unsafe@example.com',
      fields: {
        'token': 'secret-access-token',
        'pin': '123456',
        'message': 'Customer Alice paid 500',
        'status': 'Bearer supersecret',
        'code': 'network_unavailable',
      },
    );
    final text = await (await logs.files()).single.readAsString();
    expect(text, contains('network_unavailable'));
    for (final secret in [
      'secret-access-token',
      '123456',
      'Alice',
      'supersecret',
      '@example.com',
    ]) {
      expect(text, isNot(contains(secret)));
    }
    await logs.record('token=secret-access-token');
    expect(
      await (await logs.files()).single.readAsString(),
      isNot(contains('secret-access-token')),
    );
  });

  test(
    'serialises concurrent writes and exports complete JSONL records',
    () async {
      final logs = RotatingDiagnostics(directory);
      await Future.wait([
        for (var index = 0; index < 30; index++)
          logs.record('app.event', traceId: 'trace-$index'),
      ]);
      final archiveFile = await logs.exportZip();
      final archive = ZipDecoder().decodeBytes(await archiveFile.readAsBytes());
      final jsonFile = archive.files.singleWhere(
        (file) => file.name.endsWith('.jsonl'),
      );
      final lines = utf8
          .decode(jsonFile.content as List<int>)
          .trim()
          .split('\n');
      expect(lines.length, 30);
      final ids = lines
          .map((line) => (jsonDecode(line) as Map)['traceId'])
          .toSet();
      expect(ids.length, 30);
    },
  );

  test('survives reopening and caps temporary export archives', () async {
    await RotatingDiagnostics(directory).record('app.started');
    final reopened = RotatingDiagnostics(directory);
    await reopened.record('app.restarted');
    for (var index = 0; index < 4; index++) {
      await reopened.exportZip();
    }
    expect(
      await (await reopened.files()).single.readAsString(),
      contains('app.started'),
    );
    final exports = Directory(
      '${directory.parent.path}/${directory.uri.pathSegments.where((p) => p.isNotEmpty).last}-exports',
    );
    expect(await exports.exists(), isTrue);
    expect(await exports.list().length, DiagnosticPolicy.maxExportFiles);
    await exports.delete(recursive: true);
  });

  test(
    'preserves unrelated files and refuses an impossible storage policy',
    () async {
      final unrelated = File('${directory.path}/owner.txt');
      await unrelated.writeAsString('keep');
      final logs = RotatingDiagnostics(directory);
      await logs.record('app.started');
      expect(await unrelated.readAsString(), 'keep');
      expect(
        () => DiagnosticPolicy(maxFiles: 0),
        throwsA(isA<AssertionError>()),
      );
    },
  );
}
