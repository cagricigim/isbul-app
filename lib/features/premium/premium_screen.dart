import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class PremiumScreen extends StatelessWidget {
  const PremiumScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Premium Üyelik')),
        body: SingleChildScrollView(
          child: Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [kPrimary, kPrimaryDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  children: const [
                    Icon(Icons.star_rounded, color: Colors.white, size: 56),
                    SizedBox(height: 16),
                    Text('İşine Bak Premium',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.w800)),
                    SizedBox(height: 8),
                    Text(
                      'Tüm özelliklere sınırsız erişim',
                      style: TextStyle(color: Colors.white70, fontSize: 15),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Premium avantajları',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 20),
                    ...[
                      ('Sınırsız teklif gönderme', Icons.send_rounded),
                      ('Profilinizi öne çıkarın', Icons.rocket_launch_rounded),
                      ('Kim profilinizi gördü', Icons.visibility_rounded),
                      ('Öncelikli arama sıralaması', Icons.trending_up_rounded),
                      ('Gelişmiş filtreler', Icons.filter_list_rounded),
                      ('7/24 öncelikli destek', Icons.support_agent_rounded),
                    ].map((f) => Padding(
                          padding: const EdgeInsets.only(bottom: 14),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: kPrimary.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(f.$2, color: kPrimary, size: 20),
                              ),
                              const SizedBox(width: 14),
                              Text(f.$1,
                                  style: const TextStyle(
                                      fontSize: 15, fontWeight: FontWeight.w500)),
                            ],
                          ),
                        )),
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: kPrimary.withOpacity(0.06),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: kPrimary.withOpacity(0.3)),
                      ),
                      child: Column(
                        children: [
                          const Text('Aylık',
                              style: TextStyle(color: kMuted, fontSize: 13)),
                          const SizedBox(height: 4),
                          const Text('₺149',
                              style: TextStyle(
                                  fontSize: 36,
                                  fontWeight: FontWeight.w800,
                                  color: kPrimary)),
                          const Text('/ay', style: TextStyle(color: kMuted)),
                          const SizedBox(height: 16),
                          AppButton(
                            label: 'Premium\'a Geç',
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Ödeme işlemi başlatılıyor...')),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Center(
                      child: Text(
                        'İstediğiniz zaman iptal edebilirsiniz.',
                        style: TextStyle(color: kMuted, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
}
