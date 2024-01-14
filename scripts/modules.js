const fs = require("fs/promises");
const path = require("path");

const acorn = require("acorn");
const awalk = require("acorn-walk");
const commander = require("commander");
const terser = require("terser");

const { createAstComparer } = require("./lib/ast.js");
const { evalInContext } = require("./lib/eval.js");

// use comparers & mutators on single module, and return modified code (or null if not modified)
async function compareAndMutate(script, array, options) {
  let mutated, isFunction;

  // anonymous functions are not valid on top-level
  if (script.startsWith("function")) {
    script = "0," + script;
    isFunction = true;
  }

  // parse ast
  let ast = acorn.parse(script, { ecmaVersion: "latest" });

  // walk through ast
  awalk.full(ast, (node) => {
    for (const [comparer, mutator] of array) {
      if (comparer(node)) {
        mutator(node, options);
        mutated = true;
      }
    }
  });

  // if any mutator applied
  if (mutated) {
    // drop "0,"
    if (isFunction) {
      ast = ast.body[0].expression.expressions[1];
    }

    // generate code from ast
    const { code } = await terser.minify(ast, { parse: { spidermonkey: true }, compress: false, mangle: false });

    // return code
    return code;
  }

  // return null if not modified
  return null;
}

// load webpack modules with specified chunk identifier from directory, and return modules
async function loadModules(dirPath, chunkIdentifier) {
  // eval context
  const context = {};

  // object with modules
  const modules = {};

  // load chunks
  for (const fileName of await fs.readdir(dirPath)) {
    const filePath = path.join(dirPath, fileName);

    // evaluate every matching chunk
    if (fileName.endsWith(".js") && !fileName.endsWith(".worker.js")) {
      const fileContent = await fs.readFile(filePath, "utf-8");

      // minified chunk
      if (fileContent.includes(`(this.${chunkIdentifier}=this.${chunkIdentifier}||[]).push([`)) {
        evalInContext(fileContent, context);
      }

      // unminified chunk
      if (fileContent.includes(`(this.${chunkIdentifier} = this.${chunkIdentifier} || []).push([`)) {
        evalInContext(fileContent, context);
      }
    }
  }

  // fill modules object based on chunks
  for (const [chunkIds, moreModules] of context[chunkIdentifier]) {
    for (const moduleId in moreModules) {
      modules[moduleId] = moreModules[moduleId];
    }
  }

  // return object with modules
  return modules;
}

// load ast comparers & mutators from directory, and return array with comparers & mutators
async function loadPatches(dirPath) {
  // array with patches
  const patches = [];

  // load patches
  for (const fileName of await fs.readdir(dirPath)) {
    const filePath = path.resolve(dirPath, fileName);

    // load every js file
    if (fileName.endsWith(".js")) {
      // load patch
      const filePatches = require(filePath);

      for (const { comparer, mutator } of filePatches) {
        // add patch to array
        patches.push([createAstComparer(comparer), mutator]);
      }
    }
  }

  // return filled array with patches
  return patches;
}

// save modules to filesystem
async function saveModules(modules, dirPath) {
  for (const [id, module] of Object.entries(modules)) {
    await fs.writeFile(path.join(dirPath, id.toString() + ".js"), module.toString());
  }
}

// apply ast comparers & mutators on modules, and return modified modules
async function patchModules(modules, patches, options) {
  // object with patched modules
  const patchedModules = {};

  // patch modules
  for (const [id, module] of Object.entries(modules)) {
    const patchedModule = await compareAndMutate(module.toString(), patches, options);

    if (patchedModule) {
      patchedModules[id] = patchedModule;
    }
  }

  // return object with patched modules
  return patchedModules;
}

// dump modules to directory
async function actionDump(options) {
  // load modules
  const modules = await loadModules(options.input, options.chunkIdentifier);

  // create directory if not exists
  await fs.mkdir(options.output, { recursive: true });

  // dump modules to fs
  await saveModules(modules, options.output);  
}

// generate module overrides
async function actionOverrides(options) {
  // load modules
  const modules = await loadModules(options.input, options.chunkIdentifier);

  // load patches
  const patches = await loadPatches(options.patches);

  // patch modules
  const patchedModules = await patchModules(modules, patches, { manifest: JSON.parse(options.manifest) });

  // create directory if not exists
  await fs.mkdir(path.dirname(options.output), { recursive: true });

  // save module overrides to file
  await fs.writeFile(options.output, JSON.stringify(patchedModules));
}

// add specied module file to overrides
async function actionAddOverride(options) {
  // load module
  const module = await fs.readFile(options.input, "utf-8");

  // module overrides
  let moduleOverrides = null;
  
  // try to load existing overrides
  try {
    moduleOverrides = JSON.parse(await fs.readFile(options.output, "utf-8"));
  } catch (e) {
    moduleOverrides = {};
  }

  // add module to overrides
  moduleOverrides[options.moduleId] = module;

  // create directory if not exists
  await fs.mkdir(path.dirname(options.output), { recursive: true });

  // write modified overrides
  await fs.writeFile(options.output, JSON.stringify(moduleOverrides));
}


// define subcommand "dump"
commander.program
  .command("dump")
  .description("Dump modules to directory")
  .requiredOption("-i, --input <directory>", "input modules", "tmp/assets")
  .requiredOption("-p, --patches <directory>", "input patches", "src/patches")
  .requiredOption("-ci, --chunk-identifier <string>", "chunk identifier", "webpackChunkdiscord_app")
  .requiredOption("-o, --output <directory>", "output directory", "tmp/modules")
  .action(actionDump);

// define subcommand "overrides"
commander.program
  .command("overrides")
  .description("Generate module overrides")
  .requiredOption("-i, --input <directory>", "input modules", "tmp/assets")
  .requiredOption("-p, --patches <directory>", "input patches", "src/patches")
  .requiredOption("-ci, --chunk-identifier <string>", "chunk identifier", "webpackChunkdiscord_app")
  .requiredOption("-m, --manifest <json>", "manifest", "{}")
  .requiredOption("-o, --output <file>", "output file", "tmp/generated/module-overrides.json")
  .action(actionOverrides);

// define subcommand "add-override"
commander.program
  .command("add-override")
  .description("Generate module overrides")
  .requiredOption("-i, --input <file>", "input module")
  .requiredOption("-mi, --module-id <number>", "module id")
  .requiredOption("-o, --output <file>", "output file", "tmp/generated/module-overrides.json")
  .action(actionAddOverride);

// run program
commander.program
  .parse();
