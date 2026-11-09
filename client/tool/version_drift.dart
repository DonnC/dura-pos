// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// Every place that repeats the product version, against `release.json`.
///
/// [versions] maps a file to the version it declares. [appVersion] is the app's
/// `version+build`, and [dependencies] maps `file: package` to its constraint.
List<String> versionDrift({
  required String version,
  required int build,
  required String appVersion,
  required Map<String, String?> versions,
  required Map<String, String> dependencies,
}) => [
  if (appVersion != '$version+$build')
    'The app is $appVersion, but release.json says $version+$build',
  for (final MapEntry(key: file, value: found) in versions.entries)
    if (found != version) '$file is $found, but release.json says $version',
  for (final MapEntry(key: dependency, value: constraint)
      in dependencies.entries)
    if (constraint != '^$version')
      '$dependency needs ^$version, not $constraint',
];
