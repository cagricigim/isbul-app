import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/api.dart';
import '../../core/auth_provider.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class WorkerHomeTab extends StatefulWidget {
  const WorkerHomeTab({super.key});

  @override
  State<WorkerHomeTab> createState() => _WorkerHomeTabState();
}

class _WorkerHomeTabState extends State<WorkerHomeTab> {
  List<Offer>? _offers;
  List<Job>? _jobs;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([getIncomingOffers(), getOpenJobs()]);
      if (mounted) {
        setState(() {
          _offers = results[0] as List<Offer>;
          _jobs = results[1] as List<Job>;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final profile = user?.workerProfile;

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
                              'Merhaba 👋',
                              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                            ),
                            const Text('Teklifler ve ilanlar sizi bekliyor',
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
              if (_loading)
                const SliverToBoxAdapter(
                  child: Center(child: Padding(
                    padding: EdgeInsets.all(48),
                    child: CircularProgressIndicator(color: kPrimary),
                  )),
                )
              else ...[
                if (_offers != null && _offers!.isNotEmpty) ...[
                  SliverToBoxAdapter(
                    child: SectionHeader(title: 'Teklifler (${_offers!.length})'),
                  ),
                  SliverToBoxAdapter(
                    child: SizedBox(
                      height: 130,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _offers!.length,
                        itemBuilder: (_, i) => _OfferCard(offer: _offers![i]),
                      ),
                    ),
                  ),
                ],
                SliverToBoxAdapter(
                  child: SectionHeader(title: 'Güncel ilanlar'),
                ),
                if (_jobs == null || _jobs!.isEmpty)
                  const SliverToBoxAdapter(
                    child: EmptyState(
                      icon: Icons.work_outline,
                      title: 'İlan bulunamadı',
                      subtitle: 'Yeni ilanlar burada görünecek.',
                    ),
                  )
                else
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (ctx, i) => _JobListTile(job: _jobs![i]),
                      childCount: _jobs!.length,
                    ),
                  ),
              ],
              const SliverToBoxAdapter(child: SizedBox(height: 20)),
            ],
          ),
        ),
      ),
    );
  }
}

class _OfferCard extends StatelessWidget {
  final Offer offer;
  const _OfferCard({required this.offer});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () => context.push('/job/${offer.job?.id}'),
        child: Container(
          width: 200,
          margin: const EdgeInsets.only(right: 12),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [kPrimary, kPrimaryDark],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.local_offer_rounded, color: Colors.white, size: 20),
              const Spacer(),
              Text(
                offer.job?.title ?? 'Teklif',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                offer.job?.location ?? '',
                style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12),
              ),
            ],
          ),
        ),
      );
}

class _JobListTile extends StatelessWidget {
  final Job job;
  const _JobListTile({required this.job});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () => context.push('/job/${job.id}'),
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: kBorder),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: kPrimary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: job.employer?.logoUrl != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.network(job.employer!.logoUrl!, fit: BoxFit.cover),
                      )
                    : const Icon(Icons.business_rounded, color: kPrimary, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(job.title,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                    Text(
                      '${job.employer?.companyName ?? ''} • ${job.location}',
                      style: const TextStyle(color: kMuted, fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: kMuted),
            ],
          ),
        ),
      );
}
