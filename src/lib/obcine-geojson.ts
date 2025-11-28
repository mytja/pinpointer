import fs from 'node:fs';

export let OBCINE_GEOJSON: any;
fs.readFile('static/OB.geojson', 'utf8', (err, data) => {
	if (err) {
		console.error(err);
		return;
	}
	OBCINE_GEOJSON = JSON.parse(data);
});