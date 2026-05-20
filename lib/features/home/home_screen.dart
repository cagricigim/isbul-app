import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/auth_provider.dart';
import '../../core/theme.dart';
import '../jobs/jobs_screen.dart';
import '../workers/workers_screen.dart';
import '../messages/messages_screen.dart';
import '../profile/profile_screen.dart';
import 'employer_home.dart';
import 'worker_home.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    if (user == null) return const SizedBox.shrink();

    final isEmployer = user.isEmployer;

    final tabs = isEmployer
        ? [
            const EmployerHomeTab(),
            const WorkersScreen(),
            const JobsScreen(myJobs: true),
            const MessagesScreen(),
            const ProfileScreen(),
          ]
        : [
            const WorkerHomeTab(),
            const JobsScreen(myJobs: false),
            const MessagesScreen(),
            const ProfileScreen(),
          ];

    final items = isEmployer
        ? const [
            BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Ana Sayfa'),
            BottomNavigationBarItem(icon: Icon(Icons.people_rounded), label: 'İşçiler'),
            BottomNavigationBarItem(icon: Icon(Icons.work_rounded), label: 'İlanlarım'),
            BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_rounded), label: 'Mesajlar'),
            BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Profil'),
          ]
        : const [
            BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Ana Sayfa'),
            BottomNavigationBarItem(icon: Icon(Icons.work_rounded), label: 'İlanlar'),
            BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_rounded), label: 'Mesajlar'),
            BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Profil'),
          ];

    final clampedIndex = _index.clamp(0, tabs.length - 1);

    return Scaffold(
      body: IndexedStack(index: clampedIndex, children: tabs),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: clampedIndex,
        onTap: (i) => setState(() => _index = i),
        items: items,
      ),
    );
  }
}
