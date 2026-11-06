// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

// Paired phones and pairing codes, kept in Script Properties:
//   device:P2      {"id","name","role","secret","pairedAt","revoked"}
//   devices:next   the next device number
//   pairing:<sha256 of code>   the code's expiry, in Unix seconds
//   install:used   when the install code was used
// Codes are stored only as hashes; a device secret must be kept to check
// signatures, which is why the hub project is never shared.

/** @param {any} services @param {string} key */
function readJson_(services, key) {
  var text = services.store.get(key);
  return text === null ? null : JSON.parse(text);
}

/** @param {any} services @param {string} key @param {any} value */
function writeJson_(services, key, value) {
  services.store.set(key, JSON.stringify(value));
}

/**
 * The active device with this ID, or null.
 * @param {any} services
 * @param {string} id
 */
function findDevice_(services, id) {
  if (!PATTERNS_.device.test(id)) return null;
  var device = readJson_(services, STORE_PREFIXES_.device + id);
  return device && !device.revoked ? device : null;
}

function badCode_() {
  return hubError_(ERRORS_.badCode, 'The pairing code is not valid.');
}

/** @param {any} device */
function requireOwner_(device) {
  if (device.role !== ROLES_.owner) {
    throw hubError_(ERRORS_.ownerOnly, 'Only the owner can do this.');
  }
}

/** @param {any} services @param {string} name @param {string} role */
function addDevice_(services, name, role) {
  var next = Number(services.store.get(STORE_KEYS_.devicesNext) || '1');
  var id = 'P' + next;
  var secret = randomHex_(32);
  writeJson_(services, STORE_PREFIXES_.device + id, {
    id: id, name: name, role: role, secret: secret,
    pairedAt: services.now(), revoked: false,
  });
  services.store.set(STORE_KEYS_.devicesNext, String(next + 1));
  return { device: id, secret: secret, role: role, business: services.store.get(STORE_KEYS_.businessId) || '' };
}

/** @param {any} services @param {string} codeHash */
function isInstallCode_(services, codeHash) {
  var install = services.install;
  return Boolean(install && install.codeHash) &&
    constantTimeEqual_(codeHash, install.codeHash) &&
    services.store.get(STORE_KEYS_.devicesNext) === null &&
    services.store.get(STORE_KEYS_.installUsed) === null &&
    services.now() - install.installedAt <= LIMITS_.installCodeSeconds;
}

/**
 * `pair`: exchanges a one-time code for a device ID and secret. Every failure
 * gives the same error, so guessing learns nothing.
 * @param {any} request
 * @param {any} services
 */
function pair_(request, services) {
  var code = typeof request.body.code === 'string' ? request.body.code : '';
  var name = typeof request.body.name === 'string'
    ? request.body.name.slice(0, LIMITS_.deviceNameLength) : '';
  if (!PATTERNS_.code.test(code)) throw badCode_();
  var codeHash = sha256Hex_(code);
  return withLock_(services, function () {
    if (isInstallCode_(services, codeHash)) {
      services.store.set(STORE_KEYS_.installUsed, String(services.now()));
      return addDevice_(services, name || 'Owner phone', ROLES_.owner);
    }
    var key = STORE_PREFIXES_.pairing + codeHash;
    var expires = Number(services.store.get(key));
    if (!expires || expires < services.now()) throw badCode_();
    services.store.remove(key);
    return addDevice_(services, name || 'Phone', ROLES_.seller);
  });
}

/** Drops pairing codes that have expired, so the store stays small. */
function dropExpiredCodes_(services) {
  var all = services.store.getAll();
  Object.keys(all).forEach(function (key) {
    if (key.indexOf(STORE_PREFIXES_.pairing) === 0 && Number(all[key]) < services.now()) {
      services.store.remove(key);
    }
  });
}

/**
 * `pairing.create`, owner only: a code for adding one phone.
 * @param {any} request
 * @param {any} services
 * @param {any} device
 */
function createPairingCode_(request, services, device) {
  requireOwner_(device);
  dropExpiredCodes_(services);
  var code = randomHex_(16);
  var expires = services.now() + LIMITS_.pairingCodeSeconds;
  services.store.set(STORE_PREFIXES_.pairing + sha256Hex_(code), String(expires));
  return { code: code, expires: expires };
}

/**
 * `device.revoke`, owner only. The record stays, without its secret, so the
 * device ID is never reused.
 * @param {any} request
 * @param {any} services
 * @param {any} device
 */
function revokeDevice_(request, services, device) {
  requireOwner_(device);
  var id = request.body.device;
  if (id === device.id) {
    throw hubError_(ERRORS_.cannotRevokeSelf, 'The owner cannot remove their own phone.');
  }
  var target = typeof id === 'string' ? findDevice_(services, id) : null;
  if (!target) throw hubError_(ERRORS_.noSuchDevice, 'No such phone.');
  target.revoked = true;
  target.revokedAt = services.now();
  delete target.secret;
  writeJson_(services, STORE_PREFIXES_.device + id, target);
  return { device: id, revoked: true };
}
