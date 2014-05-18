var tracker = require('./lib');

var t = tracker.Tracker();

var udpPort = process.env.UDP_TRACKER_PORT || 8080;
var httpPort = process.env.HTTP_TRACKER_PORT || 8080;

tracker.udp.createServer(t, udpPort);
tracker.http.createServer(t, httpPort);
