import prisma from '$lib/prisma/prisma';
import { Client } from './client';
import haversine from 'haversine-distance';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import classifyPoint from 'robust-point-in-polygon';
import { getRandomNumber } from 'gameServer/random';
import { env } from '$env/dynamic/private';
import {
	CENTRAL1_EUROPE_BOUNDING_BOX, CENTRAL2_EUROPE_BOUNDING_BOX,
	EASTERN_EUROPE_BOUNDING_BOX,
	EUROPE,
	EUROPE_BOUNDING_BOX,
	NORTHERN_EUROPE_BOUNDING_BOX,
	WESTERN_EUROPE_BOUNDING_BOX
} from './europe';
import { isSea } from '$lib/is-sea/isSea';

type LatLng = { lat: number; lng: number };

export const rounds: Record<string, Round> = {};

export class Round {
	players: [];
	tournamentRoundId: string;
	state: number;
	requiredRoundNumber: number;
	tournamentPlace: string;
	polygon: number[][][] | null;
	boundaryBox: number[];
	fakeBoundaryBox: number[];
	clients: Record<string, Client>;
	currentLocation: LatLng | null;
	timer: number;
	startTime: number;
	pressuredTimer: number;
	timerFunction: NodeJS.Timeout | null;
	isTournament: boolean;
	ownerId: string;
	canMove: boolean;
	canRotate: boolean;
	canZoom: boolean;

	constructor(
		tournamentRoundId: string,
		requiredRoundNumber: number,
		tournamentPlace: string,
		startTime: number,
		pressuredTimer: number,
		ownerId: string,
		isTournament: boolean,
		canMove: boolean,
		canRotate: boolean,
		canZoom: boolean,
	) {
		this.players = [];
		this.tournamentRoundId = tournamentRoundId;
		this.state = -1;
		this.requiredRoundNumber = requiredRoundNumber;
		this.tournamentPlace = tournamentPlace;
		this.polygon = null;
		this.boundaryBox = [];
		this.fakeBoundaryBox = [];
		this.clients = {};
		this.currentLocation = null;
		this.timer = 0;
		this.startTime = startTime;
		this.timerFunction = null;
		this.pressuredTimer = pressuredTimer;
		this.ownerId = ownerId;
		this.isTournament = isTournament;
		this.canMove = canMove;
		this.canRotate = canRotate;
		this.canZoom = canZoom;
	}

	broadcast(messageType: string, message: string) {
		for (const key in this.clients) {
			const client = this.clients[key];
			client.send(messageType, message);
		}
	}

	resetClients() {
		for (const key in this.clients) {
			this.clients[key].lastGuess = null;
			this.clients[key].guessLocked = false;
		}
	}

	clientSetGuess(userId: string, lat: number, lng: number) {
		if (this.clients[userId] === undefined || this.clients[userId] === null) {
			return;
		}
		if (this.clients[userId].guessLocked) {
			return;
		}
		this.clients[userId].lastGuess = { lat: lat, lng: lng };
		this.clients[userId].send('guess', JSON.stringify({ lat: lat, lng: lng }));
	}

	async clientLockGuess(userId: string) {
		if (this.clients[userId] === undefined || this.clients[userId] === null) {
			return;
		}
		if (this.clients[userId].guessLocked) {
			return;
		}
		if (this.clients[userId].lastGuess === null) {
			return;
		}
		this.clients[userId].guessLocked = true;
		this.clients[userId].send('guess', JSON.stringify(this.clients[userId].lastGuess));
		this.sendClients(true);
		if (this.pressuredTimer !== -1) {
			this.initPressuredTimer();
		}
		let clients = 0;
		let lockedClients = 0;
		for (const clientId in this.clients) {
			const client = this.clients[clientId];
			clients++;
			if (client.guessLocked) lockedClients++;
			else break;
		}
		if (clients === lockedClients) {
			// predčasno končajmo timer
			await this.calculateRound();
		}
	}

	sendClients(sortByScore = false) {
		const j = [];
		for (const key in this.clients) {
			const client = this.clients[key];
			j.push({ id: key, username: client.username, locked: client.guessLocked, score: client.score });
		}
		if (sortByScore) {
			j.sort((a, b) => (a.score < b.score) ? 1 : -1);
		} else {
			j.sort((a, b) => a.username.localeCompare(b.username));
		}
		this.broadcast('clients', JSON.stringify(j));
	}

	async newClient(userId: string, username: string): Promise<Response> {
		if (this.clients[userId] === undefined) {
			if (this.isTournament) {
				await prisma.roundPlayerResults.create({
					data: {
						score: 0,
						userId: userId,
						roundId: this.tournamentRoundId
					}
				});
			}
			this.clients[userId] = new Client(userId, username);
		}
		setTimeout(() => this.sendClients(), 50);
		const {response, clientId} = this.clients[userId].newClient();
		if (this.state >= 0) {
			setTimeout(() => this.clients[userId].sendToSpecificClient(clientId, "newLocation", JSON.stringify(this.locationMessage())), 50);
		}
		return response;
	}

