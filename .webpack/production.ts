import common from "./common";
import merge from "lodash/merge";
import { Configuration } from "webpack";

const config = merge<Configuration, Configuration>(common, {
  mode: "development",
  optimization: {
    minimize: true
  }
});

export default config;
