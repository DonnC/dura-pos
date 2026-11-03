// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

/**
 * Stores each accepted batch as one JSON file in the Journal folder that
 * setup.run recorded in the registry (file:journal). Routing batches into
 * per-month folders comes later.
 * @param {any} store the request's property store
 */
function driveJournalWriter_(store) {
  return {
    /** @param {any} entry */
    write: function (entry) {
      var folderId = store.get('file:journal');
      if (!folderId) {
        throw hubError_('retryable_unavailable', 'not_set_up',
          'The shop is not set up yet; run setup first.');
      }
      var name = entry.device + '-' + ('00000' + entry.batch).slice(-6) + '.json';
      var blob = Utilities.newBlob(JSON.stringify(entry), 'application/json', name);
      return Drive.Files.create(
        { name: name, parents: [folderId], mimeType: 'application/json' }, blob,
        { fields: 'id' });
    },
  };
}
