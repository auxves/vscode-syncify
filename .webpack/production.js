const common = require("./common");
const merge = require("lodash/merge");

module.exports = merge(common, {
  mode: "development",
  optimization: {
    minimize: true
  }
});
