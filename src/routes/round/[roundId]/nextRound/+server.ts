import { rounds } from 'gameServer/server';
import { error, json, redirect } from '@sveltejs/kit';
import getUserByToken from '$lib/prisma/auth';
import prisma from '$lib/prisma/prisma';
import { setResponse } from '@sveltejs/kit/node';

/** @type {import('./$types').RequestHandler} */
export async function POST({ params, cookies }) {
	const user = await getUserByToken(cookies);
	if (user === null) {
		redirect(302, '/login');
	}

	const roundId = params.roundId;
	if (rounds[roundId] === undefined) {
		error(404, 'Not found!');
	}

	const ownerId = rounds[roundId].ownerId;
	if (ownerId !== user.id) {
		error(403, 'Forbidden!');
	}

	if (rounds[roundId].state < 0) {
		await rounds[roundId].startGame();
	} else {
		await rounds[roundId].newRound();
	}
	return json({});
}
