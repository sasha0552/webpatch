// create ast comparer function from ast-like object
function createAstComparer(object) {
  const evals = [];
  const statements = [];

  /////

  function walk(object, path = "node") {
    const isArray = Array.isArray(object);

    for (const [ key, value ] of Object.entries(object)) {
      const newPath = isArray ? `${path}[${key}]` : `${path}.${key}`;

      /////

      if (key.startsWith("$")) {
        const args = key.split("$").slice(1);

        if (args[0] === "eval") {
          // escaped string
          const body = JSON.stringify(value);

          // TODO: slow?
          statements.push(`if (!new Function("node", ${body})(${path})) {`);
          statements.push("  return false;");
          statements.push("}");
        }

        if (args[0] === "startsWith") {
          // escaped string
          const body = JSON.stringify(value);

          // specified key
          const pKey = args[1];

          // predicted path
          const pPath = isArray ? `${path}[${pKey}]` : `${path}.${pKey}`;

          // is string
          statements.push(`if (typeof ${pPath} !== "string") {`);
          statements.push("  return false;");
          statements.push("}");

          // starts with
          statements.push(`if (!${pPath}.startsWith(${body})) {`);
          statements.push("  return false;");
          statements.push("}");
        }

        // skip
        continue;
      }

      /////

      switch (typeof value) {
        // bigints
        case "bigint": {
          statements.push(`if (${newPath} !== ${value}n) {`);
          statements.push("  return false;");
          statements.push("}");
        } break;

        // primitives
        case "boolean":
        case "number":
        case "undefined": {
          statements.push(`if (${newPath} !== ${value}) {`);
          statements.push("  return false;");
          statements.push("}");
        } break;

        // objects
        case "object": {
          switch (true) {
            case value === null: {
              // is null
              statements.push(`if (${newPath} !== ${value}) {`);
              statements.push("  return false;");
              statements.push("}");
            } break;

            case Array.isArray(value): {
              // is array
              statements.push(`if (!Array.isArray(${newPath})) {`);
              statements.push("  return false;");
              statements.push("}");

              // length check
              statements.push(`if (${newPath}.length !== ${value.length}) {`);
              statements.push("  return false;");
              statements.push("}");
            } break;
    
            default: {
              // is object
              statements.push(`if (typeof ${newPath} !== "object") {`);
              statements.push("  return false;");
              statements.push("}");

              // is not null
              statements.push(`if (${newPath} === null) {`);
              statements.push("  return false;");
              statements.push("}");
            } break;
          }

          // walk over object
          walk(value, newPath);
        } break;

        // strings
        case "string": {
          // escaped string
          const body = JSON.stringify(value);

          statements.push(`if (${newPath} !== ${body}) {`);
          statements.push("  return false;");
          statements.push("}");
        } break;
      }
    }
  }

  // walk over initial object
  walk(object);

  // if all checks passed, return true
  statements.push("return true;");

  // compile function
  return new Function("node", statements.join("\n"));
}

module.exports = {
  createAstComparer,
};
