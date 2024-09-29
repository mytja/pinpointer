import prisma from '$lib/prisma/prisma';
import getUserByToken from '$lib/prisma/auth';
import { redirect } from '@sveltejs/kit';
import crypto from 'crypto';

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
				loginToken: crypto.randomBytes(64).toString('hex')
			}
		});

		cookies.set('token', '', { path: '/' });
		redirect(302, `/login`);
	}
};
