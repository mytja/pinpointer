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

		await prisma.competition.delete({
			where: {
				id: params.competitionId,
				authorId: user.id,
			}
		});

		redirect(302, `/`);
	}
};
