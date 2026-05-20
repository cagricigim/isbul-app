import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api.dart';
import '../../core/auth_provider.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class JobDetailScreen extends StatefulWidget {
  final String id;
  const JobDetailScreen({super.key, required this.id});

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  Job? _job;
  bool _loading = true;
  bool _applying = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final j = await getJob(widget.id);
      if (mounted) setState(() { _job = j; _loading = false; });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  String get _typeLabel {
    switch (_job?.employmentType) {
      case 'fullTime': return 'Tam zamanlı';
      case 'partTime': return 'Yarı zamanlı';
      case 'daily': return 'Günlük';
      default: return _job?.employmentType ?? '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final isWorker = user?.isWorker ?? false;

    return Scaffold(
      appBar: AppBar(title: const Text('İlan Detayı')),
      body: _loading
          ? const LoadingScreen()
          : _job == null
              ? const ErrorView(message: 'İlan bulunamadı.')
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              color: kPrimary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: _job!.employer?.logoUrl != null
                                ? ClipRRect(
                                    borderRadius: BorderRadius.circular(12),
                                    child: Image.network(_job!.employer!.logoUrl!, fit: BoxFit.cover),
                                  )
                                : const Icon(Icons.business_rounded, color: kPrimary, size: 28),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(_job!.title,
                                    style: const TextStyle(
                                        fontSize: 20, fontWeight: FontWeight.w800)),
                                if (_job!.employer?.companyName != null)
                                  Text(_job!.employer!.companyName!,
                                      style: const TextStyle(color: kMuted, fontSize: 14)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          TagChip(label: _typeLabel),
                          TagChip(label: _job!.category),
                          if (_job!.salaryMin != null)
                            TagChip(
                              label: '₺${_job!.salaryMin}${_job!.salaryMax != null ? ' - ₺${_job!.salaryMax}' : '+'}',
                              color: Colors.green[700],
                            ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _InfoRow(icon: Icons.location_on_outlined, text: _job!.location),
                      const SizedBox(height: 8),
                      if (_job!.position.isNotEmpty)
                        _InfoRow(icon: Icons.badge_outlined, text: _job!.position),
                      const Divider(height: 32),
                      if (_job!.employer?.companyName != null) ...[
                        const Text('Firma',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            AppAvatar(
                              url: _job!.employer?.logoUrl,
                              initials: _job!.employer?.companyName ?? '?',
                              size: 40,
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(_job!.employer!.companyName!,
                                    style: const TextStyle(fontWeight: FontWeight.w600)),
                                if (_job!.employer?.sector != null)
                                  Text(_job!.employer!.sector!,
                                      style: const TextStyle(color: kMuted, fontSize: 13)),
                              ],
                            ),
                          ],
                        ),
                        const Divider(height: 32),
                      ],
                    ],
                  ),
                ),
      bottomNavigationBar: _job != null && isWorker
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: AppButton(
                  label: 'Başvur',
                  loading: _applying,
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Başvurunuz alındı!')),
                    );
                  },
                ),
              ),
            )
          : null,
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Icon(icon, size: 16, color: kMuted),
          const SizedBox(width: 6),
          Text(text, style: const TextStyle(color: kMuted, fontSize: 14)),
        ],
      );
}
