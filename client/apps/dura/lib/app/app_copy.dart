// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_core/dura_core.dart';

/// Initial English copy; move to generated localisations when locales expand.
abstract final class AppCopy {
  static const name = 'Dura POS';
  static const foundation = 'Application foundation';
  static const foundationDetail =
      'Local storage, reusable controls and private device diagnostics. '
      'Sales, Google sync and optional fiscalisation are not enabled yet.';
  static const diagnostics = 'Diagnostics';
  static const localLogs = 'On-device logs';
  static String logPolicy(DiagnosticPolicy policy) =>
      'Up to ${policy.maxFiles} files of ${policy.maxFileBytes} bytes each. '
      'Logs stay on this device. Only operational metadata is recorded.';
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
