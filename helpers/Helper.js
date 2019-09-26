const request = require("request");
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

	static getURL(url, isJSON = true) {
		return new Promise((resolve, reject) => {
			request(url, (err, res, body) => {
				if (err) {
					reject(err);
					return;
				}

				if (res.statusCode !== 200) {
					reject(res.statusCode);
					return;
				}

				if (!isJSON) {
					resolve(body);
					return;
				}

				let json = undefined;
				try {
					json = JSON.parse(body);
				} catch (e) { };

				if (!json) {
					reject(body);
					return;
				}

				resolve(json);
			});
		});
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
				return "Live";
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

		if (!availableIcons.includes(icon.toLowerCase())) {
			return "random";
		}

		return icon;
	}
}
