// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

/** @param {string} device @param {number} batch */
function journalFileName_(device, batch) {
  return device + '-' + ('00000' + batch).slice(-6) + '.json';
}

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
      var folderId = store.get(STORE_KEYS_.fileJournal);
      if (!folderId) {
        throw hubError_(ERRORS_.notSetUp,
          'The shop is not set up yet; run setup first.');
      }
      var name = journalFileName_(entry.device, entry.batch);
      var blob = Utilities.newBlob(JSON.stringify(entry), 'application/json', name);
      return Drive.Files.create(
        { name: name, parents: [folderId], mimeType: 'application/json' }, blob,
        { fields: 'id' });
    },
    /**
     * A stored batch, or null if there's no such file.
     * @param {string} device @param {number} batch
     */
    read: function (device, batch) {
      var folderId = store.get(STORE_KEYS_.fileJournal);
      var found = Drive.Files.list({
        q: "name = '" + journalFileName_(device, batch) + "' and '" + folderId + "' in parents and trashed = false",
        fields: 'files(id)',
        pageSize: 1,
      });
      return found.files && found.files.length > 0 ? readJournalFile_(found.files[0].id) : null;
    },
  };
}
