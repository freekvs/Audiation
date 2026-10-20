const { withAppBuildGradle } = require('expo/config-plugins');

/** Keep Play from serving ABI/density/language splits; those crash this app on 16 KB devices. */
function withPlayNativeLibs(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }
    if (config.modResults.contents.includes('abi { enableSplit = false }')) {
      return config;
    }
    config.modResults.contents = config.modResults.contents.replace(
      /android\s*\{/,
      (block) => `${block}
    bundle {
        abi { enableSplit = false }
        density { enableSplit = false }
        language { enableSplit = false }
    }
`,
    );
    return config;
  });
}

module.exports = withPlayNativeLibs;
