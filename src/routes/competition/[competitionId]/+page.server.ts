import getUserByToken from '$lib/prisma/auth';
import { error, redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma/prisma';
import { type RoundPlayerResults, type User, type CompetitionEnrollment } from '@prisma/client';
import { Round, rounds } from 'gameServer/server';

// Game state:
// -1: waiting for start
// -2: started, waiting for players
// -1000: game is finished
// [1, infinity) = n: currently playing n-th round

/** @type {import('./$types').Actions} */
export const actions = {
	enrollUser: async ({ request, cookies, params }) => {
		const user = await getUserByToken(cookies);
		if (user === null) {
			redirect(302, '/login');
		}

		const competition = await prisma.competition.findUnique({
			where: {
				id: params.competitionId,
				authorId: user.id
			}
		});
		if (competition === null) {
			error(403, 'Forbidden!');
		}

		const data = await request.formData();
		const username = data.get('username')?.toString();

		const enrolledUser = await prisma.user.findUnique({
			where: {
				username: username
			}
		});
		if (enrolledUser === null) {
			error(404, 'Not found!');
		}

		await prisma.competitionEnrollment.create({
			data: {
				score: 0,
				userId: enrolledUser.id,
				competitionId: params.competitionId
			}
		});

		redirect(302, `/competition/${params.competitionId}`);
	},
	removeUser: async ({ request, cookies, params }) => {
		const user = await getUserByToken(cookies);
		if (user === null) {
			redirect(302, '/login');
		}

		const competition = await prisma.competition.findUnique({
			where: {
				id: params.competitionId,
				authorId: user.id
			}
		});
		if (competition === null) {
			error(403, 'Forbidden!');
		}

		const data = await request.formData();
		const userId = data.get('userId')?.toString();
		if (userId === undefined || userId === '') {
			error(400, 'Bad request!');
		}

		if (user.id === userId) {
			error(403, "You can't remove yourself as the owner!");
		}

		await prisma.competitionEnrollment.deleteMany({
			where: {
				userId: userId,
				competitionId: params.competitionId
			}
		});

		redirect(302, `/competition/${params.competitionId}`);
	},
	startRound: async ({ request, cookies, params }) => {
		const user = await getUserByToken(cookies);
		if (user === null) {
			redirect(302, '/login');
		}

		const competition = await prisma.competition.findUnique({
			where: {
				id: params.competitionId,
				authorId: user.id
			}
		});
		if (competition === null) {
			error(403, 'Forbidden!');
		}

		const data = await request.formData();
		const roundId = data.get('roundId')?.toString();
		if (roundId === undefined || roundId === '') {
			error(400, 'Bad request!');
		}

		if (rounds[roundId] !== undefined) {
			error(500, 'Cannot start already running round!');
		}

		const round = await prisma.competitionRound.findUnique({
			where: {
				id: roundId,
				state: -1,
			}
		});
		if (round === null) {
			error(403, 'Forbidden!');
		}

		await prisma.competitionRound.update({
			where: {
				id: roundId
			},
			data: {
				state: -2
			}
		});

		rounds[roundId] = new Round(
			roundId,
			round.numberOfRounds,
			round.location,
			round.startTime,
			round.countdown,
			competition.authorId,
			true
		);
		await rounds[roundId].initialize();

		redirect(302, `/round/${roundId}/map`);
	}
};

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies, params }) {
	const user = await getUserByToken(cookies);
	if (user === null) {
		redirect(302, '/login');
	}

	const competition = await prisma.competition.findUnique({
		where: {
			id: params.competitionId,
			competitors: {
				some: {
					userId: user.id,
				}
			}
		}
	});
	if (competition === null) {
		error(404, 'Not found!');
	}

	let rounds = await prisma.competitionRound.findMany({
		where: {
			competitionId: params.competitionId
		},
		orderBy: {
			roundNumber: 'asc'
		},
		include: {
			competitors: true
		}
	});
	if (rounds === null) {
		rounds = [];
	}

	let competitors = await prisma.competitionEnrollment.findMany({
		where: {
			competitionId: params.competitionId
		},
		include: {
			user: true
		}
	});
	if (competitors === null) {
		competitors = [];
	}

	type Round = RoundPlayerResults | null;
	type ExtendedCompetitors = typeof competitors & { rounds: Round[] }[];
	const competitorsJson: ExtendedCompetitors = competitors as ExtendedCompetitors;

	const bestPerformers: number[] = [];
	for (let i = 0; i < rounds.length; i++) {
		bestPerformers.push(-1);
		for (let r = 0; r < rounds[i].competitors.length; r++) {
			bestPerformers[i] = Math.max(rounds[i].competitors[r].score, bestPerformers[i]);
		}
	}

	for (let c = 0; c < competitorsJson.length; c++) {
		competitorsJson[c].rounds = [];
		competitorsJson[c].normalizedScore = 0;
		for (let i = 0; i < rounds.length; i++) {
			competitorsJson[c].rounds.push(null);
			for (let r = 0; r < rounds[i].competitors.length; r++) {
				const competitor = rounds[i].competitors[r];
				if (competitor.userId !== competitorsJson[c].userId) {
					continue;
				}
				if (bestPerformers[i] === competitor.score) {
					// @ts-expect-error - The competitor object type doesn't include isBestPerformer property, but we need to add it dynamically to track best scores
					competitor.isBestPerformer = true;
				}
				competitor.normalized = 0;
				if (bestPerformers[i] !== 0) competitor.normalized = Math.round(rounds[i].numberOfRounds * 5000 * competitor.score / bestPerformers[i]);
				competitorsJson[c].normalizedScore += competitor.normalized;
				//console.log(c, i, r, competitorsJson[c].normalizedScore, competitor.normalized);
				competitorsJson[c].rounds[i] = competitor;
			}
		}
	}

	competitorsJson.sort((a, b) => (a.normalizedScore < b.normalizedScore) ? 1 : -1);

	let totalRounds = 0;
	for (let i = 0; i < rounds.length; i++) {
		totalRounds += rounds[i].numberOfRounds;
	}

	return {
		isOwner: competition.authorId === user.id,
		competition: competition,
		competitors: competitorsJson,
		rounds: rounds,
		totalRounds: totalRounds
	};
}
