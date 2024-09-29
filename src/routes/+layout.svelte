<script>
	import Header from './Header.svelte';
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
</script>

<div class="app">
	<ModeWatcher />

	<Header></Header>

	<main>
		<slot></slot>
	</main>
</div>

<style>
    .app {
        min-height: 100vh;
        width: 100vw;
        display: flex;
        flex-direction: column;
    }

    main {
        width: 100vw;
        flex: 1;
        margin: 0;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
    }
</style>
