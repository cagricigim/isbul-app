import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api.dart';
import '../../core/auth_provider.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class EmployerOnboardScreen extends StatefulWidget {
  const EmployerOnboardScreen({super.key});

  @override
  State<EmployerOnboardScreen> createState() => _EmployerOnboardScreenState();
}

class _EmployerOnboardScreenState extends State<EmployerOnboardScreen> {
  final _companyCtrl = TextEditingController();
  final _titleCtrl = TextEditingController();
  final _sectorCtrl = TextEditingController();
  bool _loading = false;

  final _sectors = [
    'İnşaat', 'Temizlik', 'Güvenlik', 'Taşımacılık',
    'Üretim', 'Perakende', 'Yiyecek & İçecek', 'Diğer'
  ];

  Future<void> _submit() async {
    if (_companyCtrl.text.trim().isEmpty || _titleCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lütfen zorunlu alanları doldurun.')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      final user = await updateEmployerProfile({
        'companyName': _companyCtrl.text.trim(),
        'title': _titleCtrl.text.trim(),
        if (_sectorCtrl.text.isNotEmpty) 'sector': _sectorCtrl.text.trim(),
      });
      if (!mounted) return;
      context.read<AuthProvider>().updateUser(user);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Firma bilgileri')),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('İşveren profilin',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              const Text('İşçiler seni burada görecek.',
                  style: TextStyle(color: kMuted)),
              const SizedBox(height: 28),
              TextFormField(
                controller: _companyCtrl,
                decoration: const InputDecoration(
                  labelText: 'Firma adı *',
                  prefixIcon: Icon(Icons.business_outlined),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _titleCtrl,
                decoration: const InputDecoration(
                  labelText: 'Ünvanınız *',
                  hintText: 'İnsan Kaynakları Müdürü',
                ),
              ),
              const SizedBox(height: 16),
              const Text('Sektör',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: kMuted)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: _sectors
                    .map((s) => ChoiceChip(
                          label: Text(s),
                          selected: _sectorCtrl.text == s,
                          onSelected: (_) => setState(() => _sectorCtrl.text = s),
                          selectedColor: kPrimary.withOpacity(0.15),
                        ))
                    .toList(),
              ),
              const SizedBox(height: 32),
              AppButton(label: 'Profili oluştur', onPressed: _submit, loading: _loading),
            ],
          ),
        ),
      );
}
