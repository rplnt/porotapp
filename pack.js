var compressor = require('node-minify');

compressor.minify({
  compressor: 'no-compress',
  input: ['src/minified.js', 'src/app.js', 'startlist.js', 'stops.js'],
  output: 'porotapp.js',
  callback: function (err, min) {}
});
