// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// A shop with templates served and the owner paired, for tests of setup and
// of what happens after it.

'use strict';

const crypto = require('node:crypto');
const { installedHub, INSTALL_CODE } = require('./hub_fixture');

const sha = (text) => crypto.createHash('sha256').update(text).digest('hex');
const templateSet = (code) => ({
  myShop: { url: `https://example.test/v1/${code}/my_shop.xlsx`, sha256: sha(`${code} my shop bytes`) },
  month: { url: `https://example.test/v1/${code}/month.xlsx`, sha256: sha(`${code} month bytes`) },
});
const TEMPLATES = { USD: templateSet('USD'), ZWG: templateSet('ZWG'), ZAR: templateSet('ZAR') };
const SETUP = { name: "Chipo's Corner Shop", timeZone: 'Africa/Harare', pricingCurrency: 'USD' };

/** An installed hub with templates served, the owner paired, setup not run. */
function setupHub(options = {}) {
  const fixture = installedHub({ templates: TEMPLATES, useDriveJournal: true, ...options });
  const routes = fixture.google.UrlFetchApp.routes;
  for (const code of Object.keys(TEMPLATES)) {
    routes.set(TEMPLATES[code].myShop.url, { code: 200, body: `${code} my shop bytes` });
    routes.set(TEMPLATES[code].month.url, { code: 200, body: `${code} month bytes` });
  }
  fixture.google.PropertiesService.getScriptProperties().deleteProperty('businessId');
  const contract = fixture.hub.VIEW_CONTRACT_;
  for (const [table, spec] of Object.entries(contract.tables)) {
    fixture.google.Sheets.headings[table] =
      Object.values(spec.fields).map((f) => f.heading.replace('{pricing}', 'USD'));
  }
  const owner = fixture.pair(INSTALL_CODE, 'Owner phone').result;
  const setup = (body = SETUP) => fixture.send(owner, 'setup.run', body);
  return { ...fixture, owner, setup, drive: fixture.google.Drive };
}

/** A shop that has finished setup. */
function readyShop(options) {
  const shop = setupHub(options);
  const reply = shop.setup();
  if (!reply.ok) throw new Error(JSON.stringify(reply));
  return shop;
}

const named = (drive, name) => drive.files.find((f) => f.name === name);

module.exports = { setupHub, readyShop, named, TEMPLATES, SETUP };
