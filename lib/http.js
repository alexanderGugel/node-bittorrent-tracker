var http = require('http'),
	querystring = require('querystring'),
	tracker = require('./tracker'),
	url = require('url'),
	util = require('util');

// Until it is possible to tell url.parse that you don't want a string back
// we need to override querystring.unescape so it returns a buffer instead of a
// string
querystring.unescape = function(s, decodeSpaces) {
  return querystring.unescapeBuffer(s, decodeSpaces);
};


const FAILURE_REASONS = {
	100: 'Invalid request type: client request was not a HTTP GET',
	101: 'Missing info_hash',
	102: 'Missing peer_id',
	103: 'Missing port',
	150: 'Invalid infohash: infohash is not 20 bytes long',
	151: 'Invalid peerid: peerid is not 20 bytes long',
	152: 'Invalid numwant. Client requested more peers than allowed by tracker',
	200: 'info_hash not found in the database. Sent only by trackers that do not automatically include new hashes into the database',
	500: 'Client sent an eventless request before the specified time',
	900: 'Generic error'
};


const PARAMS_INTEGER = ['port', 'uploaded', 'downloaded', 'left', 'numwant'];

const PARAMS_STRING = ['event'];


function Failure(code, reason) {
	this.code = code || 90;
	this.reason = reason || FAILURE_REASONS[this.code];
}

Failure.prototype = {
	bencode: function() {
		return 'd14:failure reason'+ this.reason.length +':'+ this.reason +'12:failure codei'+ this.code +'ee';
	}
}

// See http://www.bittorrent.org/beps/bep_0003.html#trackers
function validateRequest(method, query) {
	if (method !== 'GET')
		throw new Failure(100);

	if (!query['info_hash'])
		throw new Failure(101);

	if (!query['peer_id'])
		throw new Failure(102);

	if (!query['port'])
		throw new Failure(103);

	if (query['info_hash'].length !== 20)
		throw new Failure(150);

	if (query['peer_id'].length !== 20)
		throw new Failure(151);

	for (var i = 0; i < PARAMS_INTEGER.length; i++) {
		var p = PARAMS_INTEGER[i];
		if (typeof query[p] != 'undefined')
			query[p] = parseInt(query[p].toString());
	}

	for (var i = 0; i < PARAMS_STRING.length; i++) {
		var p = PARAMS_STRING[i];
		if (typeof query[p] != 'undefined')
			query[p] = query[p].toString();
	}
}

function createServer(trackerInstance, port, host) {
	var server = http.createServer(function (request, response) {
		request.addListener('end', function() {
			var parts = url.parse(request.url, true);
			var query = parts['query'];

			try {
				validateRequest(request.method, query);

				var file = trackerInstance.getFile(query['info_hash']);
				var peer = tracker.Peer(request.connection.remoteAddress, query['port'], query['left']);
				peer = file.addPeer(query['peer_id'], peer, tracker.event(query['event']));

				var want = 50;
				if (typeof query['numwant'] != 'undefined' && query['numwant'] > 0)
					want = query['numwant'];

				var peerBuffer = new Buffer(want * tracker.PEER_COMPACT_SIZE);
				var len = file.writePeers(peerBuffer, want, peer);
				peerBuffer = peerBuffer.slice(0, len);

				var resp = 'd8:intervali'+ tracker.ANNOUNCE_INTERVAL +'e8:completei'+ file.seeders +'e10:incompletei'+ file.leechers +'e10:downloadedi'+ file.downloads +'e5:peers'+ len +':';

				response.writeHead(200, {
					'Content-Length': resp.length + peerBuffer.length + 1,
					'Content-Type': 'text/plain'
				});

				response.write(resp);
				response.write(peerBuffer);
				response.end('e');
			} catch (failure) {
				var resp = failure.bencode();
				console.log(resp);
				response.writeHead(500, {
					'Content-Length': resp.length,
					'Content-Type': 'text/plain'
				});

				response.end(resp);
			}
		});
	});

	server.listen(port, host, function() {
		var address = server.address();
		console.log('HTTP server listening ' + address.address + ':' + address.port);
	});
}

exports.createServer = createServer;
