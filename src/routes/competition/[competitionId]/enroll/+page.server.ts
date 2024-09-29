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

		const competition = await prisma.competition.findUnique({
			where: {
				id: params.competitionId,
				private: false,
			}
		});
		if (competition === null) {
			error(404, 'Not found!');
		}

		const competitionEnrollment = await prisma.competitionEnrollment.findFirst({
			where: {
				userId: user.id,
				competitionId: params.competitionId,
			}
		});
		if (competitionEnrollment !== null) {
			error(409, "Already enrolled!");
		}

		await prisma.competitionEnrollment.create({
			data: {
				userId: user.id,
				competitionId: params.competitionId,
				score: 0,
			}
		});

		redirect(302, `/competition/${params.competitionId}`);
	}
};
