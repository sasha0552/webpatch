module.exports = [
  // remove hardcoded protocol
  {
    comparer: {
      type: "VariableDeclarator",

      init: {
        type: "CallExpression",

        callee: {
          type: "MemberExpression",

          object: {
            type: "Literal",
            value: "wss:",
          },

          property: {
            type: "Identifier",
            name: "concat",
          },
        },

        arguments: [
          {
            type: "MemberExpression",

            object: {
              type: "MemberExpression",

              object: {
                type: "Identifier",
                name: "window",
              },

              property: {
                type: "Identifier",
                name: "GLOBAL_ENV",
              },
            },

            property: {
              type: "Identifier",
              name: "REMOTE_AUTH_ENDPOINT",
            },
          },

          {
            type: "Literal",
            value: "/?v=2",
          },
        ],
      },
    },

    mutator(node, options) {
      node.init.callee.object.value = "";
    },
  },

  // replace cdn urls
  {
    comparer: {
      type: "Literal",
      $startsWith$value: "https://cdn.discordapp.com",
    },

    mutator(node) {
      // change literal type
      node.type = "TemplateLiteral";

      // add expressions
      node.expressions = [
        {
          type: "MemberExpression",

          object: {
            type: "Identifier",
            name: "location",
          },

          property: {
            type: "Identifier",
            name: "protocol",
          },
        },

        {
          type: "MemberExpression",

          object: {
            type: "MemberExpression",

            object: {
              type: "Identifier",
              name: "window",
            },

            property: {
              type: "Identifier",
              name: "GLOBAL_ENV",
            },
          },

          property: {
            type: "Identifier",
            name: "CDN_HOST",
          },
        },
      ];

      // add quasis (strings)
      node.quasis = [
        {
          type: "TemplateElement",

          value: {
            cooked: "",
          },
        },

        {
          type: "TemplateElement",

          value: {
            cooked: "//",
          },
        },

        {
          type: "TemplateElement",

          value: {
            cooked: node.value.replace("https://cdn.discordapp.com", ""),
          },
        },
      ];

      // remove literal value
      node.value = undefined;
    },
  },

  // replace media urls
  {
    comparer: {
      type: "Literal",
      $startsWith$value: "https://media.discordapp.net",
    },

    mutator(node) {
      // change literal type
      node.type = "TemplateLiteral";

      // add expressions
      node.expressions = [
        {
          type: "MemberExpression",

          object: {
            type: "Identifier",
            name: "location",
          },

          property: {
            type: "Identifier",
            name: "protocol",
          },
        },

        {
          type: "MemberExpression",

          object: {
            type: "MemberExpression",

            object: {
              type: "Identifier",
              name: "window",
            },

            property: {
              type: "Identifier",
              name: "GLOBAL_ENV",
            },
          },

          property: {
            type: "Identifier",
            name: "MEDIA_PROXY_ENDPOINT",
          },
        },
      ];

      // add quasis (strings)
      node.quasis = [
        {
          type: "TemplateElement",

          value: {
            cooked: "",
          },
        },

        {
          type: "TemplateElement",

          value: {
            cooked: "",
          },
        },

        {
          type: "TemplateElement",

          value: {
            cooked: node.value.replace("https://media.discordapp.net", ""),
          },
        },
      ];

      // remove literal value
      node.value = undefined;
    },
  },
];
