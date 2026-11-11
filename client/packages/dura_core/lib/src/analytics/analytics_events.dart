// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// Every analytics event, named once. Add a name here before recording it.
abstract final class AnalyticsEvents {
  /// The app started. Fields: app version, build.
  static const appOpened = 'app.opened';

  /// A screen opened. Fields: `screen`, its tracker ID.
  static const screenViewed = 'screen.viewed';

  /// A bottom-bar or rail destination was chosen. Fields: `tab`.
  static const tabSelected = 'tab.selected';

  /// A main action was taken. Fields: `screen`, `action`.
  static const actionTaken = 'action.taken';

  /// An error was shown to the person. Fields: `screen`, `code`.
  static const errorShown = 'error.shown';

  /// The owner shared a problem report.
  static const supportShared = 'support.shared';

  /// Recording was turned back on. Turning it off records nothing.
  static const recordingOn = 'analytics.on';

  static const all = {
    appOpened,
    screenViewed,
    tabSelected,
    actionTaken,
    errorShown,
    supportShared,
    recordingOn,
  };
}
