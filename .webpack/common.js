const { resolve } = require("path");
const { TsConfigPathsPlugin } = require("awesome-typescript-loader");

module.exports = {
  stats: {
    warningsFilter: /(Critical dependency: the request of a dependency is an expression|Can't resolve 'original-fs')/
  },
  target: "node",
  entry: "./src/main.ts",
  output: {
    filename: "main.js",
    path: resolve(__dirname, "../dist"),
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "file:///[absolute-resource-path]"
  },
  resolve: {
    extensions: [".ts", ".js"],
    plugins: [new TsConfigPathsPlugin()]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: "ts-loader"
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        use: "raw-loader"
      }
    ]
  },
  externals: {
    vscode: "commonjs vscode",
    "vscode-fsevents": "commonjs vscode-fsevents"
  }
};
