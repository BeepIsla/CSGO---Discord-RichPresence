const DDiscord = require("discord-rpc");

module.exports = class Discord {
	constructor(clientId) {
		this.clientId = clientId;
		this.client = new DDiscord.Client({ transport: "ipc" });
		this.pid = null;
	}

	stop() {
		if (this.client.user !== null) {
			this.client.connectTime = null;
			this.client.destroy();

			this.pid = null;
		}
	}

	async start(pid, activity = null) {
		this.pid = pid;

		await this.client.login({ clientId: this.clientId });
		this.client.connectTime = Math.round(Date.now() / 1000);

		if (typeof activity !== null) {
			await this.client.setActivity(activity, this.pid);
		}
	}

	async setActivity(obj) {
		if (this.client.user === null) {
			return;
		}

		return await this.client.setActivity(obj, this.pid);
	}
}
