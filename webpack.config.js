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
  },
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
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "src/example.html"),
          to: path.resolve(__dirname, "dist/index.html"),
          toType: "file",
          force: true,
          noErrorOnMissing: true,
          globOptions: {}
        },
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
  devtool: "source-map",
  stats: "errors-only",
};
