import type { User } from '@prisma/client';
import { type Cookies } from '@sveltejs/kit';
import prisma from '$lib/prisma/prisma';

async function getUserByToken(cookies: Cookies): Promise<User | null> {
	const sessionToken = cookies.get('token');
	console.log(cookies, sessionToken);
	if (sessionToken === null || sessionToken === undefined) {
		return null;
	}
	return prisma.user.findUnique({
		where: {
			loginToken: sessionToken
		}
	});
}

export default getUserByToken;
