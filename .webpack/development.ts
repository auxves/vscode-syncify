import common from "./common";
import merge from "webpack-merge";
import webpack from "webpack";

const config = merge(common, {
	mode: "development",
	devtool: "source-map",
	plugins: [
		new webpack.SourceMapDevToolPlugin({
			filename: null,
			exclude: /node_modules/,
			test: /\.ts($|\?)/i
		})
	]
});

export default config;