	async initialize() {
		if (this.tournamentPlace === "World") {
			// we cut off Antarctica
			this.polygon = [
				[
					[-60.0, -180.0],
					[90.0, -180.0],
					[90.0, 180.0],
					[-60.0, 180.0],
				],
			];
			this.boundaryBox = [-180.0, -60.0, 180.0, 80.0];
			this.fakeBoundaryBox = [-180.0, -60.0, 180.0, 80.0];
			return;
		}
		const r = await fetch(
			`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(this.tournamentPlace)}&format=geojson&limit=1&polygon_geojson=1&&polygon_threshold=0.001&accept-language=en`,
			{
				headers: {
					'User-Agent': 'Pinpointer Geoguessing instance'
				}
			}
		);
		const json = await r.json();
		if (r.status !== 200) {
			throw Error('Could not fetch polygons from OSM');
		}
		const feature = json.features[0];
		const bbox = feature.bbox;
		this.boundaryBox = bbox;
		this.fakeBoundaryBox = bbox;
		if (feature.geometry.type === 'MultiPolygon') {
			// Polygon coordinates are available.
			// This is more accurate.
			// Examples: Australia
			this.polygon = [];
			const poly: number[][][][] = feature.geometry.coordinates;
			for (let i = 0; i < poly.length; i++) {
				const actualPoly = poly[i][0];
				this.polygon.push(actualPoly);
				for (let k = 0; k < this.polygon[i].length; k++) {
					this.polygon[i][k].reverse();
				}
			}
		} else if (feature.geometry.type === 'Polygon') {
			// Polygon coordinates are available.
			// This is more accurate.
			// Examples: Slovenia
			this.polygon = feature.geometry.coordinates;
			for (let i = 0; i < this.polygon!.length; i++) {
				for (let k = 0; k < this.polygon![i].length; k++) {
					this.polygon![i][k].reverse();
				}
			}
		} else {
			// Only rough polygon coordinates are available.
			// Less accurate, more used for continents without real boundaries.
			// Examples: Europe
			this.polygon = [
				[
					[bbox[1], bbox[0]],
					[bbox[1], bbox[2]],
					[bbox[3], bbox[0]],
					[bbox[3], bbox[2]]
				],
			];
		}
		if (this.tournamentPlace.toLowerCase() === 'europe') {
			this.polygon = EUROPE;
			this.boundaryBox = EUROPE_BOUNDING_BOX;
			this.fakeBoundaryBox = EUROPE_BOUNDING_BOX;
		}
		if (this.polygon === null) {
			throw Error('Polygon is null');
		}
		if (this.boundaryBox.length !== 4) {
			throw Error('Boundary box is invalid');
		}
	}

	locationMessage() {
		return {...this.currentLocation, round: this.state, totalRounds: this.requiredRoundNumber, boundaryBox: this.boundaryBox};
	}

	sendLocation() {
		this.broadcast('newLocation', JSON.stringify(this.locationMessage()));
	}

	async randomPlace() {
		if (this.polygon === null) {
			throw Error("Polygon hasn't been initialized yet!");
		}

		const boundaryBoxSize = haversine(
			{ lng: this.boundaryBox[0], lat: this.boundaryBox[1] },
			{
				lng: this.boundaryBox[2],
				lat: this.boundaryBox[3]
			}
		) / 20000000;
		const searchRadius = Math.min(80000, Math.round(boundaryBoxSize * 90000));
		console.log("BBOX SIZE: ", boundaryBoxSize, "SEARCH RADIUS: ", searchRadius);

		if (this.tournamentPlace.toLowerCase() === 'europe') {
			const choice = Math.floor(Math.random() * 5);
			if (choice === 0) this.fakeBoundaryBox = NORTHERN_EUROPE_BOUNDING_BOX;
			else if (choice === 1) this.fakeBoundaryBox = WESTERN_EUROPE_BOUNDING_BOX;
			else if (choice === 2) this.fakeBoundaryBox = CENTRAL1_EUROPE_BOUNDING_BOX;
			else if (choice === 3) this.fakeBoundaryBox = CENTRAL2_EUROPE_BOUNDING_BOX;
			else if (choice === 4) this.fakeBoundaryBox = EASTERN_EUROPE_BOUNDING_BOX;
		}

		while (true) {
			const lng = getRandomNumber(this.fakeBoundaryBox[0], this.fakeBoundaryBox[2]);
			const lat = getRandomNumber(this.fakeBoundaryBox[1], this.fakeBoundaryBox[3]);
			const location = [lat, lng];
			if (isSea(lat, lng)) {
				console.log("Hit the sea", location);
				continue;
			}

			// Check whether the generated location is contained within the polygon
			let found = false;
			for (let i = 0; i < this.polygon!.length; i++) {
				if (classifyPoint(this.polygon[i], location) == -1) {
					found = true;
					break;
				}
			}
			if (!found) {
				console.log("Not in boundary box", location);
				continue;
			}

			console.log("In boundary box", location);

			// Check for the nearest Street View
			const r = await fetch(
				`https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${env.GOOGLE_MAPS_SDK_KEY}&radius=${searchRadius}&source=outdoor`
			);
			const json = await r.json();
			if (json.status === 'ZERO_RESULTS') {
				// There were no street views found nearby.
				continue;
			}
			console.log(json);
			const actualLat = json.location.lat;
			const actualLng = json.location.lng;
			const actualLocation = [actualLat, actualLng];

			found = false;
			for (let i = 0; i < this.polygon!.length; i++) {
				if (classifyPoint(this.polygon[i], actualLocation) == -1) {
					found = true;
					break;
				}
			}
			if (!found) {
				console.log("Not in boundary box", location);
				continue;
			}

			this.currentLocation = { lat: actualLat, lng: actualLng };
			this.sendLocation();
			break;
		}
	}

