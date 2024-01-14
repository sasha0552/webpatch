module.exports = [
  // replace application title
  {
    comparer: {
      type: "Property",

      key: {
        type: "Identifier",
        name: "base",
      },

      value: {
        type: "ConditionalExpression",

        alternate: {
          type: "Literal",
          value: "Discord",
        },
      },
    },

    mutator(node, options) {
      node.value.alternate.value = options?.manifest?.productName || "Discord";
    },
  },
];
