import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import '../../core/api.dart';
import '../../core/auth_provider.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class CodeScreen extends StatefulWidget {
  final Map<String, String> phone;
  const CodeScreen({super.key, required this.phone});

  @override
  State<CodeScreen> createState() => _CodeScreenState();
}

class _CodeScreenState extends State<CodeScreen> {
  String _code = '';
  bool _loading = false;

  String get _phone => widget.phone['phone'] ?? '';
  String get _requestId => widget.phone['requestId'] ?? '';
  String get _devCode => widget.phone['devCode'] ?? '';

  Future<void> _submit() async {
    if (_code.length < 6) return;
    setState(() => _loading = true);
    try {
      final res = await verifyCode(_requestId, _code);
      if (!mounted) return;
      final token = res['token'] as String;
      final user = AppUser.fromJson(res['user'] as Map<String, dynamic>);
      await context.read<AuthProvider>().loginWithToken(token, user);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Kod hatalı: $e')),
      );
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Kodu girin',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Text(
                  '$_phone numarasına gönderilen 6 haneli kodu girin.',
                  style: const TextStyle(color: kMuted, fontSize: 15),
                ),
                if (_devCode.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text('Test kodu: $_devCode',
                        style: const TextStyle(
                            color: kPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                  ),
                const SizedBox(height: 32),
                PinCodeTextField(
                  appContext: context,
                  length: 6,
                  keyboardType: TextInputType.number,
                  animationType: AnimationType.fade,
                  pinTheme: PinTheme(
                    shape: PinCodeFieldShape.box,
                    borderRadius: BorderRadius.circular(10),
                    fieldHeight: 54,
                    fieldWidth: 46,
                    activeFillColor: Colors.white,
                    inactiveFillColor: Colors.white,
                    selectedFillColor: Colors.white,
                    activeColor: kPrimary,
                    inactiveColor: kBorder,
                    selectedColor: kPrimary,
                  ),
                  enableActiveFill: true,
                  onCompleted: (val) {
                    setState(() => _code = val);
                    _submit();
                  },
                  onChanged: (val) => setState(() => _code = val),
                ),
                const SizedBox(height: 24),
                AppButton(
                  label: 'Doğrula',
                  onPressed: _code.length == 6 ? _submit : null,
                  loading: _loading,
                ),
              ],
            ),
          ),
        ),
      );
}
