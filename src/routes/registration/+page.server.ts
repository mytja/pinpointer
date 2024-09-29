import prisma from '$lib/prisma/prisma';
import { error, redirect } from '@sveltejs/kit';
import argon2 from 'argon2';
import crypto from 'crypto';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString();
		const password = data.get('password')?.toString();

		if (username === undefined || username === '' || password === undefined || password === '') {
			error(400, 'Bad request!');
		}

		if (password?.length < 5) {
			error(400, 'Password is too short!');
		}

		const hash = await argon2.hash(password);

		await prisma.user.create({
			data: {
				username: username,
				password: hash,
				loginToken: crypto.randomBytes(64).toString('hex')
			}
		});

		redirect(302, '/login');
	}
};
