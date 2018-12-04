  const presets = [
    require.resolve('@babel/preset-env'),
    require.resolve('@babel/preset-flow'),
    require.resolve('babel-preset-minify'),
  ];

  const plugins = [
    require.resolve('@babel/plugin-transform-runtime'),
    require.resolve('@babel/plugin-proposal-object-rest-spread'),
    require.resolve('@babel/plugin-transform-flow-strip-types'),
    require.resolve('@babel/plugin-proposal-class-properties'),
    require.resolve('@babel/plugin-proposal-optional-chaining'),
  ];

module.exports = { presets, plugins };