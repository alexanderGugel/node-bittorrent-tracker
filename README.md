BitTorrent tracker written on top of Node.JS
============================================

**This is an experiment! Don't use this in production!**

## Getting started

1. Set environment variables:

  UDP_TRACKER_PORT and HTTP_TRACKER_PORT (default: 8080)

2. Run "npm start" in order to start the tracker:

  The tracker starts accepting requests.

## Features

+ Supports both UDP and HTTP requests.

## Planned Features

+ Admin interface
+ Visualizations using [Cube](https://github.com/square/cube)
+ Use Redis for statistics ([HyperLogLog](http://antirez.com/news/75))

## Credits

This is a fork of Emil Hesslow's ([WizKid](https://github.com/WizKid)) original
[node-bittorrent-tracker](https://github.com/WizKid/node-bittorrent-tracker).
