import { resolve } from "path";
import { TsConfigPathsPlugin } from "awesome-typescript-loader";
import { Configuration } from "webpack";
import { CleanWebpackPlugin } from "clean-webpack-plugin";

const config: Configuration = {
	target: "node",
	entry: "./src/main.ts",
	output: {
		filename: "main.js",
		path: resolve(__dirname, "../dist"),
		libraryTarget: "commonjs2",
		devtoolModuleFilenameTemplate: "file:///[absolute-resource-path]",
	},
	resolve: {
		extensions: [".ts", ".js"],
		plugins: [new TsConfigPathsPlugin()],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				loader: "ts-loader",
			},
		],
	},
	plugins: [new CleanWebpackPlugin()],
	externals: {
		vscode: "commonjs vscode",
	},
};

export default config;
