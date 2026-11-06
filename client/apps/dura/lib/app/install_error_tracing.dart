// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'dart:async';

import 'package:dura_core/dura_core.dart';
import 'package:flutter/foundation.dart';

/// Register app-owned handlers and return an idempotent restoration callback.
VoidCallback installErrorTracing(Diagnostics logs) {
  final previousFlutter = FlutterError.onError;
  final previousPlatform = PlatformDispatcher.instance.onError;
  void trace(Object error) {
    // Never recurse if a full disk also prevents writing the error event.
    unawaited(
      logs
          .record(
            'runtime.error',
            fields: {'errorType': error.runtimeType.toString()},
          )
          .catchError((Object _, StackTrace _) {}),
    );
  }

  void flutterHandler(FlutterErrorDetails details) {
    trace(details.exception);
    if (previousFlutter != null) {
      previousFlutter(details);
    } else if (kDebugMode) {
      FlutterError.presentError(details);
    }
  }

  bool platformHandler(Object error, StackTrace stack) {
    trace(error);
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
