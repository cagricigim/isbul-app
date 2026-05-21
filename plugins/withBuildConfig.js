const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withBuildConfig(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const pkg = config.android?.package || 'com.iscibul.app';

      // Strategy: replace BuildConfig references in generated Kotlin files
      // with hardcoded values. AGP 8.x has buildConfig=false by default and
      // enabling it via buildFeatures doesn't propagate to compileKotlin.
      //
      // Known fields in Expo SDK 54 / RN 0.81.5 templates:
      //   IS_NEW_ARCHITECTURE_ENABLED (Boolean) -> true
      //   IS_HERMES_ENABLED           (Boolean) -> true
      //   DEBUG                       (Boolean) -> false
      //   REACT_NATIVE_RELEASE_LEVEL  (String)  -> "release"   <-- RN 0.81+ specific!

      const ktFiles = [
        path.join(projectRoot, 'android', 'app', 'src', 'main', 'java',
          ...pkg.split('.'), 'MainActivity.kt'),
        path.join(projectRoot, 'android', 'app', 'src', 'main', 'java',
          ...pkg.split('.'), 'MainApplication.kt'),
      ];

      for (const filePath of ktFiles) {
        if (!fs.existsSync(filePath)) {
          console.warn('[withBuildConfig] Not found:', filePath);
          continue;
        }

        let src = fs.readFileSync(filePath, 'utf8');
        const original = src;

        // Remove BuildConfig import if present
        src = src.replace(/^import\s+\S*BuildConfig\s*\n/m, '');

        // Boolean fields
        src = src.replace(/BuildConfig\.IS_NEW_ARCHITECTURE_ENABLED/g, 'false');
        src = src.replace(/BuildConfig\.IS_HERMES_ENABLED/g, 'true');
        src = src.replace(/BuildConfig\.DEBUG/g, 'false');

        // String fields — MUST use string literal, not true/false
        // REACT_NATIVE_RELEASE_LEVEL is used as: BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase()
        // For release builds the value is "release" -> .uppercase() -> "RELEASE"
        src = src.replace(/BuildConfig\.REACT_NATIVE_RELEASE_LEVEL/g, '"release"');

        const remaining = (src.match(/BuildConfig\.\w+/g) || []);
        if (remaining.length > 0) {
          console.error('[withBuildConfig] STILL UNHANDLED refs in', path.basename(filePath), ':', remaining);
        }

        if (src !== original) {
          fs.writeFileSync(filePath, src);
          console.log('[withBuildConfig] Patched:', path.basename(filePath));
        } else {
          console.log('[withBuildConfig] No changes in:', path.basename(filePath));
        }
      }

      return config;
    },
  ]);
};
