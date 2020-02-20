import common from "./common";
import merge from "lodash/merge";
import { Configuration } from "webpack";

const config = merge<Configuration, Configuration>(common, {
  mode: "development",
  devtool: "source-map"
});

export default config;
