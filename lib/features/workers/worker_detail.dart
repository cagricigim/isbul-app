import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api.dart';
import '../../core/auth_provider.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class WorkerDetailScreen extends StatefulWidget {
  final String id;
  const WorkerDetailScreen({super.key, required this.id});

  @override
  State<WorkerDetailScreen> createState() => _WorkerDetailScreenState();
}

class _WorkerDetailScreenState extends State<WorkerDetailScreen> {
  WorkerListItem? _worker;
  List<Job>? _myJobs;
  bool _loading = true;
  bool _offering = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        getWorker(widget.id),
        getMyJobs(),
      ]);
      if (mounted) {
        setState(() {
          _worker = results[0] as WorkerListItem;
          _myJobs = results[1] as List<Job>;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _sendOffer() async {
    if (_myJobs == null || _myJobs!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Önce bir ilan oluşturun.')),
      );
      return;
    }

    final jobId = await showModalBottomSheet<String>(
      context: context,
      builder: (_) => _JobPickerSheet(jobs: _myJobs!),
    );
    if (jobId == null) return;

    setState(() => _offering = true);
    try {
      await sendOffer(widget.id, jobId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Teklif gönderildi!')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _offering = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final p = _worker?.profile;

    return Scaffold(
      appBar: AppBar(title: const Text('İşçi Profili')),
      body: _loading
          ? const LoadingScreen()
          : _worker == null
              ? const ErrorView(message: 'Profil bulunamadı.')
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: AppAvatar(
                          url: p?.photoUrl,
                          initials: p?.bio?.split(' ').first ?? '?',
                          size: 80,
                        ),
                      ),
                      const SizedBox(height: 20),
                      if (p?.location != null)
                        Center(
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.location_on_outlined, size: 14, color: kMuted),
                              const SizedBox(width: 4),
                              Text(p!.location!, style: const TextStyle(color: kMuted)),
                            ],
                          ),
                        ),
                      const SizedBox(height: 20),
                      if (p?.bio != null) ...[
                        const Text('Hakkında',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 8),
                        Text(p!.bio!, style: const TextStyle(fontSize: 14, height: 1.5)),
                        const SizedBox(height: 20),
                      ],
                      if (p?.skills.isNotEmpty == true) ...[
                        const Text('Beceriler',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: p!.skills.map((s) => TagChip(label: s)).toList(),
                        ),
                        const SizedBox(height: 20),
                      ],
                      if (p?.education != null) ...[
                        const Text('Eğitim',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 8),
                        Text(p!.education!, style: const TextStyle(fontSize: 14)),
                        const SizedBox(height: 20),
                      ],
                    ],
                  ),
                ),
      bottomNavigationBar: _worker != null && user?.isEmployer == true
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: AppButton(
                  label: 'Teklif Gönder',
                  loading: _offering,
                  onPressed: _sendOffer,
                ),
              ),
            )
          : null,
    );
  }
}

class _JobPickerSheet extends StatelessWidget {
  final List<Job> jobs;
  const _JobPickerSheet({required this.jobs});

  @override
  Widget build(BuildContext context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Hangi ilan için teklif?',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            ),
            const Divider(height: 0),
            ...jobs.map((j) => ListTile(
                  title: Text(j.title),
                  subtitle: Text(j.location),
                  leading: const Icon(Icons.work_outline, color: kPrimary),
                  onTap: () => Navigator.pop(context, j.id),
                )),
            const SizedBox(height: 8),
          ],
        ),
      );
}
