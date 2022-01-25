const commonRules = {
  'indent': ['error', 2, { SwitchCase: 1, ignoredNodes: ['ConditionalExpression'] }],
  'linebreak-style': ['error', 'unix'],
  'quotes': ['error', 'single', { avoidEscape: true }],
  'semi': ['error', 'always']
};

module.exports = {
  env: {
    browser: false,
    node: true,
    commonjs: true,
    es2021: true
  },
  extends: 'eslint:recommended',
  parserOptions: { 'ecmaVersion': 13 },
  rules: {
    ...commonRules,
  },
  overrides: [
    {
      extends: [
        'eslint:recommended',
        'plugin:cypress/recommended',
      ],
      files: [
        'addCommands.js', 'commands/**/*.js'
      ],
    },
    {
      env: {
        node: true,
        es2021: true,
        commonjs: true,
        mocha: true
      },
      files: ['**/*.spec.js'],
      globals: {
        'expect': 'readonly',
        'td': 'readonly',
      },
      rules: {
        ...commonRules,
      }
    },
    {
      env: {
        node: true,
        es2021: true,
        commonjs: false
      },
      files: ['scripts/**/*.mjs'],
      parserOptions: {
        'sourceType': 'module'
      },
      rules: {
        ...commonRules
      }
    }
  ]
};
