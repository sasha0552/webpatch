const alias = require("@rollup/plugin-alias");
const json = require("@rollup/plugin-json");
const replace = require("@rollup/plugin-replace");
const terser = require("@rollup/plugin-terser");

module.exports = {
  input: "src/main.js",

  output: {
    file: "dist/bundle.js",
    format: "iife",
  },

  plugins: [
    alias({
      entries: [
        { find: "generated", replacement: "tmp/generated" },
      ],
    }),
    json(),
    replace({
      preventAssignment: true,
      values: {
        __chunkIdentifier: JSON.stringify("webpackChunkdiscord_app"),
      },
    }),
    terser(),
  ],
};
