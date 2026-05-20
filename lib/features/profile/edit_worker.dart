import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api.dart';
import '../../core/auth_provider.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class EditWorkerScreen extends StatefulWidget {
  const EditWorkerScreen({super.key});

  @override
  State<EditWorkerScreen> createState() => _EditWorkerScreenState();
}

class _EditWorkerScreenState extends State<EditWorkerScreen> {
  late final TextEditingController _bioCtrl;
  late final TextEditingController _locationCtrl;
  late final TextEditingController _skillCtrl;
  List<String> _skills = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    final p = context.read<AuthProvider>().user?.workerProfile;
    _bioCtrl = TextEditingController(text: p?.bio ?? '');
    _locationCtrl = TextEditingController(text: p?.location ?? '');
    _skillCtrl = TextEditingController();
    _skills = List<String>.from(p?.skills ?? []);
  }

  @override
  void dispose() {
    _bioCtrl.dispose();
    _locationCtrl.dispose();
    _skillCtrl.dispose();
    super.dispose();
  }

  void _addSkill() {
    final s = _skillCtrl.text.trim();
    if (s.isEmpty || _skills.contains(s)) return;
    setState(() { _skills.add(s); _skillCtrl.clear(); });
  }

  Future<void> _save() async {
    setState(() => _loading = true);
    try {
      final user = await updateWorkerProfile({
        'bio': _bioCtrl.text.trim(),
        'location': _locationCtrl.text.trim(),
        'skills': _skills,
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
        appBar: AppBar(title: const Text('Profili Düzenle')),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextFormField(
                controller: _bioCtrl,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Hakkında',
                  hintText: 'Kendini ve deneyimlerini anlat...',
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _locationCtrl,
                decoration: const InputDecoration(
                  labelText: 'Konum',
                  prefixIcon: Icon(Icons.location_on_outlined),
                ),
              ),
              const SizedBox(height: 20),
              const Text('Beceriler',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _skillCtrl,
                      decoration: const InputDecoration(hintText: 'Beceri ekle...'),
                      onSubmitted: (_) => _addSkill(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _addSkill,
                    style: ElevatedButton.styleFrom(minimumSize: const Size(0, 48)),
                    child: const Icon(Icons.add),
                  ),
                ],
              ),
              if (_skills.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _skills
                      .map((s) => Chip(
                            label: Text(s),
                            deleteIcon: const Icon(Icons.close, size: 14),
                            onDeleted: () => setState(() => _skills.remove(s)),
                          ))
                      .toList(),
                ),
              ],
              const SizedBox(height: 32),
              AppButton(label: 'Kaydet', onPressed: _save, loading: _loading),
            ],
          ),
        ),
      );
}
