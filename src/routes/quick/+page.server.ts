import prisma from '$lib/prisma/prisma';
import { error, redirect } from '@sveltejs/kit';
import getUserByToken from '$lib/prisma/auth';
import { Round, rounds } from 'gameServer/server';
import { nanoid } from 'nanoid';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, cookies }) => {
		const user = await getUserByToken(cookies);
		if (user === null) {
			redirect(302, '/login');
		}

		const data = await request.formData();
		const numberOfRounds = +data.get('numberOfRounds')!;
		const startTime = +data.get('startTime')!;
		const countdown = +data.get('countdown')!;
		const location = data.get('location')?.toString();

		if (location === undefined || numberOfRounds <= 0 || startTime <= 0) {
			error(400, 'Bad request!');
		}

		const roundId = nanoid(10);

		rounds[roundId] = new Round(
			roundId,
			numberOfRounds,
			location === '' ? 'World' : location,
			startTime,
			countdown,
			user.id,
			false,
		);
		await rounds[roundId].initialize();

		redirect(302, `/round/${roundId}/map`);
	}
};
