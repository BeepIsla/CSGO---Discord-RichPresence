const http = require('http');
const DiscordRPC = require('discord-rpc');
const request = require('request');
const child_process = require('child_process');
const config = require('./config.json');

var client = new DiscordRPC.Client({ transport: 'ipc' });
client.login({ clientId: config.clientId }).catch(console.error);

const port = 21812;
const host = '127.0.0.1';

var availableMapIcons = [];
var updateAllowed = false;
var latestData = undefined;
var queuedChanges = undefined;
var firstStart = undefined;
var updates = 0;
var isClientCreated = true;

setInterval(() => {
	if (process.platform === 'win32') {
		child_process.exec('tasklist', (error, stdout, stderr) => {
			if (error) return console.error(error);

			var tasks = stdout.split('\n');
			var foundCSGO = false;
			tasks.forEach((task) => {
				if (/^csgo.exe/.test(task)) {
					foundCSGO = true;
				}
			});

			if (!foundCSGO && isClientCreated) {
				client.destroy();
				isClientCreated = false;
			} else if (foundCSGO && !isClientCreated) {
				client = new DiscordRPC.Client({ transport: 'ipc' });
				client.login({ clientId: config.clientId }).catch(console.error);

				availableMapIcons = [];
				updateAllowed = false;
				latestData = undefined;
				queuedChanges = undefined;
				firstStart = undefined;
				updates = 0;
				isClientCreated = true;

				getReady(client);
			}
		});
	}
}, 1 * 1000); // Check if csgo.exe is running or not

server = http.createServer((req, res) => {
	if (req.method === 'POST') {
		res.writeHead(200, {'Content-Type': 'text/html'});

		var body = '';
		req.on('data', (data) => body += data);
		req.on('end', () => {
			var json = undefined;
			try {
				json = JSON.parse(body);
			} catch(err) {};

			if (!json || !json.auth || json.auth.token !== 'Q79v5tcxVQ8u') return res.end('');

			var usedData = {
				activity: '',
				mode: '',
				name: '',
				team: '',
				kills: '',
				assists: '',
				deaths: '',
				score1: '',
				score2: '',
				health: '',
				money: ''
			};

			if (json.player && json.player.activity) usedData.activity = json.player.activity;
			if (json.map && json.map.mode) usedData.mode = json.map.mode;
			if (json.map && json.map.name) usedData.name = json.map.name;
			if (json.player && json.player.team) usedData.team = json.player.team;
			if (json.player && json.player.match_stats && json.player.match_stats.kills) usedData.kills = json.player.match_stats.kills;
			if (json.player && json.player.match_stats && json.player.match_stats.assists) usedData.assists = json.player.match_stats.assists;
			if (json.player && json.player.match_stats && json.player.match_stats.deaths) usedData.deaths = json.player.match_stats.deaths;
			if (json.player && json.map && json.map.team_ct && json.map.team_ct.score) usedData.score1 = json.map.team_ct.score;
			if (json.player && json.map && json.map.team_t && json.map.team_t.score) usedData.score2 = json.map.team_t.score;
			if (json.player && json.player && json.player.state && json.player.state.health) usedData.health = json.player.state.health;
			if (json.player && json.player && json.player.state && json.player.state.money) usedData.money = json.player.state.money;

			if (latestData && JSON.stringify(latestData) === JSON.stringify(usedData) && updates !== 0) return res.end('');
			latestData = usedData;
			updates = updates + 1;

			updatePresence(client, json);
			res.end('');
		});
	} else {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end('');
	}
});
server.listen(port, host);

function getReady(RPC) {
	RPC.on('ready', () => {
		request('https://discordapp.com/api/oauth2/applications/' + config.clientId + '/assets', (err, res, body) => {
			if (err) return console.error(err);

			var json = undefined;
			try {
				json = JSON.parse(body);
			} catch(err) {};

			if (!json || !json[0] || !json[0].name) return;
	
			availableMapIcons = [];
			for (let i = 0; i < json.length; i++) {
				if (/^(de_|cs_|ar_|gd_|training1)/.test(json[i].name)) {
					availableMapIcons.push(json[i].name);
				}
			}

			updateAllowed = true;
			updatePresence(RPC, 'settingup');
		});
	});
}
getReady(client);

