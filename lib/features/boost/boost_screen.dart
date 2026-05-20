import 'package:flutter/material.dart';
import '../../core/api.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class BoostScreen extends StatefulWidget {
  const BoostScreen({super.key});

  @override
  State<BoostScreen> createState() => _BoostScreenState();
}

class _BoostScreenState extends State<BoostScreen> {
  bool _loading = false;

  Future<void> _boost() async {
    setState(() => _loading = true);
    try {
      await purchaseBoost();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profiliniz öne çıkarıldı! 🚀')),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Profili Öne Çıkar')),
        body: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [kPrimary, kPrimaryDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: const [
                    Icon(Icons.rocket_launch_rounded, color: Colors.white, size: 56),
                    SizedBox(height: 16),
                    Text('Profilini Boost\'la!',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w800)),
                    SizedBox(height: 8),
                    Text(
                      '24 saat boyunca işveren aramalarında en üstte çıkın.',
                      style: TextStyle(color: Colors.white70, fontSize: 14),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              ...[
                ('🔝', 'Arama sonuçlarının en üstünde çık'),
                ('👁', 'Daha fazla işveren profilini gör'),
                ('⚡', '24 saat boyunca aktif'),
              ].map((f) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Row(
                      children: [
                        Text(f.$1, style: const TextStyle(fontSize: 24)),
                        const SizedBox(width: 16),
                        Text(f.$2,
                            style: const TextStyle(
                                fontSize: 15, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  )),
              const Spacer(),
              AppButton(
                label: 'Boost Satın Al — ₺29',
                onPressed: _boost,
                loading: _loading,
              ),
              const SizedBox(height: 12),
              const Text('Ödeme Google Play üzerinden yapılır.',
                  style: TextStyle(color: kMuted, fontSize: 12)),
            ],
          ),
        ),
      );
}
