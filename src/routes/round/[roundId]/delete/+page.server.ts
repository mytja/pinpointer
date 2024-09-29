import prisma from '$lib/prisma/prisma';
import getUserByToken from '$lib/prisma/auth';
import { error, redirect } from '@sveltejs/kit';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ cookies, params }) => {
		const user = await getUserByToken(cookies);
		if (user === null) {
			redirect(302, '/login');
		}

		const competitionRound = await prisma.competitionRound.findUnique({
			where: {
				id: params.roundId,
				competition: {
					authorId: user.id,
				}
			}
		});
		if (competitionRound === null) {
			error(403, 'Forbidden!');
		}

		await prisma.competitionRound.delete({
			where: {
				id: params.roundId,
				competition: {
					authorId: user.id,
				}
			}
		});

		redirect(302, `/competition/${competitionRound.competitionId}`);
	}
};
