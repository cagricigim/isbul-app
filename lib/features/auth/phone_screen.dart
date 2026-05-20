import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class PhoneScreen extends StatefulWidget {
  const PhoneScreen({super.key});

  @override
  State<PhoneScreen> createState() => _PhoneScreenState();
}

class _PhoneScreenState extends State<PhoneScreen> {
  final _ctrl = TextEditingController(text: '+90');
  bool _loading = false;

  Future<void> _submit() async {
    final phone = _ctrl.text.replaceAll(' ', '');
    if (phone.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lütfen geçerli bir telefon numarası girin.')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      final res = await requestCode(phone);
      if (!mounted) return;
      context.push('/auth/code', extra: {
        'phone': phone,
        'requestId': res['requestId'] as String,
        'devCode': res['devCode'] as String? ?? '',
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('SMS gönderilemedi: $e')),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Spacer(),
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: kPrimary,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.work_rounded, color: Colors.white, size: 30),
                ),
                const SizedBox(height: 24),
                const Text('İşine Bak\'a\nhoş geldiniz',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, height: 1.2)),
                const SizedBox(height: 12),
                const Text(
                  'Devam etmek için telefon numaranızı girin.',
                  style: TextStyle(color: kMuted, fontSize: 15),
                ),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _ctrl,
                  keyboardType: TextInputType.phone,
                  autofocus: true,
                  maxLength: 13,
                  decoration: const InputDecoration(
                    labelText: 'Telefon numaranız',
                    prefixIcon: Icon(Icons.phone_outlined),
                    counterText: '',
                  ),
                ),
                const SizedBox(height: 16),
                AppButton(label: 'Devam et', onPressed: _submit, loading: _loading),
                const Spacer(),
                const Center(
                  child: Text(
                    'Devam ederek Kullanım Koşullarını kabul etmiş olursunuz.',
                    style: TextStyle(color: kMuted, fontSize: 12),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      );
}
