// Maintained by the Dura POS contributors.
import 'package:dura_ui/dura_ui.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/diagnostics/diagnostic_screen.dart';
import 'app_copy.dart';

final appRouter = GoRouter(
  routes: [
    GoRoute(
      path: AppRoutes.home,
      builder: (context, state) => const FoundationScreen(),
    ),
    GoRoute(
      path: AppRoutes.diagnostics,
      builder: (context, state) => const DiagnosticScreen(),
    ),
  ],
);

class DuraApp extends StatelessWidget {
  const DuraApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp.router(
    title: AppCopy.name,
    theme: DuraTheme.light,
    darkTheme: DuraTheme.dark,
    routerConfig: appRouter,
  );
}

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
