// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_core/dura_core.dart';

/// Initial English copy; move to generated localisations when locales expand.
abstract final class AppCopy {
  static const name = 'Dura POS';
  static const back = 'Back';

  // The shell.
  static const noShopYet = 'No shop set up yet';
  static const savedOnPhone = 'Saved on this phone · Nothing to upload yet';
  static const sell = 'Sell';
  static const stock = 'Stock';
  static const money = 'Money';
  static const myTill = 'My till';
  static const myShop = 'My shop';
  static const me = 'Me';

  // Tabs that open in a later update.
  static const sellTitle = "Let's sell.";
  static const sellSubtitle = 'Find goods, take cash, give change.';
  static const sellLater = 'Selling opens in the next update.';
  static const stockTitle = 'Your stock.';
  static const stockSubtitle = 'What is on the shelf, and what is running low.';
  static const stockLater = 'Products and stock counts open in a later update.';
  static const moneyTitle = 'Your money.';
  static const tillTitle = 'My till.';
  static const moneySubtitle = 'Sales, the cash drawer and money out.';
  static const tillSubtitle = 'Your shift, your drawer and your sales.';
  static const moneyLater = 'Cash-up and money out open in a later update.';
  static const shopTitle = 'My shop.';
  static const meTitle = 'Me.';
  static const shopSubtitle = 'Settings, people, phones and records.';
  static const meSubtitle = 'Your access on this phone.';
  static const shopLater = 'Shop settings open in a later update.';
  static const problemReports = 'Problem reports';
  static const problemReportsDetail =
      'Files to send to someone helping with the app';

  // Problem reports and usage records.
  static const diagnostics = 'Problem reports.';
  static const diagnosticsSubtitle =
      'What the app wrote down when something went wrong.';
  static const localLogs = 'Saved on this phone';
  static String logPolicy(DiagnosticPolicy policy) =>
      'Up to ${policy.maxFiles} files of ${policy.maxFileBytes} bytes each. '
      'Logs stay on this device. Only operational metadata is recorded.';
  static const emptyLogs = 'No diagnostic records yet.';
  static String fileSize(int bytes) => '$bytes bytes';
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
  static const usageRecording = 'Record how the app is used';
  static const usageRecordingDetail =
      'Screens opened and buttons used, to make Dura easier. Never sales, '
      'amounts or names. Kept on this phone.';
  static const startupFailed =
      'Local storage could not be opened. Restart the app and check free space.';
}
