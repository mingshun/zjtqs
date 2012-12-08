var zjtqs = require('zjtqs')
  , config = require('./config');

zjtqs.createServer().listen(config.tclPort || 2012);
zjtqs.createServer(true).listen(config.tlsPort || 2013);