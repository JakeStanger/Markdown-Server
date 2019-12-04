#!/usr/bin/env node

const fs = require("fs");
const express = require("express");
const app = express();
const showdown = require("showdown");
const startCase = require("lodash.startcase");
const handlebars = require("handlebars");
require("showdown-prettify");

showdown.setFlavor("github");
const converter = new showdown.Converter({ extensions: ["prettify"] });

function getSettings(url, host) {
	const basePath = "/srv/http/";
	url = decodeURIComponent(url);
	switch(host) {
		case "f.jstanger.dev":
			return {
				path: `${basePath}f.jstanger.dev/html/${url}`,
				tName: 'files'
			};
	}
}

app.get("*", function(req, res) {
	let url = req.originalUrl;
	if (url.endsWith("/")) url = url.slice(0, -1);

	const {path, tName} = getSettings(url, req.hostname);

	const template = fs.readFileSync(`/etc/md-to-html/templates/${tName}.html`).toString();
	const handlebarsTemplate = handlebars.compile(template, {script: true});

	console.log("Serving " + url);

  fs.readFile(path, "utf-8", function(err, data) {
		if (err) throw err;

		const split = url.split("/");
		const fileName = split[split.length - 1].split(".")[0];
		const tempateData = {
			title: startCase(fileName),
			html: converter.makeHtml(data),
			files: fs.readdirSync(path.replace(`/${fileName}.md`, ""))
				.filter(f => f.indexOf(".swp") === -1)
				.map(f => ({path: f, title: startCase(f.replace(".md", ""))}))
		};

		res.send(handlebarsTemplate(tempateData));
  });
});

app.listen(8002, function() {
  console.log("Server is running...");
});
