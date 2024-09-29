/// <reference types="@types/google.maps" />
import { produce } from 'sveltekit-sse';
import { nanoid } from 'nanoid';

const clients = new Map();

export class Client {
	userId: string;
	clientIds: string[];
	score: number;
	lastGuess: { lat: number; lng: number } | null;
	guessLocked: boolean;
	username: string;

	constructor(userId: string, username: string) {
		this.userId = userId;
		this.score = 0;
		this.lastGuess = null;
		this.username = username;
		this.clientIds = [];
		this.guessLocked = false;
	}

	newClient(): {response: Response, clientId: string} {
		const clientId = nanoid();
		this.clientIds.push(clientId);
		return {response: produce(function start({ emit }) {
			clients.set(clientId, emit);
		}), clientId: clientId};
	}

	sendToSpecificClient(clientId: string, eventName: string, data: string) {
		const emit = clients.get(clientId);
		if (emit === undefined) {
			return;
		}
		emit(eventName, data);
	}

	send(eventName: string, data: string) {
		for (let i = 0; i < this.clientIds.length; i++) {
			const clientId = this.clientIds[i];
			this.sendToSpecificClient(clientId, eventName, data);
		}
	}
}
