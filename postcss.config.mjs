/**
 * PostCSS preset-env config
 * @see Docs {@link https://github.com/csstools/postcss-plugins/blob/main/plugin-packs/postcss-preset-env/README.md#options}
 * @see Features Flags {@link https://github.com/csstools/postcss-plugins/blob/main/plugin-packs/postcss-preset-env/FEATURES.md}
 * @type {import('postcss-preset-env').pluginOptions}
 */
const presetEnvConfig = {
  autoprefixer: {
    flexbox: "no-2009",
  },
  stage: 3,
  features: {
    "custom-properties": false,
    "custom-media-queries": true,
    "nesting-rules": true,
  },
}

const postcssConfig = {
  // NOTE: Order is important
  plugins: {
    "@tailwindcss/postcss": {},
    // NOTE: This has to be last config
    "postcss-preset-env": presetEnvConfig,
  },
}

export default postcssConfig
