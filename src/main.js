import MODULE_OVERRIDES from "generated/module-overrides.json";

window[__chunkIdentifier] = new Proxy([], {
  set(target, property, value) {
    if (property === "push") {
      return Reflect.set(target, property, function (...items) {
        for (const chunk of items) {
          const modules = chunk[1];

          for (const id in modules) {
            if (id in MODULE_OVERRIDES) {
              modules[id] = (0, eval)(MODULE_OVERRIDES[id]);
            }
          }
        }

        return value.call(target, ...items);
      });
    } else {
      return Reflect.set(target, property, value);
    }
  },
});
