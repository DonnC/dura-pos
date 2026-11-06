// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

/**
 * The web app's entry point. Always answers JSON; an unexpected failure is
 * reported only as `internal_error`, never with its message or stack.
 * @param {any} e
 */
function doPost(e) {
  if (e && e.parameter && e.parameter.cb) return answerCallback_(e);
  var reply;
  try {
    var request;
    try {
      request = JSON.parse(e && e.postData ? e.postData.contents : '');
    } catch (parseError) {
      throw badEnvelope_('The request is not JSON.');
    }
    reply = handleRequest_(request, createServices_());
  } catch (error) {
    reply = errorReply_(error);
  }
  return ContentService.createTextOutput(JSON.stringify(reply))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * A provider's callback, unsigned and from outside. It's a hint, so whatever
 * goes wrong the answer is the same plain text, and it says nothing.
 * @param {any} e
 */
function answerCallback_(e) {
  try {
    handlePaymentCallback_(e.parameter.cb, e.postData ? e.postData.contents : '', createServices_());
  } catch (error) {
    console.error('Callback not handled: ' + (error && error.name));
  }
  return ContentService.createTextOutput('ok');
}

/**
 * Routes one request. Pure apart from `services`, so tests drive it directly.
 * @param {any} request
 * @param {any} services
 */
function handleRequest_(request, services) {
  try {
    checkEnvelope_(request);
    if (request.action === 'pair') return okReply_(pair_(request, services));
    var device = authenticate_(request, services);
    var handler = handlerFor_(request.action);
    if (!handler) {
      throw hubError_('validation', 'unknown_action', 'This hub does not know that action.');
    }
    return okReply_(handler(request, services, device));
  } catch (error) {
    return errorReply_(error);
  }
}

/**
 * Looked up at call time, not load time: Apps Script may load files in any
 * order, so a table built at load time could hold undefined handlers.
 * @param {string} action
 */
function handlerFor_(action) {
  switch (action) {
    case 'pairing.create': return createPairingCode_;
    case 'device.revoke': return revokeDevice_;
    case 'journal.put': return putJournal_;
    case 'setup.run': return runSetup_;
    case 'changes.pull': return pullChanges_;
    case 'status': return readStatus_;
    case 'keys.set': return setPaymentKeys_;
    case 'payment.start': return startPayment_;
    case 'payment.check': return checkPayment_;
    case 'attachment.put': return putAttachment_;
    case 'export.request': return requestExport_;
    default: return null;
  }
}

/** @param {any} result */
function okReply_(result) {
  return { v: PROTOCOL_VERSION_, ok: true, result: result };
}

/** @param {any} error */
function errorReply_(error) {
  if (error && error.hub) return { v: PROTOCOL_VERSION_, ok: false, error: error.hub };
  console.error('Hub internal error: ' + (error && error.name));
  return {
    v: PROTOCOL_VERSION_,
    ok: false,
    error: {
      category: 'retryable_unavailable',
      code: 'internal_error',
      message: 'Unexpected hub error.',
    },
  };
}
