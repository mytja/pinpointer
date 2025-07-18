/*
Fully copied from https://github.com/simonepri/is-sea

MIT License

Copyright (c) 2017 Simone Primarosa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

// @ts-expect-error - ts is dumb
import GeoJsonLookup from 'geojson-geometries-lookup';
// @ts-expect-error - ts is dumb
import getMap from '@geo-maps/earth-seas-10m';

let landLookup: GeoJsonLookup = null;

/**
 * Returns whether the given point is in the sea or not.
 * @public
 * @param {number} lat  The latitude of the point.
 * @param {number} lng  The longitude of the point.
 * @return {boolean} True if the point is in the sea, false otherwise.
 */
export function isSea(lat: number, lng: number): boolean {
	if (landLookup === null) {
		const map = getMap();
		landLookup = new GeoJsonLookup(map);
	}

	return landLookup.hasContainers({type: 'Point', coordinates: [lng, lat]});
}