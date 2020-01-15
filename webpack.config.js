const path = require('path');

module.exports = {
  entry: './src/index.js',
  devtool: 'source-map',
  mode: 'production',
  output: {
    filename: 'todoist-js.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
