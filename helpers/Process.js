const childProcess = require("child_process");
const Events = require("events");

module.exports = class Process extends Events {
	constructor(process, checkInterval) {
		super();

		this.checkInterval = checkInterval;
		this.process = process;
		this.running = false;
		this.curPID = null;

		// Continously loop
		this.interval = setInterval(async () => {
			let PID = await this.isRunning().catch(() => { });
			if (!PID) {
				if (!this.running) {
					return;
				}

				this.running = false;
				this.curPID = null;
				this.emit("stopped");
				return;
			}

			if (this.running) {
				return;
			}

			this.running = true;
			this.curPID = parseInt(PID);
			this.emit("running", this.curPID);
		}, this.checkInterval);
	}

	/**
	 * Checks if the passed configuration is running or not
	 * @returns {Promise}
	 */
	isRunning() {
		return new Promise((resolve, reject) => {
			childProcess.exec("tasklist", { windowsHide: true }, async (err, stdout, stderr) => {
				if (err) {
					reject(err);
					return;
				}

				let lines = stdout.split("\n");
				for (let line of lines) {
					let match = line.trim().match(/^(?<process>.+\.exe)\s+(?<pid>\d+)\s+(.+)\s+(\d+)\s+(\d+([\.,�\s]\d+|){0,})\s+.*$/);
					if (!match) {
						continue;
					}

					if (!match.groups) {
						continue;
					}

					if (match.groups.process.toLowerCase() !== this.process.toLowerCase()) {
						continue;
					}

					resolve(match.groups.pid);
					return;
				}

				reject(stderr.length > 0 ? new Error(stderr) : new Error("Failed to get tasklist"));
			});
		});
	}
}
