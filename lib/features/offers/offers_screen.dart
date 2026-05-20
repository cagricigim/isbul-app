import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class OffersScreen extends StatefulWidget {
  const OffersScreen({super.key});

  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> {
  List<Offer>? _offers;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final o = await getIncomingOffers();
      if (mounted) setState(() { _offers = o; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _respond(Offer offer, String status) async {
    try {
      await respondOffer(offer.id, status);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(status == 'accepted' ? 'Teklif kabul edildi!' : 'Teklif reddedildi.'),
      ));
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Teklifler')),
        body: RefreshIndicator(
          onRefresh: _load,
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: kPrimary))
              : _offers == null || _offers!.isEmpty
                  ? const EmptyState(
                      icon: Icons.local_offer_outlined,
                      title: 'Henüz teklif yok',
                      subtitle: 'İşverenlerden gelen teklifler burada görünecek.',
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _offers!.length,
                      itemBuilder: (_, i) => _OfferCard(
                        offer: _offers![i],
                        onAccept: () => _respond(_offers![i], 'accepted'),
                        onReject: () => _respond(_offers![i], 'rejected'),
                      ),
                    ),
        ),
      );
}

class _OfferCard extends StatelessWidget {
  final Offer offer;
  final VoidCallback onAccept, onReject;
  const _OfferCard({required this.offer, required this.onAccept, required this.onReject});

  Color get _statusColor {
    switch (offer.status) {
      case 'accepted': return Colors.green;
      case 'rejected': return kDestructive;
      default: return kAccent;
    }
  }

  String get _statusLabel {
    switch (offer.status) {
      case 'accepted': return 'Kabul Edildi';
      case 'rejected': return 'Reddedildi';
      default: return 'Bekliyor';
    }
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () => context.push('/job/${offer.job?.id}'),
        child: Container(
          margin: const EdgeInsets.only(bottom: 14),
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
                    child: Text(offer.job?.title ?? 'İlan',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(_statusLabel,
                        style: TextStyle(
                            color: _statusColor, fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
              if (offer.job?.location != null) ...[
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 13, color: kMuted),
                    const SizedBox(width: 4),
                    Text(offer.job!.location, style: const TextStyle(color: kMuted, fontSize: 13)),
                  ],
                ),
              ],
              if (offer.status == 'pending') ...[
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: onReject,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: kDestructive,
                          side: const BorderSide(color: kDestructive),
                          minimumSize: const Size(0, 42),
                        ),
                        child: const Text('Reddet'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: onAccept,
                        style: ElevatedButton.styleFrom(minimumSize: const Size(0, 42)),
                        child: const Text('Kabul Et'),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      );
}
