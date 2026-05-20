# İşine Bak — Flutter

Android app for İşine Bak (işçi-işveren buluşma platformu).

## Stack

- Flutter 3.24+
- go_router (routing)
- provider (state management)
- http (API calls)
- flutter_secure_storage (JWT)
- purchases_flutter (RevenueCat)
- pin_code_fields (OTP)

## API

Production: `https://api.isinebakk.app`

## Build (Codemagic)

1. [codemagic.io](https://codemagic.io) → New project → Repository URL
2. Environment variables (group: `isbul_secrets`):
   - `REVENUECAT_ANDROID_KEY` — RevenueCat Android API key
   - `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` — Google Play JSON key (base64)
3. Select workflow `android-release` → Start build

## Local setup (macOS/Linux)

```bash
flutter pub get
flutter run --release
```

## Project structure

```
lib/
├── main.dart               # Entry point
├── core/
│   ├── api.dart            # HTTP client + all API calls + models
│   ├── auth_provider.dart  # Auth state (Provider)
│   ├── router.dart         # go_router with redirect guards
│   ├── theme.dart          # Colors, ThemeData
│   └── widgets.dart        # Shared UI components
└── features/
    ├── auth/               # phone → code → role
    ├── onboard/            # worker_onboard, employer_onboard
    ├── home/               # tab container, employer_home, worker_home
    ├── jobs/               # list, detail, new
    ├── workers/            # list, detail
    ├── chat/               # chat screen
    ├── messages/           # conversation list
    ├── profile/            # profile, edit_worker, edit_employer
    ├── offers/             # incoming offers
    ├── premium/            # subscription screen
    ├── boost/              # profile boost
    └── settings/           # settings
```
