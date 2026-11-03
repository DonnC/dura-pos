// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

// @ts-check

/**
 * Stores each accepted batch as one JSON file in the journal folder, through
 * the Drive advanced service so `drive.file` is enough. Routing batches into
 * per-month folders arrives with the file registry.
 * @param {any} props Script Properties
 */
function driveJournalWriter_(props) {
  return {
    /** @param {any} entry */
    write: function (entry) {
      var folderId = props.getProperty('journalFolderId');
      if (!folderId) {
        throw hubError_('retryable_unavailable', 'not_set_up',
          'The journal folder is not set up yet.');
      }
      var name = entry.device + '-' + ('00000' + entry.batch).slice(-6) + '.json';
      var blob = Utilities.newBlob(JSON.stringify(entry), 'application/json', name);
      return Drive.Files.create(
        { name: name, parents: [folderId], mimeType: 'application/json' }, blob);
    },
  };
}
