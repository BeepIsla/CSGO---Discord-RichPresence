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

const process = new Process("csgo.exe", config.processCheckDelay);
const discord = new Discord(config.clientId);
const server = new Server(config.authToken);

process.on("stopped", () => {
	discord.stop();
	server.server.close();
});

process.on("running", async (pid) => {
	// Startup
	await discord.start(pid, {
		state: "In Main Menu",
		startTimestamp: discord.client.connectTime,
		largeImageKey: "menu",
		largeImageText: "Main Menu",
	});

	// Start HTTP listener
	server.server.listen(config.serverPort);
});

server.on("csgo", async (data) => {
	// Get current lobby if available
	if (data.player.activity === "menu") {
		let player = await Helper.getURL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=" + config.steamWebAPIKey + "&steamids=" + data.provider.steamid).catch(console.error);
		if (typeof player === "undefined" || typeof player.response.players[0].lobbysteamid === "undefined") {
			await discord.setActivity({
				state: "In Main Menu",
				startTimestamp: discord.client.connectTime,
				largeImageKey: "menu",
				largeImageText: "Main Menu",
			});
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
		});

		// No need to do anything more, main menu is main menu. Nothing much we can do.
		return;
	}

	let obj = {
		state: "Playing",
		startTimestamp: discord.client.connectTime,
		largeImageKey: "menu"
	}

	if (typeof data.map === "object" && typeof data.map.mode === "string") {
		obj.smallImageKey = Helper.getIcon(data.map.mode);
		obj.smallImageText = Helper.getTeam(data);
		obj.details = Helper.getGamemode(data.map.mode);
	}

	if (typeof data.map === "object" && typeof data.map.name === "string") {
		let mapName = Helper.getMap(data.map.name);
		obj.largeImageKey = Helper.getIcon(data.map.name);
		obj.largeImageText = "Playing on " + mapName;
	}

	if (typeof data.map === "object" && typeof data.map.phase === "string") {
		if (data.map.phase === "warmup") {
			obj.state = "Warmup";
		} else if (typeof data.map.team_ct === "object" && typeof data.map.team_t === "object") {
			obj.state = Helper.getPhase(data.map.phase) + " " + data.map.team_ct.score + ":" + data.map.team_t.score;
		} else {
			obj.state = Helper.getPhase(data.map.phase);
		}
	}

	if (Helper.LaunchedWithDebugger() === true) {
		console.log(data, obj);
	}

	await discord.setActivity(obj);
});
