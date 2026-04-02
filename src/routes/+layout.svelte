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
        width: 100%;
        display: flex;
        flex-direction: column;
        overflow-x: hidden;
    }

    main {
        width: 100%;
        max-width: 100%;
        flex: 1;
        min-height: 0;
        margin: 0;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        overflow-x: hidden;
    }
</style>
