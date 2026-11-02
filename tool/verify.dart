// Maintained by the Dura POS contributors.
import 'workspace.dart';

Future<void> main() async {
  await runChecked('dart', [
    'format',
    '--output=none',
    '--set-exit-if-changed',
    'apps/dura/lib',
    'apps/dura/test',
    'packages',
    'tool',
    'test',
  ]);
  await runChecked('dart', ['run', 'tool/check_repository.dart']);
  await runChecked('flutter', ['analyze', '--no-pub', '--fatal-infos']);
  await runChecked('dart', ['run', 'tool/test_workspace.dart']);
}
