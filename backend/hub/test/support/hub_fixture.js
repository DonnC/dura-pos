// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

'use strict';

const { loadHub } = require('./load_hub');
const client = require('./test_client');

const INSTALL_CODE = '0123456789abcdef0123456789abcdef';
const BUSINESS = 'shop-demo-001';

/**
 * A freshly installed hub with fake Google services and a controllable clock.
 * Replies are copied out of the hub's context, so assertions compare plain
 * objects.
 */
function installedHub(overrides = {}) {
  const { hub, google } = loadHub();
  const written = [];
  const settings = {
    now: () => google.clock.now(),
    install: {
      codeHash: client.sha256Hex(INSTALL_CODE),
      installedAt: google.clock.now(),
    },
  };
  if (overrides.templates) settings.templates = overrides.templates;
  if (!overrides.useDriveJournal) {
    settings.journalWriter = {
      write(entry) {
        if (overrides.failWrites && overrides.failWrites()) {
          throw new Error('Drive unavailable');
        }
        written.push(JSON.parse(JSON.stringify(entry)));
        return { id: `file-${written.length}` };
      },
    };
  }
  google.PropertiesService.getScriptProperties().setProperty('businessId', BUSINESS);
  // A new services object per request, as each Apps Script execution has.
  const services = () => hub.createServices_(settings);
  const call = (request) =>
    JSON.parse(JSON.stringify(hub.handleRequest_(request, services())));
  const pair = (code, name) =>
    call({ v: 1, ts: google.clock.now(), action: 'pair', body: { code, name } });
  const send = (device, action, body = {}, extra = {}) =>
    call(client.signed({
      device: device.device,
      secret: device.secret,
      action,
      body,
      ts: google.clock.now(),
      ...extra,
    }));
  return { hub, google, services, written, call, pair, send };
}

/** An installed hub with the owner's phone paired. */
function hubWithOwner(overrides) {
  const fixture = installedHub(overrides);
  const owner = fixture.pair(INSTALL_CODE, 'Owner phone').result;
  return { ...fixture, owner };
}

/** An installed hub with the owner and one seller phone paired. */
function hubWithSeller(overrides) {
  const fixture = hubWithOwner(overrides);
  const { code } = fixture.send(fixture.owner, 'pairing.create').result;
  const seller = fixture.pair(code, 'Back counter').result;
  return { ...fixture, seller };
}

module.exports = { installedHub, hubWithOwner, hubWithSeller, INSTALL_CODE, BUSINESS };
