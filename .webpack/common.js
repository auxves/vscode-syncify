const { resolve } = require("path");

module.exports = {
  stats: {
    warningsFilter: /Critical dependency: the request of a dependency is an expression/
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
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: "ts-loader"
      }
    ]
  },
  externals: {
    vscode: "commonjs vscode",
    "vscode-fsevents": "commonjs vscode-fsevents"
  }
};
