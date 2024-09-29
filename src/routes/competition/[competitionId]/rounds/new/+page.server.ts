import prisma from '$lib/prisma/prisma';
import { error, redirect } from '@sveltejs/kit';
import getUserByToken from '$lib/prisma/auth';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, cookies, params }) => {
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
		const num = +data.get('number')!;
		const numberOfRounds = +data.get('numberOfRounds')!;
		const startTime = +data.get('startTime')!;
		const countdown = +data.get('countdown')!;
		const location = data.get('location')?.toString();

		if (location === undefined || numberOfRounds <= 0 || startTime <= 0) {
			error(400, 'Bad request!');
		}

		await prisma.competitionRound.create({
			data: {
				roundNumber: num,
				numberOfRounds: numberOfRounds,
				state: -1,
				location: location === '' ? 'World' : location,
				competitionId: params.competitionId,
				startTime: startTime,
				countdown: countdown
			}
		});

		redirect(302, `/competition/${params.competitionId}`);
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
			authorId: user.id
		}
	});
	if (competition === null) {
		error(403, 'Forbidden!');
	}

	let roundNumber = 1;
	const rounds = await prisma.competitionRound.findMany({
		where: {
			competitionId: params.competitionId
		},
		orderBy: {
			roundNumber: 'asc'
		}
	});
	if (rounds.length !== 0) {
		roundNumber = rounds[rounds.length - 1].roundNumber + 1;
	}

	return {
		competition: competition,
		roundNumber: roundNumber
	};
}
