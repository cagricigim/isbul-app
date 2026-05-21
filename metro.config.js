const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch only specific monorepo packages that the app actually imports,
// not the entire monorepo root (which causes Metro to crash on temp files).
const monorepoPackages = [
  path.resolve(monorepoRoot, "lib/api-client-react"),
];

config.watchFolders = monorepoPackages;

// Enable symlink following so Metro can resolve assets (e.g. Feather.ttf)
// inside pnpm's symlinked node_modules.
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
