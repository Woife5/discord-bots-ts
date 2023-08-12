const REQUIRE_SHIM = 'import module from "module"; if(typeof globalThis.require === "undefined"){globalThis.require = module.createRequire(import.meta.url);}';
const DIRNAME_SHIM = 'if(typeof __dirname === "undefined"){globalThis.__dirname = new URL(".", import.meta.url).pathname;}';

const isProdBuild = process.argv[2] === "--prod";

console.log(`Building for ${isProdBuild ? "production" : "development"}...`);

import { build } from "esbuild";
build({
    entryPoints: ["src/willhaben-bot.ts"],
    bundle: true,
    minifyIdentifiers: false, // Setting this to true breaks Discord.js, maybe try again after an upgrade
    minifySyntax: isProdBuild,
    minifyWhitespace: isProdBuild,
    outfile: isProdBuild ? "index.js" : "index-dev.js",
    platform: "node",
    target: "node18",
    format: "esm",
    banner: {
        js: `${REQUIRE_SHIM};${DIRNAME_SHIM}`,
    },
});
