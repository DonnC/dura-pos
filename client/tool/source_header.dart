// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// Canonical header for original project sources and generated launcher XML.
const sourceHeader = r'''
// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT
''';

bool hasSourceHeader(List<String> lines) {
  final expected = sourceHeader.trim().split('\n');
  return lines.length >= expected.length &&
      RegExp(r'^// Copyright \(c\) \d{4}(?:-\d{4})?, DonnC & contributors\.$')
          .hasMatch(lines.first) &&
      lines.skip(1).take(expected.length - 1).join('\n') ==
          expected.skip(1).join('\n');
}
