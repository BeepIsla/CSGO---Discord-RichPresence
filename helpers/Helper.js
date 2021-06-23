const got = require("got").default;
const vdf = require("vdf");
let maps = {};
let modes = {};
let availableIcons = [];

module.exports = class Helper {
	static LaunchedWithDebugger() {
		const argv = process.execArgv.join();
		return argv.includes("inspect-brk") || argv.includes("debug");
	}

	static IsValidAPIKey(key, clientId) {
		return new Promise(async (resolve, reject) => {
			// While also checking if the key is correct lets grab some other stuff as well
			let out = await this.getMaps("https://raw.githubusercontent.com/SteamDatabase/GameTracking-CSGO/master/csgo/resource/csgo_english.txt").catch(() => { });
			maps = out.maps;
			modes = out.modes;

			availableIcons = await this.getIcons("https://discordapp.com/api/oauth2/applications/" + clientId + "/assets").catch(() => { });

			let res = await this.getURL("https://api.steampowered.com/ICSGOServers_730/GetGameServersStatus/v1/?key=" + key).catch(() => { });
			if (!res) {
				resolve(false);
				return;
			}

			resolve(true);
		});
	}

	static getWorkshopName(fileid) {
		return new Promise((resolve, reject) => {
			this.getURL({
				method: "POST",
				uri: "https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/",
				form: {
					"publishedfileids[0]": fileid,
					itemcount: 1
				}
			}).then(resolve).catch(reject);
		});
	}

	static getMaps(url) {
		return new Promise(async (resolve, reject) => {
			let data = await this.getURL(url, false).catch(reject);
			if (!data) {
				return;
			}

			let objMaps = {};
			let lang = vdf.parse(data).lang;
			for (let token in lang.Tokens) {
				if (!token.startsWith("SFUI_Map_")) {
					continue;
				}

				objMaps[token.replace("SFUI_Map_", "").toLowerCase()] = lang.Tokens[token];
			}

			let objModes = {};
			for (let token in lang.Tokens) {
				if (!token.startsWith("SFUI_GameMode_")) {
					continue;
				}

				objModes[token.replace("SFUI_GameMode_", "").toLowerCase()] = lang.Tokens[token];
			}

			resolve({ maps: objMaps, modes: objModes });
		});
	}

	static getIcons(url) {
		return new Promise(async (resolve, reject) => {
			let data = await this.getURL(url).catch(reject);
			if (!data) {
				return;
			}

			resolve(data.map(a => a.name.toLowerCase()));
		});
	}

	static async getURL(url, isJSON = true) {
		let req = await got(url);
		if (req.statusCode !== 200) {
			throw req.statusCode;
		}

		if (!isJSON) {
			return req.body;
		}

		try {
			let json = JSON.parse(req.body);
			return json;
		} catch {
			throw req.body;
		}
	}

	static getGamemode(mode) {
		return modes[mode.toLowerCase()] || mode;
	}

	static getMap(map) {
		return maps[map.toLowerCase()] || map;
	}

	static getPhase(phase) {
		switch (phase) {
			case "warmup":
				return "Warmup";
			case "live":
				return "In-Game";
			case "intermission":
				return "Half-Time";
			case "gameover":
				return "Game Over";
			default:
				return phase;
		}
	}

	static getTeam(data) {
		if (data.player.team === "T") {
			return "Playing as Terrorist";
		} else if (data.player.team === "CT") {
			return "Playing as Counter-Terrorist";
		} else {
			return undefined;
		}
	}

	static getIcon(icon) {
		if (typeof icon !== "string") {
			return "random";
		}

		icon = this.normalize(icon.toLowerCase());

		if (!availableIcons.includes(icon)) {
			return "random";
		}

		return icon;
	}

	static gamemodeModification(data, obj) {
		if (!data || !data.map || !data.map.mode) {
			return obj;
		}

		switch (data.map.mode) {
			case "deathmatch": {
				if (obj.state === "Warmup") {
					break;
				}

				obj.state = "Score: " + data.player.match_stats.score;
				break;
			}
			case "survival": {
				if (obj.state === "Warmup") {
					break;
				}

				obj.state = "Kills: " + data.player.match_stats.kills;
				break;
			}
			default: {
				break;
			}
		}

		return obj;
	}

	static normalize(str) {
		return str.replace(/(?![\w\d]+)./gi, "_");
	}
}
