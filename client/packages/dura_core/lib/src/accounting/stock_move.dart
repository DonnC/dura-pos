// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// A Stock Ledger row's type, by the word the sheet shows.
enum StockMove {
  opening('Opening'),
  stockIn('Stock in'),
  sold('Sold'),
  returned('Returned'),
  writtenOff('Written off'),
  counted('Counted'),
  movedIn('Moved in'),
  movedOut('Moved out');

  const StockMove(this.label);

  final String label;
}
