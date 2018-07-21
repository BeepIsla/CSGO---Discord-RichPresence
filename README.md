# CSGO - Discord Rich Presence

Display CSGO information as rich presence in discord.

[Small showcase video](https://youtu.be/yvrA6LpmZkE) (Sorry for the low FPS - Had to run OBS twice to record the game & rich presence)

[Small preview album](https://imgur.com/a/wWXjBlB)

# Features
- [Automatically detects if the csgo.exe process is running or not in order to activate/deactivate the Rich Presence (Windows Only at the moment)](#pm2-/-autostart)
- 100% VAC Secure. Uses the [CSGO Game State Integration](https://developer.valvesoftware.com/wiki/Counter-Strike:_Global_Offensive_Game_State_Integration) and a local http server on port 21812 (CSGO's release date 21st August 2012) to recieve game data
- All official maps currently available supported
- All official gamemodes currently available supported
- Display length of your play session
- K/A/D, Money, Team and Team-Score display
- No need to setup an application, you can just use the one I created
- I use this myself so I will keep working on it to make it exactly how I want it
- For suggestions add me on Discord **Felix#2343**, I am most active there

# TODO
- Add Linux (maybe Mac) support for automatically detecting the csgo.exe process

# Installation / How to use
1. Install [NodeJS](https://nodejs.org/en/)
2. Clone this repository into a folder
3. Open a command prompt inside the folder and enter `npm install`
4. Move `gamestate_integration_discord.cfg` into your `<Steam>\steamapps\common\Counter-Strike Global Offensive\csgo\cfg` folder and restart csgo, if opened
5. Go back to the command prompt we opened earlier and enter `node index` to start the process

**Start the process and leave it running!** When you close it the rich presence will disappear.

# PM2 / Autostart
1. Install pm2 with `npm install pm2@latest -g`
2. Create a **BAT** file with the following content: `pm2 start <Direct Path To Index.js> --name "CSGO-RichPresence"`. Example: `pm2 start D:/JavaScript/other/csgo-richpresence/index.js`
3. Press `CTRL + R` to open the run prompt
4. Enter `shell:startup`. It should open a folder called `Autostart`
5. Put the BAT file you just created into the `Autostart` folder
6. Everytime your OS starts up you will see a command prompt open for a short period of time, that is pm2 launching the Rich Presence. It will now run in the background and automatically display when needed.

# Some notes for running it
- Windows Only:
- - When first starting the process it will display it in your rich presence for ~1 second
- - It will automatically start the rich presence again when you start CSGO
- - It will automatically close the rich presence again when you close CSGO
- - **This ONLY works on windows**
- Other platforms:
- - When first starting the process it will display it in your rich presence the whole time until you close the process again
- - When closing CSGO it will keep displaying the latest rich presence until you manually close the process
- - **I will maybe eventually update this to work on other platforms too**

# How to use your own Discord application with custom images
1. Create an application [on Discord](https://discordapp.com/developers/applications/me)
2. Go to `Rich Presence` > `Art Assets` and upload all images you want.
3. Replace the client ID from the `config.json` with the one you have in `General Information` on the website

**Notes:**
- Maps are called exactly what they are called ingame. `cs_office` ingame is `cs_office` in the assets list. Workshop maps are `workshop/<ID>/<mapname>` (Just like how they are ingame) in the assets list. Example: `workshop/243702660/aim_botz`
- The `default` asset is used when the client is in the main menu and when we are in a unknown gamemode
- The `workshop` asset is used on maps which dont have a image by default in our application
- `1vbots`, `2vbots`, `2v2`, `5v5`, `6v6`, `10v10` & `unknown` are used for the different gamemodes to display the amount of players
- The `assets` folder are the images I use in my application. They are directly taken from the game files of the maps which are currently available in the `<Steam>\steamapps\common\Counter-Strike Global Offensive\csgo\maps` folder

It should look similar to [this](https://i.imgur.com/6qloVho.png)