function updatePresence(RPC, data) {
	if (!RPC) {
		updateAllowed = false;
		queuedChanges = undefined;
		return;
	}

	if (!updateAllowed) {
		queuedChanges = data;
		return;
	}
	updateAllowed = false;

	setTimeout(() => {
		updateAllowed = true;

		if (queuedChanges) updatePresence(RPC, queuedChanges);
	}, 15000);

	queuedChanges = undefined;

	if (data && data.provider && data.provider.timestamp && !firstStart) firstStart = data.provider.timestamp;

	if (typeof data === 'string') {
		if (process.platform === 'win32') {
			RPC.setActivity({
				state: 'Awaiting game response...',
				largeImageKey: 'menu',
				startTimestamp: parseInt(new Date().getTime() / 1000),
				endTimestamp: parseInt(new Date().getTime() / 1000) + 30
			}).catch(() => {});
			return;
		} else {
			RPC.setActivity({
				state: 'Awaiting game response...',
				largeImageKey: 'menu'
			}).catch(() => {});
			return;
		}
	}

	if (!data) {
		RPC.setActivity({
			state: 'Unknown',
			largeImageKey: 'menu'
		}).catch(() => {});
		return;
	}

	if (data.player.activity === 'menu') {
		RPC.setActivity({
			details: 'Main Menu',
			startTimestamp: parseInt(firstStart),
			largeImageKey: 'menu'
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'competitive') {
		RPC.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'random'),
			largeImageText: data.map.name,
			smallImageKey: '5v5',
			smallImageText: 'Mode: ' + data.map.mode.charAt(0).toUpperCase() + data.map.mode.substr(1)
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'scrimcomp2v2') {
		RPC.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'random'),
			largeImageText: data.map.name,
			smallImageKey: '2v2',
			smallImageText: 'Mode: Wingman'
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'casual') {
		if ([ 'ar_shoots', 'ar_dizzy', 'de_lake', 'de_safehouse' ].includes(data.map.name)) {
			// Casual & One of these maps typically means the gaemode is Flying Scoutsman
			RPC.setActivity({
				state: getLocalPlayerStats(data),
				details: getTeamScoreDetails(data),
				startTimestamp: parseInt(firstStart),
				largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'random'),
				largeImageText: data.map.name,
				smallImageKey: '6v6',
				smallImageText: 'Mode: Flying Scoutsman'
			}).catch(() => {});
			return;
		} else {
			RPC.setActivity({
				state: getLocalPlayerStats(data),
				details: getTeamScoreDetails(data),
				startTimestamp: parseInt(firstStart),
				largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'random'),
				largeImageText: data.map.name,
				smallImageKey: '10v10',
				smallImageText: 'Mode: ' + data.map.mode.charAt(0).toUpperCase() + data.map.mode.substr(1)
			}).catch(() => {});
			return;
		}
	}

	if (data.map.mode === 'scrimcomp5v5') {
		RPC.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'random'),
			largeImageText: data.map.name,
			smallImageKey: '5v5',
			smallImageText: 'Mode: Weapons Expert'
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'gungameprogressive') {
		RPC.setActivity({
			state: getLocalPlayerStats(data),
			details: getDeathmatchDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'random'),
			largeImageText: data.map.name,
			smallImageKey: '6v6',
			smallImageText: 'Mode: Arms Race'
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'gungametrbomb') {
		RPC.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'random'),
			largeImageText: data.map.name,
			smallImageKey: '6v6',
			smallImageText: 'Demolition'
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'deathmatch') {
		RPC.setActivity({
			state: getLocalPlayerStats(data),
			details: getDeathmatchDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'random'),
			largeImageText: data.map.name,
			smallImageKey: '10v10',
			smallImageText: 'Mode: ' + data.map.mode.charAt(0).toUpperCase() + data.map.mode.substr(1)
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'training') {
		RPC.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'random'),
			largeImageText: data.map.name,
			smallImageKey: '1vbots',
			smallImageText: 'Mode: ' + data.map.mode.charAt(0).toUpperCase() + data.map.mode.substr(1)
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'custom') {
		RPC.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'random'),
			largeImageText: data.map.name,
			smallImageKey: 'unknown',
			smallImageText: 'Mode: ' + data.map.mode.charAt(0).toUpperCase() + data.map.mode.substr(1)
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'cooperative') {
		RPC.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'random'),
			largeImageText: data.map.name,
			smallImageKey: '2vbots',
			smallImageText: 'Mode: Guardian'
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'coopmission') {
		RPC.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'random'),
			largeImageText: data.map.name,
			smallImageKey: '2vbots',
			smallImageText: 'Mode: Co-Op Strike'
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'skirmish') {
		RPC.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'random'),
			largeImageText: data.map.name,
			smallImageKey: '6v6',
			smallImageText: 'Mode: War Games'
		}).catch(() => {});
		return;
	}

	// Unknown Gamemode
	RPC.setActivity({
		state: getLocalPlayerStats(data),
		details: getTeamScoreDetails(data),
		startTimestamp: parseInt(firstStart),
		largeImageKey: 'default',
		largeImageText: data.map.name,
		smallImageKey: 'unknown',
		smallImageText: 'Mode: ' + data.map.mode.charAt(0).toUpperCase() + data.map.mode.substr(1)
	}).catch(() => {});
}

