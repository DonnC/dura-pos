// Maintained by the Dura POS contributors.

/// Initial English copy; move to generated localisations when locales expand.
abstract final class AppCopy {
  static const name = 'Dura POS';
  static const foundation = 'Application foundation';
  static const foundationDetail =
      'Local storage, reusable controls and private device diagnostics. '
      'Sales, Google sync and optional fiscalisation are not enabled yet.';
  static const diagnostics = 'Diagnostics';
  static const localLogs = 'On-device logs';
  static const logPolicy =
      'Up to 10 files of 5 MiB each. Logs stay on this device. '
      'Only operational metadata is recorded.';
  static const emptyLogs = 'No diagnostic records yet.';
  static const prepareArchive = 'Prepare support ZIP';
  static const working = 'Working on your diagnostic files…';
  static const shareArchive = 'Share support ZIP';
  static const shareTitle = 'Share local diagnostic files?';
  static const shareWarning =
      'The ZIP contains the files listed here. Share it only with someone '
      'you trust. No automatic upload is performed.';
  static const share = 'Share';
  static const cancel = 'Cancel';
  static const retry = 'Try again';
  static const unavailable = 'Diagnostics could not be loaded.';
  static const archiveFailed = 'The support archive could not be prepared.';
  static const shareFailed = 'The share action could not be completed.';
  static const startupFailed =
      'Local storage could not be opened. Restart the app and check free space.';
}

abstract final class AppRoutes {
  static const home = '/';
  static const diagnostics = '/diagnostics';
}

abstract final class AppStorage {
  static const databaseFile = 'dura-foundation.sqlite';
  static const themeKey = 'appearance.theme';
}
