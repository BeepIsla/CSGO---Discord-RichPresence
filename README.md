# CSGO - Discord Rich Embed

Display CSGO information as rich embed in discord.

# Requirements:
- At least a bit of JavaScript/Node expierence

# How to use:
1. Install [NodeJS](https://nodejs.org/en/)
2. Install the following modules:
    - `discord-rpc`
    - `http`
3. Create an application [on Discord](https://discordapp.com/developers/applications/me) and enable "Rich Presence"
4. Upload assets to display images (**IMPORTANT:** Give them the same name they have as you download them. Eg: Give the picture "map_overpass.png" the name "map_overpass" in discord) - Upload them all as **large** except for "spec", "t", "ct" and "csgo" - *In the end it should look similar to [this](https://i.imgur.com/ferUi9p.png)* - You can add more map images by simply uploading the image and calling it "map_<mapname>" Eg: "cs_assault" > "map_assault"
5. Edit `config.json`
6. Put `gamestate_integration_discord.cfg` into your CFG folder in `<Steam>\steamapps\common\Counter-Strike Global Offensive\csgo\cfg`
7. Start node process by opening a CMD in the folder and typing `node index.js`

Note: Whenever you want the RichEmbed to appear, you have to start the node process **and leave it running**, if you close it the RichEmbed will stop displaying.
