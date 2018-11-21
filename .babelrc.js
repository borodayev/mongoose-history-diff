  const presets = [
    require.resolve('@babel/preset-env'),
    require.resolve('@babel/preset-flow'),
  ];

  const plugins = [
    require.resolve('@babel/plugin-transform-runtime'),
    require.resolve('@babel/plugin-proposal-object-rest-spread'),
    require.resolve('@babel/plugin-transform-flow-strip-types'),
    require.resolve('@babel/plugin-proposal-class-properties'),
    require.resolve('@babel/plugin-proposal-optional-chaining'),
  ];

module.exports = { presets, plugins };