// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// Every field an analytics event may carry. Anything else is dropped when
/// the record is written, so a typo loses the field rather than leaking data.
abstract final class AnalyticsFields {
  /// The screen's tracker ID, such as `SELL-01`.
  static const screen = 'screen';
  static const tab = 'tab';

  /// What was done, as an identifier: `take_payment`, `hold_sale`.
  static const action = 'action';

  /// How long the action took, in milliseconds.
  static const durationMs = 'durationMs';
  static const count = 'count';

  /// A short result: `ok`, `cancelled`, `failed`.
  static const outcome = 'outcome';

  /// A safe error code, never the message.
  static const code = 'code';
  static const feature = 'feature';
  static const appVersion = 'appVersion';
  static const buildNumber = 'buildNumber';

  /// Added by the recorder: a random ID per app launch.
  static const session = 'session';

  /// Added by the recorder: the person's staff ID, never their name.
  static const person = 'person';

  static const all = {
    screen,
    tab,
    action,
    durationMs,
    count,
    outcome,
    code,
    feature,
    appVersion,
    buildNumber,
    session,
    person,
  };
}
