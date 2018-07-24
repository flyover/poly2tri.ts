/// <reference types="node" />
/// <reference types="systemjs" />

process.chdir(__dirname);

require('source-map-support').install();

global["performance"] = require("perf_hooks").performance;

// global["fetch"] = require("node-fetch");
global["fetch"] = (url) => {
  return new Promise((resolve, reject) => {
    const fs = require('fs');
    if (!fs.existsSync(url)) {
      reject(`File not found: ${url}`);
    }
    const readStream = fs.createReadStream(url);
    readStream.on('open', function () {
      const Response = require('node-fetch').Response;
      resolve(new Response(readStream, {
        status: 200,
        statusText: 'OK'
      }));
    });
  });
};

global["SystemJS"] = require("systemjs");

const args = process.argv.slice(1);

const transpile = !false; // args.indexOf("transpile") !== -1;
if (transpile) {
  SystemJS.config({
    map: { "typescript": "../node_modules/typescript" },
    // map: { "typescript": "https://cdn.jsdelivr.net/npm/typescript@2.9.2" },
    packages: { "typescript": { main: "lib/typescript.js", meta: { "lib/typescript.js": { exports: "ts" } } } },
  });
  SystemJS.config({
    map: { "plugin-typescript": "../node_modules/plugin-typescript" },
    // map: { "plugin-typescript": "https://cdn.jsdelivr.net/npm/plugin-typescript@8.0.0" },
    packages: { "plugin-typescript": { main: "lib/plugin.js" } },
    transpiler: "plugin-typescript",
    typescriptOptions: { tsconfig: true, module: "system" }
  });
} else {
  SystemJS.config({
    baseURL: "."
  });
}

SystemJS.config({
  map: { "poly2tri": "../poly2tri/" },
  packages: { "poly2tri": { main: "poly2tri", defaultExtension: transpile ? "ts" : "js" } }
});

SystemJS.config({
  map: { "main": "./" },
  packages: { "main": { main: "main", defaultExtension: transpile ? "ts" : "js" } }
});

SystemJS.import("main")
  .then((main) => {
    main.default(...args)
      .then(console.log);
  });