	async results() {
		if (this.isTournament) {
			const round = await prisma.competitionRound.findUnique({
				where: {
					id: this.tournamentRoundId
				}
			});
			if (round === null) return;
			for (const key in this.clients) {
				const client = this.clients[key];
				const enrollment = await prisma.competitionEnrollment.findFirst({
					where: {
						competitionId: round.competitionId,
						userId: key
					}
				});
				if (enrollment === null) continue;
				await prisma.competitionEnrollment.updateMany({
					where: {
						competitionId: round.competitionId,
						userId: key
					},
					data: {
						score: enrollment.score + client.score
					}
				});
			}
		}

		this.broadcast('newLocation', JSON.stringify({...this.currentLocation, round: this.requiredRoundNumber + 1, totalRounds: this.requiredRoundNumber}));
	}

	async newRound() {
		console.log("Starting new round");
		if (this.timer > 0) {
			// Next round has already been started
			// Prevents spam clicking the "Next game" button
			return;
		}
		this.timer = this.startTime;
		this.state++;
		if (this.state > this.requiredRoundNumber && this.isTournament) {
			await prisma.competitionRound.update({
				where: {
					id: this.tournamentRoundId,
				},
				data: {
					state: -1000,
				}
			});
			await this.results();
			return;
		} else if (this.state > this.requiredRoundNumber && !this.isTournament) {
			return;
		}
		if (this.isTournament) {
			await prisma.competitionRound.update({
				where: {
					id: this.tournamentRoundId,
				},
				data: {
					state: this.state,
				}
			});
		}
		this.resetClients();
		this.sendClients(true);
		await this.randomPlace();
		this.timerFunction = setInterval(async () => {
			if (this.timerFunction === null) {
				return;
			}
			this.timer--;
			this.broadcast('countdown', JSON.stringify({ time: this.timer }));
			if (this.timer > 0) {
				return;
			}
			await this.calculateRound();
			clearInterval(this.timerFunction!);
			return;
		}, 1000);
	}

	async calculateRound() {
		if (this.currentLocation === null) {
			return;
		}

		console.log('Calculating current location', this.currentLocation);

		clearInterval(this.timerFunction!);

		// max diff distance should be 1000 kilometers
		const mapDistance = haversine(
				{ lat: this.boundaryBox[0], lng: this.boundaryBox[1] },
				{
					lat: this.boundaryBox[2],
					lng: this.boundaryBox[3]
				}
			);

		const results = [];
		for (const key in this.clients) {
			const client = this.clients[key];
			if (client.lastGuess === null) {
				results.push({
					userId: key,
					username: client.username,
					scoreBefore: this.clients[key].score,
					addedScore: 0,
					distance: -1,
					newScore: this.clients[key].score,
					latLng: null,
				});
				continue;
			}
			const scoreBefore = client.score;
			const distance = haversine(client.lastGuess, this.currentLocation);
			const score = Math.round(5000 * Math.pow(Math.E, -10 * (distance / mapDistance)));
			this.clients[key].score += score;
			results.push({
				userId: key,
				username: client.username,
				scoreBefore: scoreBefore,
				addedScore: score,
				distance: distance,
				newScore: this.clients[key].score,
				latLng: client.lastGuess
			});

			if (this.isTournament) {
				await prisma.roundPlayerResults.updateMany({
					where: {
						roundId: this.tournamentRoundId,
						userId: key
					},
					data: {
						score: this.clients[key].score
					}
				});
			}
		}

		results.sort((a, b) => {
			if (a.newScore < b.newScore) {
				return -1;
			} else if (a.newScore > b.newScore) {
				return 1;
			}
			return 0;
		});

		results.push({
			userId: 'solution',
			username: 'Solution',
			scoreBefore: -1,
			addedScore: -1,
			distance: -1,
			newScore: -1,
			latLng: this.currentLocation,
		});

		console.log('Broadcasting results', results);

		this.broadcast('roundResults', JSON.stringify(results));
		this.timer = 0;
	}

	initPressuredTimer() {
		this.timer = Math.min(this.timer, this.pressuredTimer);
	}

	async startGame() {
		this.state = 0;
		await this.newRound();
	}
}
