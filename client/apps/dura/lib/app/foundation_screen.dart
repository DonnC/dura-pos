// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'app_copy.dart';
import 'app_routes.dart';

/// Bootstrap surface only; product workflows have separate roadmap gates.
class FoundationScreen extends StatelessWidget {
  const FoundationScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text(AppCopy.name)),
    body: SafeArea(
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: DuraSpacing.contentWidth),
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.all(DuraSpacing.large),
            children: [
              Text(
                AppCopy.foundation,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: DuraSpacing.medium),
              const Text(AppCopy.foundationDetail),
              const SizedBox(height: DuraSpacing.large),
              DuraButton(
                label: AppCopy.diagnostics,
                onPressed: () => context.go(AppRoutes.diagnostics),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
