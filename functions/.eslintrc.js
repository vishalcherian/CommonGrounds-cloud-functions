module.exports = {
  root : true,
  env : {
    es6 : true,
    node : true
  },
  extends : [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'google'
  ],
  parser : '@typescript-eslint/parser',
  parserOptions : {
    project : [ 'tsconfig.json', 'tsconfig.dev.json' ],
    tsconfigRootDir : __dirname,
    sourceType : 'module'
  },
  ignorePatterns : [
    '/lib/**/*', // Ignore built files.
  ],
  plugins : [
    '@typescript-eslint',
    'import'
  ],
  rules : {
    'quotes' : [ 'warn', 'single' ],
    'object-curly-spacing' : [ 'error', 'always' ],
    'array-bracket-spacing' : [ 'error', 'always' ],
    'key-spacing' : [ 'error', { 'beforeColon' : true } ],
    'semi' : [ 'error', 'never' ],
    'indent' : [ 'error', 2, {
      FunctionExpression : { parameters : 'first' },
      SwitchCase : 1,
      ObjectExpression : 'first'
    } ],
    'comma-dangle' : 'off',
    'max-len' : [ 1, 120, 2, { ignoreComments : true } ],
    'arrow-parens' : [ 2, 'as-needed' ],
  }
}
