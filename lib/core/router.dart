import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'auth_provider.dart';
import '../features/auth/phone_screen.dart';
import '../features/auth/code_screen.dart';
import '../features/auth/role_screen.dart';
import '../features/onboard/worker_onboard.dart';
import '../features/onboard/employer_onboard.dart';
import '../features/home/home_screen.dart';
import '../features/jobs/job_detail.dart';
import '../features/jobs/job_new.dart';
import '../features/workers/worker_detail.dart';
import '../features/chat/chat_screen.dart';
import '../features/profile/edit_worker.dart';
import '../features/profile/edit_employer.dart';
import '../features/premium/premium_screen.dart';
import '../features/boost/boost_screen.dart';
import '../features/settings/settings_screen.dart';
import '../features/offers/offers_screen.dart';
import '../features/notifications/notifications_screen.dart';

final _rootKey = GlobalKey<NavigatorState>();

GoRouter createRouter(AuthProvider auth) => GoRouter(
      navigatorKey: _rootKey,
      refreshListenable: auth,
      initialLocation: '/',
      redirect: (context, state) {
        final status = auth.status;
        final loc = state.matchedLocation;

        if (status == AuthStatus.loading) return null;

        if (status == AuthStatus.unauthenticated) {
          if (loc.startsWith('/auth')) return null;
          return '/auth/phone';
        }

        final user = auth.user!;

        // needs role
        if (user.role == null) {
          if (loc == '/auth/role') return null;
          return '/auth/role';
        }

        // needs onboarding
        if (user.isWorker && user.workerProfile?.isComplete == false) {
          if (loc == '/onboard/worker') return null;
          return '/onboard/worker';
        }
        if (user.isEmployer && user.employerProfile?.isComplete == false) {
          if (loc == '/onboard/employer') return null;
          return '/onboard/employer';
        }

        // already authenticated, redirect away from auth
        if (loc.startsWith('/auth')) return '/';

        return null;
      },
      routes: [
        // Auth
        GoRoute(path: '/auth/phone', builder: (_, __) => const PhoneScreen()),
        GoRoute(
          path: '/auth/code',
          builder: (_, state) => CodeScreen(
            phone: state.extra as Map<String, String>? ?? {},
          ),
        ),
        GoRoute(path: '/auth/role', builder: (_, __) => const RoleScreen()),

        // Onboard
        GoRoute(path: '/onboard/worker', builder: (_, __) => const WorkerOnboardScreen()),
        GoRoute(path: '/onboard/employer', builder: (_, __) => const EmployerOnboardScreen()),

        // Main app with tabs
        GoRoute(path: '/', builder: (_, __) => const HomeScreen()),

        // Detail screens — static routes MUST come before dynamic ones
        GoRoute(path: '/job/new', builder: (_, __) => const JobNewScreen()),
        GoRoute(
          path: '/job/:id',
          builder: (_, state) => JobDetailScreen(id: state.pathParameters['id']!),
        ),
        GoRoute(
          path: '/worker/:id',
          builder: (_, state) => WorkerDetailScreen(id: state.pathParameters['id']!),
        ),
        GoRoute(
          path: '/chat/:id',
          builder: (_, state) => ChatScreen(conversationId: state.pathParameters['id']!),
        ),
        GoRoute(path: '/profile/edit-worker', builder: (_, __) => const EditWorkerScreen()),
        GoRoute(path: '/profile/edit-employer', builder: (_, __) => const EditEmployerScreen()),
        GoRoute(path: '/premium', builder: (_, __) => const PremiumScreen()),
        GoRoute(path: '/boost', builder: (_, __) => const BoostScreen()),
        GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
        GoRoute(path: '/offers', builder: (_, __) => const OffersScreen()),
        GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
      ],
    );
