import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api.dart';
import '../../core/auth_provider.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class WorkerOnboardScreen extends StatefulWidget {
  const WorkerOnboardScreen({super.key});

  @override
  State<WorkerOnboardScreen> createState() => _WorkerOnboardScreenState();
}

class _WorkerOnboardScreenState extends State<WorkerOnboardScreen> {
  final _bioCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  String? _gender;
  bool _loading = false;

  final _genders = [
    ('male', 'Erkek'),
    ('female', 'Kadın'),
    ('other', 'Belirtmek istemiyorum'),
  ];

  Future<void> _submit() async {
    if (_bioCtrl.text.trim().isEmpty || _locationCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lütfen tüm alanları doldurun.')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      final user = await updateWorkerProfile({
        'bio': _bioCtrl.text.trim(),
        'location': _locationCtrl.text.trim(),
        if (_gender != null) 'gender': _gender,
      });
      if (!mounted) return;
      context.read<AuthProvider>().updateUser(user);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('$e')));
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Profilini oluştur')),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('İşçi profilin',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              const Text('İşverenler seni burada görecek.',
                  style: TextStyle(color: kMuted)),
              const SizedBox(height: 28),
              TextFormField(
                controller: _bioCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Kendini tanıt *',
                  hintText: 'Tecrübelerini, becerilerini kısaca anlat...',
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _locationCtrl,
                decoration: const InputDecoration(
                  labelText: 'Konum *',
                  hintText: 'İstanbul, Kadıköy',
                  prefixIcon: Icon(Icons.location_on_outlined),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Cinsiyet',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: kMuted)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: _genders
                    .map((g) => ChoiceChip(
                          label: Text(g.$2),
                          selected: _gender == g.$1,
                          onSelected: (_) => setState(() => _gender = g.$1),
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
