import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class JobsScreen extends StatefulWidget {
  final bool myJobs;
  const JobsScreen({super.key, required this.myJobs});

  @override
  State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> {
  List<Job>? _jobs;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final jobs = widget.myJobs ? await getMyJobs() : await getOpenJobs();
      if (mounted) setState(() { _jobs = jobs; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = '$e'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: Text(widget.myJobs ? 'İlanlarım' : 'İş İlanları'),
          actions: [
            if (widget.myJobs)
              IconButton(
                icon: const Icon(Icons.add_circle_outline),
                onPressed: () => context.push('/job/new').then((_) => _load()),
              ),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: _load,
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: kPrimary))
              : _error != null
                  ? ErrorView(message: _error!, onRetry: _load)
                  : _jobs == null || _jobs!.isEmpty
                      ? EmptyState(
                          icon: Icons.work_outline,
                          title: widget.myJobs ? 'Henüz ilanınız yok' : 'İlan bulunamadı',
                          subtitle: widget.myJobs
                              ? 'İlk ilanınızı verin ve işçi bulmaya başlayın.'
                              : 'Yeni ilanlar yakında eklenecek.',
                          actionLabel: widget.myJobs ? 'İlan ver' : null,
                          onAction: widget.myJobs ? () => context.push('/job/new') : null,
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _jobs!.length,
                          itemBuilder: (_, i) => _JobCard(job: _jobs![i]),
                        ),
        ),
      );
}

class _JobCard extends StatelessWidget {
  final Job job;
  const _JobCard({required this.job});

  String get _typeLabel {
    switch (job.employmentType) {
      case 'fullTime': return 'Tam zamanlı';
      case 'partTime': return 'Yarı zamanlı';
      case 'daily': return 'Günlük';
      default: return job.employmentType;
    }
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () => context.push('/job/${job.id}'),
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: kBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(job.title,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  ),
                  TagChip(label: _typeLabel),
                ],
              ),
              const SizedBox(height: 6),
              if (job.employer?.companyName != null)
                Text(job.employer!.companyName!,
                    style: const TextStyle(color: kMuted, fontSize: 13)),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.location_on_outlined, size: 14, color: kMuted),
                  const SizedBox(width: 4),
                  Text(job.location, style: const TextStyle(color: kMuted, fontSize: 13)),
                  const Spacer(),
                  if (job.salaryMin != null)
                    Text(
                      '₺${job.salaryMin}${job.salaryMax != null ? ' - ₺${job.salaryMax}' : '+'}',
                      style: const TextStyle(
                          color: kPrimary, fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                ],
              ),
            ],
          ),
        ),
      );
}
