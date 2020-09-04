const path = require('path');

module.exports = {
  mode: 'production',
  devtool: '',
  entry: {
    components: './src/app.ts',
  },
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
    path: path.resolve(__dirname, 'production', 'public', 'src'),
    filename: '[name].js',
    chunkFilename: "[name].chunk.js",
  },
  optimization: {
    splitChunks: {
      name: 'vendor',
      chunks: 'all',
    }
  }
};