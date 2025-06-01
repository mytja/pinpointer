import getUserByToken from '$lib/prisma/auth';
import { error, redirect } from '@sveltejs/kit';
import { rounds } from 'gameServer/server';
import prisma from '$lib/prisma/prisma';

/** @param {Parameters<import('./$types').PageServerLoad>[0]} event */
export async function load({ cookies, params }) {
	const user = await getUserByToken(cookies);
	if (user === null) {
		redirect(302, '/login');
	}

	const roundId = params.roundId;
	if (rounds[roundId] === undefined) {
		error(404, 'Round WS not found!');
	}

	const isTournament = rounds[roundId].isTournament;
	const ownerId = rounds[roundId].ownerId;
	const startTime = rounds[roundId].startTime;
	let competitionId = "";

	if (isTournament) {
		const round = await prisma.competitionRound.findUnique({
			where: {
				id: roundId
			}
		});
		if (round === null) {
			error(404, 'Competition round not found!');
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

		const competition = await prisma.competition.findUnique({
			where: {
				id: round.competitionId
			}
		});
		if (competition === null) {
			error(500, 'No such competition!');
		}

		competitionId = round.competitionId;
	}

	return {
		isOwner: ownerId === user.id,
		startTime: startTime,
		roundId: roundId,
		competitionId: competitionId,
		isTournament: isTournament,
		canMove: rounds[roundId].canMove,
		canRotate: rounds[roundId].canRotate,
		canZoom: rounds[roundId].canZoom,
		boundaryBox: rounds[roundId].boundaryBox,
	};
}
