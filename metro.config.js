const { getDefaultConfig } = require("expo/metro-config");
  const path = require("path");

  const projectRoot = __dirname;

  const config = getDefaultConfig(projectRoot);

  // Resolve @workspace/api-client-react from local lib directory
  config.resolver.extraNodeModules = {
    "@workspace/api-client-react": path.resolve(projectRoot, "lib/api-client-react"),
  };

  module.exports = config;
  