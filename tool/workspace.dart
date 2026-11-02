// Maintained by the Dura POS contributors.
import 'dart:io';

import 'package:yaml/yaml.dart';

const workspacePackages = [
  'packages/dura_core',
  'packages/dura_data',
  'packages/dura_ui',
  'apps/dura',
];

Future<void> runChecked(
  String command,
  List<String> arguments, {
  String? directory,
  Map<String, String>? environment,
}) async {
  final executable = Platform.isWindows && command == 'flutter'
      ? 'flutter.bat'
      : command;
  final result = await Process.start(
    executable,
    arguments,
    workingDirectory: directory,
    environment: {
      'CI': 'true',
      'FLUTTER_SUPPRESS_ANALYTICS': 'true',
      'DASH__SUPPRESS_ANALYTICS': 'true',
      ...?environment,
    },
    mode: ProcessStartMode.inheritStdio,
    runInShell: Platform.isWindows,
  );
  final code = await result.exitCode;
  if (code != 0) {
    throw ProcessException(command, arguments, 'Check failed', code);
  }
}

YamlMap packageManifest(String directory) =>
    loadYaml(File('$directory/pubspec.yaml').readAsStringSync()) as YamlMap;
