import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/api.dart';
import '../../core/auth_provider.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class EmployerHomeTab extends StatefulWidget {
  const EmployerHomeTab({super.key});

  @override
  State<EmployerHomeTab> createState() => _EmployerHomeTabState();
}

class _EmployerHomeTabState extends State<EmployerHomeTab> {
  List<Job>? _jobs;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final jobs = await getMyJobs();
      if (mounted) setState(() { _jobs = jobs; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = '$e'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final profile = user?.employerProfile;

    return Scaffold(
      backgroundColor: kBackground,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Merhaba, ${profile?.companyName ?? 'İşveren'} 👋',
                              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                            ),
                            const Text('İlanlarınızı yönetin',
                                style: TextStyle(color: kMuted, fontSize: 13)),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.notifications_outlined),
                        onPressed: () {},
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.add),
                    label: const Text('Yeni ilan ver'),
                    onPressed: () => context.push('/job/new'),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: SectionHeader(
                  title: 'Aktif ilanlarınız',
                  action: 'Tümü',
                  onAction: () {},
                ),
              ),
              if (_loading)
                const SliverToBoxAdapter(
                  child: Center(child: Padding(
                    padding: EdgeInsets.all(32),
                    child: CircularProgressIndicator(color: kPrimary),
                  )),
                )
              else if (_error != null)
                SliverToBoxAdapter(child: ErrorView(message: _error!, onRetry: _load))
              else if (_jobs == null || _jobs!.isEmpty)
                SliverToBoxAdapter(
                  child: EmptyState(
                    icon: Icons.work_outline,
                    title: 'Henüz ilanınız yok',
                    subtitle: 'İlk ilanınızı vererek işçi bulmaya başlayın.',
                    actionLabel: 'İlan ver',
                    onAction: () => context.push('/job/new'),
                  ),
                )
              else
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) => _JobCard(job: _jobs![i]),
                    childCount: _jobs!.length,
                  ),
                ),
              const SliverToBoxAdapter(child: SizedBox(height: 20)),
            ],
          ),
        ),
      ),
    );
  }
}

class _JobCard extends StatelessWidget {
  final Job job;
  const _JobCard({required this.job});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () => context.push('/job/${job.id}'),
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: kBorder),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: kPrimary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.work_outline, color: kPrimary, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(job.title,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 2),
                    Text(job.location,
                        style: const TextStyle(color: kMuted, fontSize: 13)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: job.status == 'open'
                      ? Colors.green.withOpacity(0.1)
                      : kBorder,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  job.status == 'open' ? 'Aktif' : 'Kapalı',
                  style: TextStyle(
                    color: job.status == 'open' ? Colors.green[700] : kMuted,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
}
