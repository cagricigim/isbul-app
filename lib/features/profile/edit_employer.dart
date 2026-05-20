import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api.dart';
import '../../core/auth_provider.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class EditEmployerScreen extends StatefulWidget {
  const EditEmployerScreen({super.key});

  @override
  State<EditEmployerScreen> createState() => _EditEmployerScreenState();
}

class _EditEmployerScreenState extends State<EditEmployerScreen> {
  late final TextEditingController _companyCtrl;
  late final TextEditingController _titleCtrl;
  late final TextEditingController _sectorCtrl;
  late final TextEditingController _taxCtrl;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    final p = context.read<AuthProvider>().user?.employerProfile;
    _companyCtrl = TextEditingController(text: p?.companyName ?? '');
    _titleCtrl = TextEditingController(text: p?.title ?? '');
    _sectorCtrl = TextEditingController(text: p?.sector ?? '');
    _taxCtrl = TextEditingController(text: p?.taxNumber ?? '');
  }

  @override
  void dispose() {
    _companyCtrl.dispose();
    _titleCtrl.dispose();
    _sectorCtrl.dispose();
    _taxCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _loading = true);
    try {
      final user = await updateEmployerProfile({
        'companyName': _companyCtrl.text.trim(),
        'title': _titleCtrl.text.trim(),
        'sector': _sectorCtrl.text.trim(),
        'taxNumber': _taxCtrl.text.trim(),
      });
      if (!mounted) return;
      context.read<AuthProvider>().updateUser(user);
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Profil güncellendi!')));
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Firma Bilgilerini Düzenle')),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              TextFormField(
                controller: _companyCtrl,
                decoration: const InputDecoration(
                  labelText: 'Firma adı',
                  prefixIcon: Icon(Icons.business_outlined),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _titleCtrl,
                decoration: const InputDecoration(labelText: 'Ünvanınız'),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _sectorCtrl,
                decoration: const InputDecoration(labelText: 'Sektör'),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _taxCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Vergi numarası'),
              ),
              const SizedBox(height: 32),
              AppButton(label: 'Kaydet', onPressed: _save, loading: _loading),
            ],
          ),
        ),
      );
}
