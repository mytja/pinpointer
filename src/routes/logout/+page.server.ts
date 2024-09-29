import prisma from '$lib/prisma/prisma';
import getUserByToken from '$lib/prisma/auth';
import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ cookies }) => {
		const user = await getUserByToken(cookies);
		if (user === null) {
			redirect(302, '/login');
		}

		await prisma.user.update({
			where: {
				id: user.id
			},
			data: {
				loginToken: ""
			}
		});

		cookies.set('token', '', { path: '/' });
		redirect(302, `/login`);
	}
};
