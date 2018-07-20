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

			if (!foundCSGO && client) {
				client.destroy();
				client = undefined;
			} else if (foundCSGO && !client) {
				client = new DiscordRPC.Client({ transport: 'ipc' });
				client.login({ clientId: config.clientId }).catch(console.error);
			}
		});
	}
}, 1 * 1000); // Low interval to check if csgo.exe is now running

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
			gotReponse = true;

			updatePresence(json);
			res.end('');
		});
	} else {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end('');
	}
});
server.listen(port, host);

client.on('ready', () => {
	request('https://discordapp.com/api/oauth2/applications/' + config.clientId + '/assets', (err, res, body) => {
		if (err) return console.error(err);

		var json = undefined;
		try {
			json = JSON.parse(body);
		} catch(err) {};

		if (!json || !json[0] || !json[0].name) return;

		availableMapIcons = [];
		for (let i = 0; i < json.length; i++) {
			if (/^(de_|cs_|ar_|training1)/.test(json[i].name)) {
				availableMapIcons.push(json[i].name);
			}
		}

		updateAllowed = true;
		updatePresence('settingup');
	});
});

function updatePresence(data) {
	if (!client) {
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

		if (queuedChanges) updatePresence(queuedChanges);
	}, 15000);

	queuedChanges = undefined;

	if (data && data.provider && data.provider.timestamp && !firstStart) firstStart = data.provider.timestamp;

	if (typeof data === 'string') {
		client.setActivity({
			state: 'Awaiting game response...',
			largeImageKey: 'default'
		}).catch(() => {});
		return;
	}

	if (!data) {
		client.setActivity({
			state: 'Unknown',
			largeImageKey: 'default'
		}).catch(() => {});
		return;
	}

	if (data.player.activity === 'menu') {
		client.setActivity({
			details: 'Main Menu',
			startTimestamp: parseInt(firstStart),
			largeImageKey: 'default'
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'competitive') {
		client.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'workshop'),
			largeImageText: data.map.name,
			smallImageKey: '5v5',
			smallImageText: 'Mode: ' + data.map.mode.charAt(0).toUpperCase() + data.map.mode.substr(1)
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'scrimcomp2v2') {
		client.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'workshop'),
			largeImageText: data.map.name,
			smallImageKey: '2v2',
			smallImageText: 'Mode: Wingman'
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'casual') {
		client.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'workshop'),
			largeImageText: data.map.name,
			smallImageKey: '10v10',
			smallImageText: 'Mode: ' + data.map.mode.charAt(0).toUpperCase() + data.map.mode.substr(1)
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'scrimcomp5v5') {
		client.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'workshop'),
			largeImageText: data.map.name,
			smallImageKey: '5v5',
			smallImageText: 'Mode: Weapons Expert'
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'gungameprogressive') {
		client.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'workshop'),
			largeImageText: data.map.name,
			smallImageKey: '5v5',
			smallImageText: 'Mode: Arms Race'
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'gungametrbomb') {
		client.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'workshop'),
			largeImageText: data.map.name,
			smallImageKey: '5v5',
			smallImageText: 'Demolition'
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'deathmatch') {
		client.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'workshop'),
			largeImageText: data.map.name,
			smallImageKey: '10v10',
			smallImageText: 'Mode: ' + data.map.mode.charAt(0).toUpperCase() + data.map.mode.substr(1)
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'training') {
		client.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'workshop'),
			largeImageText: data.map.name,
			smallImageKey: '1vbots',
			smallImageText: 'Mode: ' + data.map.mode.charAt(0).toUpperCase() + data.map.mode.substr(1)
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'custom') {
		client.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'workshop'),
			largeImageText: data.map.name,
			smallImageKey: 'unknown',
			smallImageText: 'Mode: ' + data.map.mode.charAt(0).toUpperCase() + data.map.mode.substr(1)
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'cooperative') {
		client.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'workshop'),
			largeImageText: data.map.name,
			smallImageKey: '2vbots',
			smallImageText: 'Mode: Guardian'
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'coopmission') {
		client.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'workshop'),
			largeImageText: data.map.name,
			smallImageKey: '2vbots',
			smallImageText: 'Mode: Co-Op Strike'
		}).catch(() => {});
		return;
	}

	if (data.map.mode === 'skirmish') {
		client.setActivity({
			state: getLocalPlayerStats(data),
			details: getTeamScoreDetails(data),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.map.name) ? data.map.name : 'workshop'),
			largeImageText: data.map.name,
			smallImageKey: '6v6',
			smallImageText: 'Mode: War Games'
		}).catch(() => {});
		return;
	}

	// Unknown Gamemode
	client.setActivity({
		state: getLocalPlayerStats(data),
		details: getTeamScoreDetails(data),
		startTimestamp: parseInt(firstStart),
		largeImageKey: 'default',
		largeImageText: data.map.name,
		smallImageKey: 'unknown',
		smallImageText: 'Mode: ' + data.map.mode.charAt(0).toUpperCase() + data.map.mode.substr(1)
	}).catch(() => {});
}

function getTeamScoreDetails(data) {
	if (!data || !data.player || !data.player.team) return 'Unknown';

	var ourTeam = data.player.team;
	var enemyTeam = undefined;
	if (ourTeam === 'T') enemyTeam = 'CT';
	else if (ourTeam === 'CT') enemyTeam = 'T';
	else return 'Unknown';

	if (!data.player.match_stats || isNaN(data.player.match_stats.kills) || isNaN(data.player.match_stats.assists) || isNaN(data.player.match_stats.deaths)) return ourTeam + ' - ' + data.map['team_' + ourTeam.toLowerCase()].score + ':' + data.map['team_' + enemyTeam.toLowerCase()].score;
	return ourTeam + ' - ' + data.map['team_' + ourTeam.toLowerCase()].score + ':' + data.map['team_' + enemyTeam.toLowerCase()].score + ' ' + data.player.match_stats.kills + '/' + data.player.match_stats.assists + '/' + data.player.match_stats.deaths;
}

function getLocalPlayerStats(data) {
	if (!data || !data.player || !data.player.state || !data.player.state.health || !data.player.state.money) return 'Unknown';

	return data.player.state.health + 'HP $' + data.player.state.money;
}
