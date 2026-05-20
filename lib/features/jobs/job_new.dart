import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class JobNewScreen extends StatefulWidget {
  const JobNewScreen({super.key});

  @override
  State<JobNewScreen> createState() => _JobNewScreenState();
}

class _JobNewScreenState extends State<JobNewScreen> {
  final _titleCtrl = TextEditingController();
  final _positionCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _salaryMinCtrl = TextEditingController();
  final _salaryMaxCtrl = TextEditingController();
  String _type = 'fullTime';
  String _category = 'Genel';
  bool _loading = false;

  final _types = [('fullTime', 'Tam zamanlı'), ('partTime', 'Yarı zamanlı'), ('daily', 'Günlük')];
  final _categories = ['İnşaat', 'Temizlik', 'Güvenlik', 'Taşımacılık', 'Üretim', 'Genel'];

  Future<void> _submit() async {
    if (_titleCtrl.text.isEmpty || _locationCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lütfen zorunlu alanları doldurun.')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      await createJob({
        'title': _titleCtrl.text.trim(),
        'position': _positionCtrl.text.trim(),
        'location': _locationCtrl.text.trim(),
        'employmentType': _type,
        'category': _category,
        if (_salaryMinCtrl.text.isNotEmpty)
          'salaryMin': int.tryParse(_salaryMinCtrl.text) ?? 0,
        if (_salaryMaxCtrl.text.isNotEmpty)
          'salaryMax': int.tryParse(_salaryMaxCtrl.text) ?? 0,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('İlan oluşturuldu!')),
      );
      context.pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Yeni İlan')),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextFormField(
                controller: _titleCtrl,
                decoration: const InputDecoration(labelText: 'İlan başlığı *'),
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _positionCtrl,
                decoration: const InputDecoration(labelText: 'Pozisyon'),
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _locationCtrl,
                decoration: const InputDecoration(
                  labelText: 'Konum *',
                  prefixIcon: Icon(Icons.location_on_outlined),
                ),
              ),
              const SizedBox(height: 20),
              const Text('Çalışma tipi',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: kMuted)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: _types
                    .map((t) => ChoiceChip(
                          label: Text(t.$2),
                          selected: _type == t.$1,
                          onSelected: (_) => setState(() => _type = t.$1),
                          selectedColor: kPrimary.withOpacity(0.15),
                        ))
                    .toList(),
              ),
              const SizedBox(height: 20),
              const Text('Kategori',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: kMuted)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: _categories
                    .map((c) => ChoiceChip(
                          label: Text(c),
                          selected: _category == c,
                          onSelected: (_) => setState(() => _category = c),
                          selectedColor: kPrimary.withOpacity(0.15),
                        ))
                    .toList(),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _salaryMinCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Min. maaş (₺)',
                        prefixText: '₺',
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _salaryMaxCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Max. maaş (₺)',
                        prefixText: '₺',
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              AppButton(label: 'İlanı yayınla', onPressed: _submit, loading: _loading),
            ],
          ),
        ),
      );
}
