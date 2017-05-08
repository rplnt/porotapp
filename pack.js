var compressor = require('node-minify');

compressor.minify({
  compressor: 'no-compress',
  input: [
    'src/minified.js',
    'src/init.js', 'src/common.js', 'src/session.js', 'src/local.js', 'src/utils.js',
    'startlist.js', 'stops.js'],
  output: 'porotapp.js',
  callback: function (err, min) {}
});
