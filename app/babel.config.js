module.exports = function (api) {
  api.cache(true);

  const isWeb =
    process.env.WEBPACK_DEV_SERVER === 'true' || process.env.PLATFORM === 'web';

  const plugins = [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './src',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ];

  if (isWeb) {
    plugins.push([
      function () {
        return {
          visitor: {
            MetaProperty(path) {
              if (
                path.node.meta.name === 'import' &&
                path.node.property.name === 'meta'
              ) {
                path.replaceWith(
                  require('@babel/types').objectExpression([
                    require('@babel/types').objectProperty(
                      require('@babel/types').identifier('url'),
                      require('@babel/types').stringLiteral(''),
                    ),
                  ]),
                );
              }
            },
          },
        };
      },
    ]);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
