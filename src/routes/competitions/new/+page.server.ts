import prisma from '$lib/prisma/prisma';
import { error, redirect } from '@sveltejs/kit';
import getUserByToken from '$lib/prisma/auth';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, cookies }) => {
		const user = await getUserByToken(cookies);
		if (user === null) {
			redirect(302, '/login');
		}

		const data = await request.formData();
		const name = data.get('name')?.toString();
		const description = data.get('description')?.toString();
		const isPrivate = data.get('private') === 'on';

		if (name === undefined || name === '' || description === undefined || description === '') {
			error(400, 'Bad request!');
		}

		const competition = await prisma.competition.create({
			data: {
				title: name,
				description: description,
				private: isPrivate,
				authorId: user.id
			}
		});

		await prisma.competitionEnrollment.create({
			data: {
				userId: user.id,
				competitionId: competition.id,
				score: 0,
			}
		});

		redirect(302, '/');
	}
};
