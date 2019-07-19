const common = require("./common");

module.exports = {
  ...common,
  mode: "development",
  optimization: {
    minimize: true
  }
};
