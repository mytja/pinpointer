import fs from 'node:fs';
import { asset } from '$app/paths';

export let OBCINE_GEOJSON: any;
console.log("Loading GeoJSON...");
fs.readFile(asset('OB.geojson'), 'utf8', (err, data) => {
	if (err) {
		console.error(err);
		return;
	}
	OBCINE_GEOJSON = JSON.parse(data);
	console.log("Loaded GeoJSON!");
});