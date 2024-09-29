import prisma from '$lib/prisma/prisma';
import { error, redirect } from '@sveltejs/kit';
import argon2 from 'argon2';
import crypto from 'crypto';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ cookies, request }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString();
		const password = data.get('password')?.toString();

		if (username === undefined || username === '' || password === undefined || password === '') {
			error(400, 'Bad request!');
		}

		const user = await prisma.user.findUnique({
			where: {
				username: username
			}
		});

		if (user === null) {
			error(404, 'User not found or invalid password');
		}

		try {
			if (!(await argon2.verify(user.password, password))) {
				error(404, 'User not found or invalid password');
			}
		} catch {
			error(500, 'Could not verify the password!');
		}

		let token = user.loginToken;

		if (token === '') {
			token = crypto.randomBytes(64).toString('hex');
			await prisma.user.update({
				where: {
					username: username
				},
				data: {
					loginToken: token
				}
			});
		}

		cookies.set('token', token, { path: '/' });
		redirect(302, '/');
	}
};
