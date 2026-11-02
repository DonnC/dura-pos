// Maintained by the Dura POS contributors.
import 'package:dura_core/dura_core.dart';
import 'package:test/test.dart';

void main() {
  test('default diagnostic storage is bounded to fifty MiB', () {
    const policy = DiagnosticPolicy();
    expect(policy.maxFiles, 10);
    expect(policy.maxFileBytes, 5 * 1024 * 1024);
    expect(policy.maxFiles * policy.maxFileBytes, 50 * 1024 * 1024);
  });
}
