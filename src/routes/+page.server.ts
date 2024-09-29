import getUserByToken from '$lib/prisma/auth';
import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma/prisma';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
	const user = await getUserByToken(cookies);
	if (user === null) {
		redirect(302, '/login');
	}

	const myCompetitions = await prisma.competition.findMany({
		where: {
			authorId: user.id
		}
	});

	const enrolledCompetitions = await prisma.competition.findMany({
		where: {
			competitors: {
				some: {
					userId: user.id
				}
			}
		}
	});

	const publicCompetitions = await prisma.competition.findMany({
		where: {
			competitors: {
				none: {
					userId: user.id
				}
			},
			authorId: {
				not: user.id
			},
			private: false
		}
	});

	return {
		username: user.username,
		myCompetitions: myCompetitions,
		enrolledCompetitions: enrolledCompetitions,
		publicCompetitions: publicCompetitions
	};
}
