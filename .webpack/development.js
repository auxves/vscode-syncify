const common = require("./common");
const merge = require("lodash/merge");

module.exports = merge(common, {
  mode: "development",
  devtool: "source-map"
});
