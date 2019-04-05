const http = require("http");
const Events = require("events");

module.exports = class Server extends Events {
	constructor(authToken) {
		super();

		this.authToken = authToken;

		this.server = http.createServer((req, res) => {
			if (req.method !== "POST") {
				res.writeHead(404);
				res.end();
				return;
			}

			let post = "";
			req.on("data", data => post += data.toString());
			req.on("end", async () => {
				let json = undefined;
				try {
					json = JSON.parse(post);
				} catch(e) {};

				if (json === undefined) {
					res.writeHead(404);
					res.end();
					return;
				}

				if (json.auth.token !== this.authToken) {
					res.writeHead(404);
					res.end();
					return;
				}

				res.writeHead(200);
				res.end();

				this.emit("csgo", json);
			});
		});
	};
}
