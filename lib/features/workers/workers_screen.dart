import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class WorkersScreen extends StatefulWidget {
  const WorkersScreen({super.key});

  @override
  State<WorkersScreen> createState() => _WorkersScreenState();
}

class _WorkersScreenState extends State<WorkersScreen> {
  List<WorkerListItem>? _workers;
  bool _loading = true;
  String? _error;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final workers = await getWorkers();
      if (mounted) setState(() { _workers = workers; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = '$e'; _loading = false; });
    }
  }

  List<WorkerListItem> get _filtered {
    if (_search.isEmpty) return _workers ?? [];
    return (_workers ?? []).where((w) {
      final p = w.profile;
      if (p == null) return false;
      return (p.location ?? '').toLowerCase().contains(_search.toLowerCase()) ||
          (p.bio ?? '').toLowerCase().contains(_search.toLowerCase());
    }).toList();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: const Text('İşçiler'),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(64),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: TextField(
                onChanged: (v) => setState(() => _search = v),
                decoration: InputDecoration(
                  hintText: 'Konum veya beceri ara...',
                  prefixIcon: const Icon(Icons.search),
                  filled: true,
                  fillColor: kBackground,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: kBorder),
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 10),
                ),
              ),
            ),
          ),
        ),
        body: RefreshIndicator(
          onRefresh: _load,
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: kPrimary))
              : _error != null
                  ? ErrorView(message: _error!, onRetry: _load)
                  : _filtered.isEmpty
                      ? const EmptyState(
                          icon: Icons.people_outline,
                          title: 'İşçi bulunamadı',
                          subtitle: 'Arama kriterlerinizi değiştirerek tekrar deneyin.',
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filtered.length,
                          itemBuilder: (_, i) => _WorkerCard(worker: _filtered[i]),
                        ),
        ),
      );
}

class _WorkerCard extends StatelessWidget {
  final WorkerListItem worker;
  const _WorkerCard({required this.worker});

  @override
  Widget build(BuildContext context) {
    final p = worker.profile;
    final name = p?.bio?.split(' ').first ?? 'İşçi';
    return GestureDetector(
      onTap: () => context.push('/worker/${worker.id}'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: kBorder),
        ),
        child: Row(
          children: [
            AppAvatar(url: p?.photoUrl, initials: name, size: 52),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (p?.location != null)
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 13, color: kMuted),
                        const SizedBox(width: 2),
                        Text(p!.location!,
                            style: const TextStyle(color: kMuted, fontSize: 12)),
                      ],
                    ),
                  if (p?.bio != null) ...[
                    const SizedBox(height: 4),
                    Text(p!.bio!,
                        style: const TextStyle(fontSize: 13),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis),
                  ],
                  if (p?.skills.isNotEmpty == true) ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      children: p!.skills
                          .take(3)
                          .map((s) => TagChip(label: s))
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: kMuted),
          ],
        ),
      ),
    );
  }
}
