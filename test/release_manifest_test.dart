// Maintained by the Dura POS contributors.
import 'package:test/test.dart';

import '../tool/release_manifest.dart';

void main() {
  Map<String, Object?> fixture() => {
    'version': '0.1.0-dev.1',
    'buildNumber': 1,
    'publish': false,
    'prerelease': true,
    'notes': 'release-notes/0.1.0-dev.1.md',
  };
  test('disabled release remains disabled with an exact app version', () {
    expect(
      validateReleaseManifest(fixture(), '0.1.0-dev.1+1').publish,
      isFalse,
    );
  });
  test('rejects stale app versions and traversal paths', () {
    expect(
      () => validateReleaseManifest(fixture(), '0.1.0+1'),
      throwsFormatException,
    );
    final unsafe = fixture()..['notes'] = '../private/key';
    expect(
      () => validateReleaseManifest(unsafe, '0.1.0-dev.1+1'),
      throwsFormatException,
    );
  });
  test('prerelease cannot be labelled stable', () {
    final invalid = fixture()..['prerelease'] = false;
    expect(
      () => validateReleaseManifest(invalid, '0.1.0-dev.1+1'),
      throwsFormatException,
    );
  });
}
