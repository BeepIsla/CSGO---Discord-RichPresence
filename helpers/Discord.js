const DDiscord = require("discord-rpc");
const childProcess = require("child_process");

module.exports = class Discord {
	constructor(clientId) {
		this.clientId = clientId;
		this.client = null;
		this.pid = null;
	}

	stop() {
		if (this.client) {
			this.client.connectTime = null;
			this.client.destroy();
			this.client = null;
		}

		this.pid = null;
	}

	start(pid, activity = null) {
		return new Promise(async (resolve, reject) => {
			this.pid = pid;

			if (!this.client) {
				this.client = new DDiscord.Client({ transport: "ipc" });
			}

			this.client.login({ clientId: this.clientId }).then(() => {
				this.client.connectTime = Math.round(Date.now() / 1000);

				this.client.subscribe("ACTIVITY_JOIN", (data) => {
					try {
						data = Buffer.from(data.secret, "hex").toString("utf8").split("_");

						childProcess.exec("start \"\" \"steam://joinlobby/730/" + data[1] + "/" + data[0] + "\"");
					} catch (e) { };
				});

				if (typeof activity) {
					activity.startTimestamp = this.client.connectTime;

					return this.client.setActivity(activity, this.pid);
				}

				return new Promise(p => p());
			}).then(() => {
				resolve();
			}).catch((err) => {
				reject(err);
			});
		});
	}

	setActivity(obj) {
		if (!this.client) {
			return;
		}

		return this.client.setActivity(obj, this.pid);
	}
}
