import common from "./common";
import { merge } from "webpack-merge";
import TerserPlugin from "terser-webpack-plugin";

const config = merge(common, {
	mode: "production",
	optimization: {
		minimizer: [
			new TerserPlugin({
				cache: false,
				sourceMap: true,
				extractComments: true,
				terserOptions: {
					ecma: 2017,
					mangle: false,
					keep_classnames: true,
					keep_fnames: true,
				},
			}),
		],
	},
});

export default config;