function getDeathmatchDetails(data) {
	if (!data || !data.player || !data.player.team) return 'Unknown';

	if (!data.player.match_stats || isNaN(data.player.match_stats.kills) || isNaN(data.player.match_stats.assists) || isNaN(data.player.match_stats.deaths)) return data.player.team;
	return data.player.team + ' ' + data.player.match_stats.kills + '/' + data.player.match_stats.assists + '/' + data.player.match_stats.deaths;
}

function getTeamScoreDetails(data) {
	if (data && data.player && !data.player.team) data.player.team = 'Spectator';
	if (!data || !data.player || !data.player.team || !data.provider) return 'Unknown';
	if (data.player.steamid !== data.provider.steamid) data.player.team = 'Spectator';

	var ourTeam = data.player.team;
	var enemyTeam = undefined;
	if (ourTeam === 'T') enemyTeam = 'CT';
	else if (ourTeam === 'CT') enemyTeam = 'T';
	else if (ourTeam === 'Spectator') return ourTeam + ' - ' + data.map.team_ct.score + ':' + data.map.team_t.score + ' ' + data.player.match_stats.kills + '/' + data.player.match_stats.assists + '/' + data.player.match_stats.deaths;
	else return 'Unknown';

	if (!data.player.match_stats || isNaN(data.player.match_stats.kills) || isNaN(data.player.match_stats.assists) || isNaN(data.player.match_stats.deaths)) return ourTeam + ' - ' + data.map['team_' + ourTeam.toLowerCase()].score + ':' + data.map['team_' + enemyTeam.toLowerCase()].score;
	return ourTeam + ' - ' + data.map['team_' + ourTeam.toLowerCase()].score + ':' + data.map['team_' + enemyTeam.toLowerCase()].score + ' ' + data.player.match_stats.kills + '/' + data.player.match_stats.assists + '/' + data.player.match_stats.deaths;
}

function getLocalPlayerStats(data) {
	if (data && data.player && !data.player.team) data.player.team = 'Spectator';
	if (data.player.team === 'Spectator') return 'Round ' + data.map.round;

	if (!data || !data.player || !data.player.state || !data.player.state.health) return 'Unknown';

	if (!isNaN(data.player.state.money)) return data.player.state.health + 'HP $' + data.player.state.money;
	else return data.player.state.health + 'HP';
}
