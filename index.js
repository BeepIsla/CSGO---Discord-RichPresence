const fs = require('fs');
const DiscordRPC = require('discord-rpc');
const http = require('http');

const config = require('./config.json');

const client = new DiscordRPC.Client({ transport: 'ipc' });

/*************
 * VARIABLES *
 *************/
var lastUpdate = undefined;
var storage = {};
storage.map = 'none';
storage.steamid = 'none';
storage.phase = 'none';
storage.mode = 'none';
storage.round = 'none';
storage.team_ct = {};
storage.team_t = {};
storage.team_ct.score = 0;
storage.team_t.score = 0;
storage.player = {};
storage.player.name = 'none';
storage.player.team = 'none';

/*****************
 * TIMEOUT CHECK *
 *****************/
setInterval(function() {
	if (lastUpdate === undefined) return;
	if (new Date().getTime() - lastUpdate > 180000) {
		console.log('3 minutes of no updates, assuming CSGO has been closed - Stopping node process...');
		process.exit();
	}
}, 5000);

/************************
 * DISCORD RICHPRESENCE *
 ************************/
client.on('ready', () => {
	console.log('Ready, setting rich presence');

	client.setActivity({
		state: 'Not in a game',
		details: 'None',
		largeImageKey: 'map_none',
		largeImageText: undefined,
		smallImageKey: undefined,
		smallImageText: undefined,
		instance: false
	});

	/**********************
	 * CREATE HTTP SERVER *
	 **********************/
	const port = 3000;
	const host = '127.0.0.1';

	var server = http.createServer(function(req, res) {
		if (req.method === 'POST') {
			res.writeHead(200, {'Content-Type': 'text/html'});
			
			var body = '';
			req.on('data', function (data) {
				body += data;
			});
			req.on('end', function () {
				res.end( '' );
				RichEmbedUpdate(JSON.parse(body));
				lastUpdate = new Date().getTime();
			});
		} else {
			console.log('Not expecting other request types...');
			res.writeHead(200, {'Content-Type': 'text/html'});
			var html = '<html><body>This is for the CSGO Game State Integration</body></html>';
			res.end(html);
		}
	});
	server.listen(port, host);

	/*********************
	 * UPDATE RICH EMBED *
	 *********************/
	function RichEmbedUpdate(data) {
		console.log(new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds() + '.' + new Date().getMilliseconds() + ' - Recieved game update');

		if (data.player.activity === 'menu') {
			storage.map = 'none';
			storage.steamid = 'none';
			storage.phase = 'none';
			storage.mode = 'none';
			storage.round = 'none';
			storage.player.name = 'none';
			storage.player.team = 'none';

			client.setActivity({
				state: 'Not in a game',
				details: 'None',
				largeImageKey: 'map_none',
				largeImageText: undefined,
				smallImageKey: undefined,
				smallImageText: undefined,
				instance: false
			});
			
			console.log(`Updated RichEmbed to following activity:
- state: Not in a game
- details: None
- largeImageKey: map_none
- largeImageText: undefined
- smallImageKey: undefined
- smallImageText: undefined
- instance: false`);
		} else {
			storage.map = data.map.name;
			storage.steamid = data.provider.steamid;
			storage.phase = data.map.phase;
			storage.mode = data.map.mode;
			storage.round = data.map.round;
			storage.team_ct.score = data.map.team_ct.score;
			storage.team_t.score = data.map.team_t.score;
			storage.player.name = data.player.name;
			storage.player.team = data.player.team;

			let mapname = storage.map;
			if (mapname.startsWith('de_')) mapname = mapname.replace('de_', 'map_');
			else if (mapname.statsWith('cs_')) mapname = mapname.replace('cs_', 'map_');
			else if (mapname.statsWith('aim_')) mapname = mapname.replace('aim_', 'map_');

			// Adjust RichEmbed
			if (storage.player.team === undefined) storage.player.team = 'spec';

			client.setActivity({
				state: 'Playing on ' + storage.map,
				details: 'CT ' + storage.team_ct.score + ' : ' + storage.team_t.score + ' T',
				largeImageKey: mapname,
				largeImageText: storage.mode + ' in ' + storage.phase + ' phase',
				smallImageKey: storage.player.team.toLowerCase(),
				smallImageText: 'Playing as ' + storage.player.team,
				instance: false
			});
			
			console.log(`Updated RichEmbed to following activity:
- state: Playing on ${storage.map}
- details: CT ${storage.team_ct.score} : ${storage.team_t.score} T
- largeImageKey: ${mapname}
- largeImageText: ${storage.mode} in ${storage.phase} phase
- smallImageKey: ${storage.player.team.toLowerCase()}
- smallImageText: Playing as ${storage.player.team}
- instance: false`);
		}
	};
});

client.login(config.clientID);
