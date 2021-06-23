const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");
const Helper = require("../helpers/Helper.js");
const config = require("./config.json");

(async () => {
	// Empty "out" folder
	let outPath = path.join(__dirname, "out");
	if (fs.existsSync(outPath)) {
		fs.rmSync(outPath, {
			force: true,
			maxRetries: 3,
			recursive: true,
			retryDelay: 10
		});
	}
	fs.mkdirSync(outPath);

	// Get list of current files
	let assets = await Helper.getURL({
		url: "https://discord.com/api/v9/oauth2/applications/" + config.id + "/assets",
		headers: {
			"cache-control": "no-cache",
			pragma: "no-cache",
			authorization: config.token
		}
	}, true);

	// Get a list of maps
	let mapsList = await Helper.getURL("https://api.github.com/repos/SteamDatabase/GameTracking-CSGO/contents/csgo/pak01_dir/materials/panorama/images/map_icons/screenshots/1080p", true);
	mapsList = mapsList.map((map) => {
		let parts = map.name.split(".");
		parts.pop();

		return {
			name: parts.join("."),
			url: map.download_url
		};
	});
	console.log("Found " + mapsList.length + " maps");

	// Process all the maps
	for (let i = 0; i < mapsList.length; i++) {
		console.log("Processing " + mapsList[i].name + " (" + (i + 1) + "/" + mapsList.length + ")");

		let buffer = await Helper.getURL(mapsList[i].url, false, true);
		let img = await Jimp.read(buffer);

		// Force all images to be 1024 x 1024
		let curAspectW = img.bitmap.width / img.bitmap.height;
		let newHeight = 1024;
		let newWidth = Math.round(newHeight * curAspectW);
		let cropWidth = Math.round((newWidth - 1024) / 2);

		await img.resize(newWidth, newHeight);
		await img.crop(cropWidth, 0, 1024, 1024);
		let base64 = await img.getBase64Async(Jimp.MIME_PNG);

		// Delete old asset if it exists
		let asset = assets.find(a => a.name === mapsList[i].name);
		if (asset) {
			await Helper.getURL({
				method: "DELETE",
				url: "https://discord.com/api/v9/oauth2/applications/" + config.id + "/assets/" + asset.id,
				headers: {
					"cache-control": "no-cache",
					pragma: "no-cache",
					authorization: config.token
				}
			}, false);
		}

		// Upload new asset
		let json = await Helper.getURL({
			method: "POST",
			url: "https://discord.com/api/v9/oauth2/applications/" + config.id + "/assets",
			headers: {
				"cache-control": "no-cache",
				pragma: "no-cache",
				authorization: config.token
			},
			json: {
				image: base64,
				name: mapsList[i].name,
				type: "1"
			}
		}, true);
		console.log("\t- " + json.id);
	}

	// Delete remaining maps which no longer exist
	if (!config.deleteMissing) {
		return;
	}

	console.log("Deleting missing assets...");
	for (let asset of assets) {
		let found = mapsList.find(m => m.name === asset.name);
		if (found) {
			continue;
		}

		// Only if they have this specific prefix
		let onlyPrefix = [
			"de_",
			"cs_",
			"dz_",
			"ar_",
			"coop_",
			"gd_"
		];
		let hasPrefix = false;
		for (let prefix of onlyPrefix) {
			if (asset.name.startsWith(prefix)) {
				hasPrefix = true;
				break;
			}
		}

		if (!hasPrefix) {
			continue;
		}

		console.log("\t- " + asset.name);
		await Helper.getURL({
			method: "DELETE",
			url: "https://discord.com/api/v9/oauth2/applications/" + config.id + "/assets/" + asset.id,
			headers: {
				"cache-control": "no-cache",
				pragma: "no-cache",
				authorization: config.token
			}
		}, false);
	}
})();
