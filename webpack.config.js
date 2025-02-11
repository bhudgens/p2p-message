const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      path: require.resolve("path-browserify"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      querystring: require.resolve("querystring-es3"),
      buffer: require.resolve("buffer/"),
      url: require.resolve("url/"),
    },
  },
  entry: "./src/lib/messaging.js",
  output: {
    filename: "messaging.min.js",
    path: path.resolve(__dirname, "dist"),
    library: {
      name: "MessageClient",
      type: "var",
      export: "default",
    },
    iife: false,
    scriptType: 'text/javascript',
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "src/example.html"),
          to: path.resolve(__dirname, "dist/index.html"),
          toType: "file",
          force: true,
          noErrorOnMissing: true
        }
      ],
    }),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    }),
    new webpack.DefinePlugin({
      "process.env.NODE_DEBUG": false,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/u,
        exclude: /node_modules/u,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  devtool: "source-map",
  stats: "errors-only",
};

// Add a second configuration for docs output
const docsConfig = {
  ...module.exports,
  name: 'docs',
  output: {
    ...module.exports.output,
    path: path.resolve(__dirname, "docs"),
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "src/example.html"),
          to: path.resolve(__dirname, "docs/example.html"),
          toType: "file",
          force: true,
          noErrorOnMissing: true
        }
      ],
    }),
    ...module.exports.plugins,
  ],
};

module.exports = [module.exports, docsConfig];
