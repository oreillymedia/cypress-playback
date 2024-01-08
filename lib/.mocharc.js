module.exports = {
  ignore: ['node_modules/**/*'],
  reporter: ['min'],
  require: [
    'chai/register-expect.js',
    'tests/setup.js'
  ],
  spec: ['**/*.spec.js']
};
