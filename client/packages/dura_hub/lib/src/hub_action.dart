// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// The protocol's actions, by their wire names.
///
/// The hub's `src/names.js` holds the same list, and both are checked against
/// `test/fixtures/protocol_names.json`.
enum HubAction {
  pair('pair'),
  pairingCreate('pairing.create'),
  deviceRevoke('device.revoke'),
  journalPut('journal.put'),
  setupRun('setup.run'),
  changesPull('changes.pull'),
  status('status'),
  keysSet('keys.set'),
  paymentStart('payment.start'),
  paymentCheck('payment.check'),
  attachmentPut('attachment.put'),
  exportRequest('export.request');

  const HubAction(this.wire);

  final String wire;
}
