<!--suppress ES6UnusedImports -->
<script>
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { Input } from '$lib/components/ui/input';

	/** @type {import('./$types').PageData} */
	export let data;
</script>

<style>
	.subscripted {
			font-size: 0.9em;
			font-weight: normal;
			color: lightgray;
			padding-left: 5px;
	}

	.mega {
			font-size: 1.5em;
	}

	.bold {
			font-weight: bold;
	}

	.green {
			color: lightgreen;
	}
</style>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Pinpointer home" />
</svelte:head>

<div style="padding: 20px;">
	<section>
		<h1 class="text-4xl font-extrabold tracking-tight">
			{data.competition.title}
		</h1>
		{data.competition.description}

		<div style="height: 20px;"></div>

		Private:
		{#if data.competition.private}Yes{:else}No{/if}

		<br>
		<br><br>

		<h2 class="scroll-m-20 text-3xl font-bold tracking-tight">Leaderboard</h2>

		<div style="height: 10px;"></div>

		{#if data.competitors.length !== 0}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-[100px]">Name</Table.Head>
						{#each data.rounds as round}
							<Table.Head>Round {round.roundNumber}</Table.Head>
						{/each}
						<Table.Head>Total points</Table.Head>
						<Table.Head>Normalized point value</Table.Head>
						{#if data.isOwner}
							<Table.Head>Remove user</Table.Head>
						{/if}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.competitors as competitor, i (i)}
						<Table.Row>
							<Table.Cell class="font-medium">
								@{competitor.user.username}
								{#if competitor.user.name !== "" && competitor.user.name !== null}({competitor.user.name}){/if}
							</Table.Cell>
							{#each competitor.rounds as round}
								{#if round === null}
									<Table.Cell></Table.Cell>
								{:else}
									<Table.Cell><span class="mega {round.isBestPerformer ? 'green bold' : ''}">{round.score}</span><span class="subscripted">({round.normalized})</span></Table.Cell>
								{/if}
							{/each}
							<Table.Cell><span class="mega bold">{competitor.score}</span></Table.Cell>
							<Table.Cell><span class="mega bold">{competitor.normalizedScore}</span><span class="subscripted">/{5000 * data.totalRounds}</span></Table.Cell>
							{#if data.isOwner}
								<Table.Cell>
									<form action="?/removeUser" method="post">
										<Input type="hidden" name="userId" placeholder="Username" value="{competitor.user.id}"
													 class="max-w-xl" />
										<Button type="submit">Remove user</Button>
									</form>
								</Table.Cell>
							{/if}
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{:else}
			No data!
		{/if}

		{#if data.isOwner}
			<div style="height: 20px;"></div>
			<h3 style="font-size: 1.3em;">Enroll users</h3>
			<div style="height: 10px;"></div>
			<form action="?/enrollUser" method="post">
				<Input type="text" name="username" placeholder="Username" class="max-w-xl" />
				<div style="height: 7px;"></div>
				<Button type="submit">Enroll user</Button>
			</form>
			<div style="height: 10px;"></div>
		{/if}

		<div style="height: 10px;"></div>

		<h2 class="scroll-m-20 text-3xl font-bold tracking-tight">Rounds</h2>

		<div style="height: 10px;"></div>

		{#if data.rounds.length !== 0}
			<div class="grid grid-cols-4 gap-4">
				{#each data.rounds as round}
					<Card.Root>
						<Card.Header>
							<Card.Title>Round {round.roundNumber}</Card.Title>
							<Card.Description>
								Location: {round.location}<br>
								Number of rounds: {round.numberOfRounds}<br>
								Estimated time: {Math.ceil(round.startTime * round.numberOfRounds / 60)} minutes<br>
								{round.startTime} seconds per round — {#if round.countdown === -1}No countdown{:else}{round.countdown} second countdown{/if}
							</Card.Description>
						</Card.Header>
						<Card.Footer>
							{#if data.isOwner}
								<form action="/round/{round.id}/delete" method="post">
									<Button variant="outline" type="submit">Delete round</Button>
								</form>
								<div style="width: 5px;"></div>
								{#if round.state === -1}
									<form action="?/startRound" method="post">
										<Input type="hidden" name="roundId" value="{round.id}" />
										<Button type="submit">Start round</Button>
									</form>
									<div style="width: 5px;"></div>
								{/if}
							{/if}
							<br>
							{#if round.state !== -1000 && round.state !== -1}
								<Button href="/round/{round.id}/map">{#if round.state === -2}Join round{:else}Join ongoing round ({round.state}/{round.numberOfRounds}){/if}</Button>
							{/if}
						</Card.Footer>
					</Card.Root>
				{/each}
			</div>
		{:else}
			No data!
		{/if}

		<div style="height: 20px;"></div>

		{#if data.isOwner}
			<Button href="/competition/{data.competition.id}/rounds/new">Create a new round</Button>
			<div style="height: 5px;"></div>
			<form action="/competition/{data.competition.id}/delete" method="post">
				<Button type="submit">Delete this competition</Button>
			</form>
		{/if}
	</section>
</div>
