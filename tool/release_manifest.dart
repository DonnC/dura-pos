// Maintained by the Dura POS contributors.
import 'package:pub_semver/pub_semver.dart';

typedef ReleaseManifest = ({
  String version,
  int build,
  bool publish,
  bool prerelease,
  String notes,
});

/// Reject unsafe paths and version drift before signing or publication.
ReleaseManifest validateReleaseManifest(
  Map<String, Object?> value,
  String app,
) {
  final version = value['version'];
  final build = value['buildNumber'];
  final notes = value['notes'];
  if (version is! String ||
      !RegExp(r'^\d+\.\d+\.\d+(?:-[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*)?$')
          .hasMatch(version) ||
      build is! int ||
      build < 1 ||
      app != '$version+$build' ||
      notes is! String ||
      !RegExp(r'^release-notes/[a-zA-Z0-9_.-]+\.md$').hasMatch(notes) ||
      value['publish'] is! bool ||
      value['prerelease'] is! bool) {
    throw const FormatException(
      'Release metadata is invalid or versions differ.',
    );
  }
  final prerelease = value['prerelease']! as bool;
  if (Version.parse(version).toString() != version) {
    throw const FormatException(
      'Version must use canonical semantic versioning.',
    );
  }
  if (version.contains('-') && !prerelease) {
    throw const FormatException(
      'A prerelease version must be marked prerelease.',
    );
  }
  return (
    version: version,
    build: build,
    publish: value['publish']! as bool,
    prerelease: prerelease,
    notes: notes,
  );
}
