// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:async';

import 'package:dura_core/dura_core.dart';
import 'package:flutter/foundation.dart';

/// What a problem report calls each kind of error.
abstract final class ErrorSources {
  /// Thrown while Flutter was building, laying out or painting.
  static const flutter = 'flutter_error';

  /// Thrown in async code that nothing caught.
  static const uncaught = 'uncaught_error';
}

/// Register app-owned handlers and return an idempotent restoration callback.
///
/// Each error is written with its type, the code frames that led to it, the
/// screen it happened on and the screens before. Never its message, which can
/// hold a name, an amount or a path.
VoidCallback installErrorTracing(Diagnostics logs, {Breadcrumbs? trail}) {
  final previousFlutter = FlutterError.onError;
  final previousPlatform = PlatformDispatcher.instance.onError;
  void trace(Object error, StackTrace? stack, String source) {
    // Never recurse if a full disk also prevents writing the error event.
    unawaited(
      logs
          .record(
            'runtime.error',
            fields: {
              'errorType': error.runtimeType.toString(),
              'code': source,
              'frames': ?(stack == null ? null : safeFrames(stack)),
              'screen': ?trail?.current,
              'trail': ?trail?.trail,
            },
          )
          .catchError((Object _, StackTrace _) {}),
    );
  }

  void flutterHandler(FlutterErrorDetails details) {
    trace(details.exception, details.stack, ErrorSources.flutter);
    if (previousFlutter != null) {
      previousFlutter(details);
    } else if (kDebugMode) {
      FlutterError.presentError(details);
    }
  }

  bool platformHandler(Object error, StackTrace stack) {
    trace(error, stack, ErrorSources.uncaught);
    return previousPlatform?.call(error, stack) ?? false;
  }

  FlutterError.onError = flutterHandler;
  PlatformDispatcher.instance.onError = platformHandler;
  return () {
    if (identical(FlutterError.onError, flutterHandler)) {
      FlutterError.onError = previousFlutter;
    }
    if (identical(PlatformDispatcher.instance.onError, platformHandler)) {
      PlatformDispatcher.instance.onError = previousPlatform;
    }
  };
}
