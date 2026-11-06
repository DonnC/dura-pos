// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

function badEnvelope_(message) {
  return hubError_('validation', 'bad_envelope', message);
}

/** @param {any} value */
function isPlainObject_(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Checks the envelope's shape and version, before any lookup or crypto.
 * @param {any} request
 */
function checkEnvelope_(request) {
  if (!isPlainObject_(request)) throw badEnvelope_('The request is not an object.');
  if (!Number.isSafeInteger(request.v)) throw badEnvelope_('v must be an integer.');
  if (typeof request.action !== 'string' || !PATTERNS_.action.test(request.action)) {
    throw badEnvelope_('action is missing or malformed.');
  }
  if (!Number.isSafeInteger(request.ts)) throw badEnvelope_('ts must be an integer.');
  if (!isPlainObject_(request.body)) throw badEnvelope_('body must be an object.');
  if (request.action !== 'pair') {
    if (typeof request.device !== 'string' || !PATTERNS_.device.test(request.device)) {
      throw badEnvelope_('device is missing or malformed.');
    }
    if (typeof request.nonce !== 'string' || !PATTERNS_.nonce.test(request.nonce)) {
      throw badEnvelope_('nonce must be 32 to 64 lower-case hex characters.');
    }
    if (typeof request.sig !== 'string' || !PATTERNS_.signature.test(request.sig)) {
      throw badEnvelope_('sig must be 64 lower-case hex characters.');
    }
  }
  if (request.v !== PROTOCOL_VERSION_) {
    throw hubError_('validation', 'unsupported_version', 'This hub speaks protocol version 1.');
  }
}

/**
 * Verifies a signed request and returns its device. The checks run in
 * PROTOCOL.md's order; the nonce is recorded only after the signature passes,
 * so unsigned traffic can't fill the cache.
 * @param {any} request
 * @param {any} services
 */
function authenticate_(request, services) {
  var device = findDevice_(services, request.device);
  if (!device) {
    throw hubError_('authentication_required', 'unknown_device', 'This phone is not paired.');
  }
  if (Math.abs(services.now() - request.ts) > LIMITS_.clockSkewSeconds) {
    throw hubError_('authentication_required', 'stale_request', 'Check the phone clock.');
  }
  var signingString;
  try {
    signingString = canonicalJson_({
      v: request.v, device: request.device, ts: request.ts,
      nonce: request.nonce, action: request.action, body: request.body,
    });
  } catch (error) {
    throw badEnvelope_('The body holds a value that cannot be signed.');
  }
  if (!constantTimeEqual_(hmacSha256Hex_(signingString, device.secret), request.sig)) {
    throw hubError_('authentication_required', 'bad_signature', 'The signature does not match.');
  }
  var nonceKey = 'nonce:' + request.device + ':' + request.nonce;
  if (services.cache.get(nonceKey) !== null) {
    throw hubError_('authentication_required', 'replayed_request', 'This request was already received.');
  }
  services.cache.put(nonceKey, '1', LIMITS_.nonceSeconds);
  return device;
}
