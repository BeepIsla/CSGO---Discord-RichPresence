# CS:GO - Discord Rich Presence

Display CS:GO information as rich presence in discord.

[Preview album](https://imgur.com/a/BeyLwNC)

## Features

- [Automatically detects if the csgo.exe process is running or not in order to activate/deactivate the Rich Presence](#pm2---autostart)
- [Lobby Support](#lobby-info)
- 100% VAC Secure. Uses the [CS:GO Game State Integration](https://developer.valvesoftware.com/wiki/Counter-Strike:_Global_Offensive_Game_State_Integration) and a local http server on port 21812 (CS:GO's release date 21st August 2012) to recieve game data
- All official maps currently available supported
- All official gamemodes currently available supported
- Display length of your play session
- No need to setup a Discord application, you can just use the one I created
- If you use your own application it will automatically fetch all available assets from the Discord API. No additional coding required.
- I use this myself so I will keep working on it to make it exactly how I want it

## Installation

1. Install [NodeJS](https://nodejs.org/)
2. Clone this repository into a folder
3. Open a command prompt inside the folder and enter `npm install`
4. Rename `config.json.example` to `config.json` and adjust it - [Read More](#config)
5. Move `gamestate_integration_discord.cfg` into your `<Steam>\steamapps\common\Counter-Strike Global Offensive\csgo\cfg` folder and restart CS:GO, if opened
6. Go back to the command prompt we opened earlier and enter `node index` to start the process (**You will always need to repeat this last step unless you use [PM2 for Auto-Starting](#pm2---autostart)**)

**Start the process and leave it running!** When you close it the rich presence will disappear.

## Config

- `clientId`: A string representing the client ID of your Discord Application
- `steamWebAPIKey`: A string with your Steam Web API Key from [here](https://steamcommunity.com/dev/apikey)
- `serverPort`: A number with the port the local server is running on - **Needs to match the port in `gamestate_integration_discord.cfg`**
- `authToken`: A string with your auth token from `gamestate_integration_discord.cfg`
- `processCheckDelay`: A number representing the interval in milliseconds between checking if CS:GO is running or not
- `teamSmallImage`: A boolean value whether or not you want to display a team image or a gamemode image

## PM2 - Autostart

1. Open a command prompt inside the folder from the [installation](#installation)
2. Install [pm2](https://pm2.io/) with `npm install pm2@latest -g`
3. Install [pm2-windows-startup](https://github.com/marklagendijk/node-pm2-windows-startup) with `npm install pm2-windows-startup -g`
4. Enter `pm2-startup install` to set up the autostart
5. Enter `pm2 start index.js --name "CSGO RichPresence"`
6. Enter `pm2 save`
7. Everytime your OS starts up the process will run in the background and automatically display when needed.

## Lobby Info

The API Key in the config is required for us to request the current lobby you are in. (**This only works if the API Key is your own API key _or_ your profile and game-details are both public. The lobby also needs to be set to `Friends Can Join`.**)

If you are in a lobby others can join you via Discord. **This is heavily restricted** because of Discord and CS:GO (Because this isn't the real CS:GO process). Others can only join you if they already have CS:GO open and running **with the same application** (This one) otherwise it will just show that Discord did not detect the game.

**UPDATE**: With the new [Looking to Play](https://blog.counter-strike.net/index.php/2019/05/24154/) lobby update that CS:GO has implemented, anyone wanting to join you also now **has to be friends** with the account you are currently playing on otherwise lobby joining will fail due to the way the update works.

## Custom Discord application

1. Create an application [on Discord](https://discordapp.com/developers/applications/me)
2. Go to `Rich Presence` > `Art Assets` and upload all images you want.
3. Replace the client ID from the `config.json` with the one you have in `General Information` on the website

### Notes

- Maps are called exactly what they are called ingame. `cs_office` ingame is `cs_office` in the assets list. Workshop maps are `workshop_<ID>_<mapname>`, replace **every** character which is not A-Z or 0-9 with an underscore and you will be good to go. You can us [this website](https://regex101.com/r/dWSbbe/2) to see how you have to name your file.
- Gamemodes use their game-internal name such as `competitive`, `scrimpcomp2v2`, `survival`, etc.
- Main Menu uses the `menu` asset
- Unknown Maps and Modes use the `random` asset
- The `default` asset is used when the client is in the main menu and when we are in a unknown gamemode
- The [`assets` folder](/assets) are the images I use in my application. They are directly taken from the game files.
- Changing assets will require you to reboot the script (If you are using pm2 just run `pm2 restart "CSGO RichPresence"`)
