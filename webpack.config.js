const path = require('path');

module.exports = {
  entry: {
    components: './src/app.ts',
  },
  // devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /(\.tsx)|(\.ts)?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }, {
        test: /(\.glsl|\.vs|\.fs)$/,
        use: 'raw-loader'
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.fs', '.vs'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  optimization: {
    splitChunks: {
      name: 'vendor',
      chunks: 'all',
    }
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    historyApiFallback: true,
    port: 9090
  }
};