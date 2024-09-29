import { rounds } from 'gameServer/server';
import { error, json, redirect } from '@sveltejs/kit';
import getUserByToken from '$lib/prisma/auth';
import prisma from '$lib/prisma/prisma';

/** @type {import('../../../../../.svelte-kit/types/src/routes').RequestHandler} */
export async function POST({ params, cookies }) {
	const user = await getUserByToken(cookies);
	if (user === null) {
		redirect(302, '/login');
	}

	const roundId = params.roundId;
	if (rounds[roundId] === undefined) {
		error(404, 'Not found!');
	}

	const isTournament = rounds[roundId].isTournament;

	if (isTournament) {
		const round = await prisma.competitionRound.findUnique({
			where: {
				id: roundId
			}
		});
		if (round === null) {
			error(404, 'Not found!');
		}

		const enrollment = await prisma.competitionEnrollment.findFirst({
			where: {
				competitionId: round.competitionId,
				userId: user.id
			}
		});
		if (enrollment === null) {
			error(403, 'Not enrolled!');
		}
	}

	await rounds[roundId].clientLockGuess(user.id);
	return json({});
}
