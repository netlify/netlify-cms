/* eslint global-require: 0 */

const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  module: {
    rules: [
      {
        test: /\.js?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        /* CSS loader for npm modules that are shipped with CSS that should be loaded without processing.
           List all of theme in the array
        */
        test: /\.css$/,
        include: [/redux-notifications/],
        use: [
          ...(process.env.NODE_ENV === 'production' ? [MiniCssExtractPlugin.loader] : ['style-loader']),
          "css-loader"
        ],
      },
      {
        /* We use PostCSS for CMS styles */
        test: /\.css$/,
        exclude: [/node_modules/],
        use: [
          ...(process.env.NODE_ENV === 'production' ? [MiniCssExtractPlugin.loader] : ['style-loader']),
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
          { loader: 'postcss-loader' },
        ],
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        exclude: [/node_modules/],
        loader: 'svg-inline-loader',
      },
    ],
  },
  plugins: [
    new webpack.IgnorePlugin(/^esprima$/, /js-yaml/), // Ignore Esprima import for js-yaml
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/), // Ignore all optional deps of moment.js
  ],
  target: 'web', // Make web variables accessible to webpack, e.g. window
};
