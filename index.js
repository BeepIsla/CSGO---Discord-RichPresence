const Helper = require("./helpers/Helper.js");
const Process = require("./helpers/Process.js");
const Discord = require("./helpers/Discord.js");
const Server = require("./helpers/Server.js");
const config = require("./config.json");

(async () => {
	let valid = await Helper.IsValidAPIKey(config.steamWebAPIKey, config.clientId);
	if (valid !== true) {
		console.log("Steam API Key is invalid or Steam is acting up. Lobby sharing might not work. Please ensure your Steam Web API Key is correct.");
	}
})();

const process = new Process("csgo.sh", config.processCheckDelay);
const discord = new Discord(config.clientId);
const server = new Server(config.authToken);
const lastInfo = {};

process.on("stopped", () => {
	if (Helper.LaunchedWithDebugger()) {
		console.log("Stopped");
	}

	discord.stop();
	server.server.close();
});

process.on("running", async (pid) => {
	if (Helper.LaunchedWithDebugger()) {
		console.log("Running");
	}

	// Startup
	await discord.start(pid, {
		state: "In Main Menu",
		largeImageKey: "menu",
		largeImageText: "Main Menu",
	}).catch(console.error);

	// Start HTTP listener
	server.server.listen(config.serverPort);
});

server.on("csgo", async (data) => {
	if (!discord.client || !discord.client.connectTime) {
		return;
	}

	// Get current lobby if available
	if (data.player.activity === "menu") {
		if (!config.timeElapsedTotal && lastInfo.mode) {
			discord.client.connectTime = Math.round(Date.now() / 1000);
			lastInfo.mode = undefined;
		}

		let player = await Helper.getURL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=" + config.steamWebAPIKey + "&steamids=" + data.provider.steamid).catch(console.error);
		if (!player || !player.response || !player.response.players[0] || !player.response.players[0].lobbysteamid) {
			await discord.setActivity({
				state: "In Main Menu",
				startTimestamp: discord.client.connectTime,
				largeImageKey: "menu",
				largeImageText: "Main Menu",
			}).catch(console.error);
			return;
		}

		await discord.setActivity({
			state: "In Lobby",
			startTimestamp: discord.client.connectTime,
			largeImageKey: "menu",
			largeImageText: "Main Menu",
			partyId: player.response.players[0].lobbysteamid,
			partySize: 1,
			partyMax: 5,
			joinSecret: Buffer.from(data.provider.steamid + "_" + player.response.players[0].lobbysteamid).toString("hex").toUpperCase()
		}).catch(console.error);

		// No need to do anything more, main menu is main menu. Nothing much we can do.
		return;
	}

	let obj = {
		state: "Playing",
		startTimestamp: discord.client.connectTime,
		largeImageKey: "menu"
	}

	if (!config.teamSmallImage) {
		if (data.map && data.map.mode) {
			obj.smallImageKey = Helper.getIcon(data.map.mode);
			obj.smallImageText = Helper.getTeam(data);
			obj.details = Helper.getGamemode(data.map.mode);
		}
	} else {
		if (data.player && data.player.team && data.map && data.map.mode) {
			obj.smallImageKey = data.player.team === "T" ? "t_logo" : (data.player.team === "CT" ? "ct_logo" : undefined);
			obj.smallImageText = Helper.getTeam(data);
			obj.details = Helper.getGamemode(data.map.mode);
		}
	}

	if (data.map && data.map.name) {
		let mapName = Helper.getMap(data.map.name);
		obj.largeImageKey = Helper.getIcon(data.map.name);
		obj.largeImageText = "Playing on " + mapName;
	}

	if (data.map && data.map.phase) {
		if (data.map.phase === "warmup") {
			obj.state = "Warmup";
		} else if (data.map.team_ct && data.map.team_t) {
			obj.state = Helper.getPhase(data.map.phase) + " | " + (data.player.team === "T" ? (data.map.team_t.score + ":" + data.map.team_ct.score) : (data.map.team_ct.score + ":" + data.map.team_t.score));
		} else {
			obj.state = Helper.getPhase(data.map.phase);
		}
	}

	obj = Helper.gamemodeModification(data, obj);

	if (!config.timeElapsedTotal && (!data.map || !data.map.mode || data.map.mode !== lastInfo.mode)) {
		discord.client.connectTime = Math.round(Date.now() / 1000);
		obj.startTimestamp = discord.client.connectTime;
		lastInfo.mode = (data.map && data.map.mode) ? data.map.mode : undefined;
	}

	if (data && data.map && data.map.name && data.map.name.split("/")[0] === "workshop") {
		let fileID = data.map.name.split("/")[1];
		let map = await Helper.getWorkshopName(fileID).catch((e) => { console.error(e); });
		if (map && map.response.result === 1 && map.response.resultcount === 1 && map.response.publishedfiledetails.length >= 1) {
			obj.largeImageText = "Playing on " + map.response.publishedfiledetails[0].title;
		}
	}

	if (Helper.LaunchedWithDebugger() === true) {
		console.log(data, obj);
	}

	await discord.setActivity(obj).catch(console.error);
});
