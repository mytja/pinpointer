import prisma from '$lib/prisma/prisma';
import { Client } from './client';
import haversine from 'haversine-distance';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import classifyPoint from 'robust-point-in-polygon';
import { getRandomNumber } from 'gameServer/random';

type LatLng = { lat: number; lng: number };

export const rounds: Record<string, Round> = {};

export class Round {
	players: [];
	tournamentRoundId: string;
	state: number;
	requiredRoundNumber: number;
	tournamentPlace: string;
	polygon: number[][] | null;
	boundaryBox: number[];
	clients: Record<string, Client>;
	currentLocation: LatLng | null;
	timer: number;
	startTime: number;
	pressuredTimer: number;
	timerFunction: NodeJS.Timeout | null;
	isTournament: boolean;
	ownerId: string;

	constructor(
		tournamentRoundId: string,
		requiredRoundNumber: number,
		tournamentPlace: string,
		startTime: number,
		pressuredTimer: number,
		ownerId: string,
		isTournament: boolean,
	) {
		this.players = [];
		this.tournamentRoundId = tournamentRoundId;
		this.state = -1;
		this.requiredRoundNumber = requiredRoundNumber;
		this.tournamentPlace = tournamentPlace;
		this.polygon = null;
		this.boundaryBox = [];
		this.clients = {};
		this.currentLocation = null;
		this.timer = startTime;
		this.startTime = startTime;
		this.timerFunction = null;
		this.pressuredTimer = pressuredTimer;
		this.ownerId = ownerId;
		this.isTournament = isTournament;
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
		if (this.pressuredTimer !== -1) {
			this.initPressuredTimer();
		}
		let clients = 0;
		let lockedClients = 0;
		for (const clientId in this.clients) {
			const client = this.clients[clientId];
			clients++;
			if (client.guessLocked) lockedClients++;
		}
		if (clients === lockedClients) {
			// predčasno končajmo timer
			await this.calculateRound();
		}
	}

	sendClients() {
		const j = [];
		for (const key in this.clients) {
			const client = this.clients[key];
			j.push({ id: key, username: client.username });
		}
		j.sort((a, b) => a.username.localeCompare(b.username));
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
				[-60.0, -180.0],
				[90.0, -180.0],
				[90.0, 180.0],
				[-60.0, 180.0],
			];
			this.boundaryBox = [-180.0, -90.0, 180.0, 90.0];
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
		if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
			// Polygon coordinates are available.
			// This is more accurate.
			// Examples: Slovenia, Australia
			this.polygon = feature.geometry.coordinates[0];
			for (let i = 0; i < this.polygon!.length; i++) {
				this.polygon![i].reverse();
			}
		} else {
			// Only rough polygon coordinates are available.
			// Less accurate, more used for continents without real boundaries.
			// Examples: Europe
			this.polygon = [
				[bbox[1], bbox[0]],
				[bbox[1], bbox[2]],
				[bbox[3], bbox[0]],
				[bbox[3], bbox[2]]
			];
		}
		if (this.polygon === null) {
			throw Error('Polygon is null');
		}
		if (this.boundaryBox.length !== 4) {
			throw Error('Boundary box is invalid');
		}
	}

	locationMessage() {
		return {...this.currentLocation, round: this.state, totalRounds: this.requiredRoundNumber};
	}

	sendLocation() {
		this.broadcast('newLocation', JSON.stringify(this.locationMessage()));
	}

	async randomPlace() {
		if (this.polygon === null) {
			throw Error("Polygon hasn't been initialized yet!");
		}

		while (true) {
			const lng = getRandomNumber(this.boundaryBox[0], this.boundaryBox[2]);
			const lat = getRandomNumber(this.boundaryBox[1], this.boundaryBox[3]);
			const location = [lat, lng];
			console.log(location);

			// Check whether the generated location is contained within the polygon
			if (classifyPoint(this.polygon, location) != -1) {
				continue;
			}

			// Check for the nearest Street View
			const r = await fetch(
				`https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_SDK_KEY}&radius=100000&source=outdoor`
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
			if (classifyPoint(this.polygon, actualLocation) != -1) {
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
		this.state++;
		if (this.state > this.requiredRoundNumber) {
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
		await this.randomPlace();
		this.timer = this.startTime;
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
		const dd = Math.pow(mapDistance, 0.9);
		// 1000 points
		const distanceReductionPerMeter = 1000 / dd;

		console.log("reduction", distanceReductionPerMeter, dd);

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
			const result = haversine(client.lastGuess, this.currentLocation);
			const reduction = result * distanceReductionPerMeter;
			console.log("Reduction for client", key, reduction, result);
			const score = Math.round(
				Math.pow(Math.max(0, (1000 - reduction) / 1000), 2) * 1000
			);
			this.clients[key].score += score;
			results.push({
				userId: key,
				username: client.username,
				scoreBefore: scoreBefore,
				addedScore: score,
				distance: result,
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
			latLng: this.currentLocation
		});

		console.log('Broadcasting results', results);

		this.broadcast('roundResults', JSON.stringify(results));
	}

	initPressuredTimer() {
		this.timer = Math.min(this.timer, this.pressuredTimer);
	}

	async startGame() {
		this.state = 0;
		await this.newRound();
	}
}
