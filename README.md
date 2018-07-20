# CSGO - Discord Rich Embed

Display CSGO information as rich embed in discord.

# How to use:
1. Install [NodeJS](https://nodejs.org/en/)
2. Clone this repository into a folder
3. Open a command prompt inside the folder and enter `npm install`
4. Move `gamestate_integration_discord.cfg` into your `<Steam>\steamapps\common\Counter-Strike Global Offensive\csgo\cfg` folder and restart csgo, if opened
5. Go back to the command prompt we opened earlier and enter `node index` to start the process

**Start the process and leave it running!** When you close it the rich presence will disappear.

# Some notes for running it:
- Windows Only:
- - When first starting the process it will display it in your rich presence for ~1 second
- - It will automatically start the rich presence again when you start CSGO
- - It will automatically close the rich presence again when you close CSGO
- - **This ONLY works on windows**
- Other platforms:
- - When first starting the process it will display it in your rich presence the whole time until you close the process again
- - When closing CSGO it will keep displaying the latest rich presence until you manually close the process
- - **I will maybe eventually update this to work on other platforms too**

Note: When using Windows you can use something like [pm2](http://pm2.keymetrics.io/docs/usage/quick-start/) with a [startup script](http://pm2.keymetrics.io/docs/usage/startup/) to automatically start the Node process in the background when starting your Computer.

# How to use your own Discord application with custom images
1. Create an application [on Discord](https://discordapp.com/developers/applications/me)
2. Go to `Rich Presence` > `Art Assets` and upload all images you want.
3. Replace the client ID from the `config.json` with the one you have in `General Information` on the website

**Notes:**
- Maps are called exactly what they are called ingame. `cs_office` ingame is `cs_office` in the assets list. Workshop maps are `workshop/<ID>/<mapname>` (Just like how they are ingame) in the assets list. Example: `workshop/243702660/aim_botz`
- The `default` asset is used when the client is in the main menu and when we are in a unknown gamemode
- The `workshop` asset is used on maps which dont have a image by default in our application
- `1vbots`, `2vbots`, `2v2`, `5v5`, `6v6`, `10v10` & `unknown` are used for the different gamemodes to display the amount of players

It should look similar to [this](https://i.imgur.com/6qloVho.png)
