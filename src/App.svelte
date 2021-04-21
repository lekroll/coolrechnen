<script>
	import Keypad from "./Keypad.svelte";
	import Icon from "svelte-awesome";
	import { faRocket, faDog, faCat, faHorse,faPaw, faSmile, faFrown} from "@fortawesome/free-solid-svg-icons";
	import { photos,level, name, results, alllevels, alloperations } from "./store.js";
	import { onMount } from "svelte";
	let settings = {};
	let a = 1;
	let b = 2;
	let desired = 3;
	let good = 0;
	let wrong = 0;
	let settingsok;
	let showsettings;
	let res = "";
	let check = false;
	let operation = "+";
	let topics = ["nasa,rocket", "cute,dog", "cute,cat","cute,rabbit","horse"];
	let topics_icon = [faRocket, faDog, faCat,faPaw,faHorse];
	let topic;
	onMount(async () => {
		checksettings();
		newtask();
		newtopic();

	});

	function settopic(thename) {
		topic = thename;
		newtopic();
	}

	function checksettings() {
		settings = JSON.parse(localStorage.getItem("settings"));
		let tempresults = JSON.parse(localStorage.getItem("results"));
		
		if (settings) {
			settingsok = true;
			level.set(settings["level"]);
			name.set(settings["name"]);
			topic = settings["topic"];
		} else {
			settingsok = false;
			topic = "cute,cat";
		}
		if (tempresults) {
			results["ok"]=tempresults["ok"];
			results["false"]=tempresults["false"];
			good = results["ok"].length;
			wrong = results["false"].length;
		} else {
			good = 0;
			wrong = 0;
		}
	}

	function savesetttings() {
		settingsok = true;
		settings = { level: $level, name: $name, topic: topic, level: $level };
		localStorage.setItem("settings", JSON.stringify(settings));
	}
	
	function dochangesettings(){
		showsettings = !showsettings;
		settingsok = true;
	}
	async function newtopic() {
		let i = 0;
		let myphotos = [];
		while (i < 10) {
			const res = await fetch(
				`https://loremflickr.com/640/480/`.concat(topic)
			);
			let photo = await res.url;
			myphotos.push(photo);
			i = i + 1;
		}
		
		photos.set(myphotos);
		
		return;
	}

	function updatetask(thelevel, theoperation) {
		level.set(thelevel);
		operation = theoperation;
		results["ok"]=[];
		results["false"]=[];
		localStorage.setItem("results", JSON.stringify(results));
		wrong=0;
		good=0;

		newtask();
	}

	function newtask() {
		res = "";
		let num1 = Math.round(Math.random() * $level);
		let num2 = Math.round(Math.random() * $level);
		if (operation == "+") {
			desired = Math.max(num1, num2);
			a = Math.min(num1, num2);
			b = desired - a;
		}
		if (operation == "-") {
			desired = Math.min(num1, num2);
			b = Math.min(num1, num2);
			a = b + desired;
		}
		if (operation == "x") {
			num1 = Math.round(Math.random() * 10);
			num2 = Math.round(Math.random() * 10);
			desired = num1 * num2;
			b = num1;
			a = num2;
		}
		if (operation == ":") {
			desired = Math.round(Math.random() * 10);
			b = Math.round(Math.random() * 10);
			a = Math.floor(desired * b);
			desired = a / b;
		}
	}
	const checkres = () => {
		let localcheck = res == desired;

		if (localcheck) {
			results["ok"].push([a, b, operation]);
			good = results["ok"].length;
		} else {
			results["false"].push([a, b, operation]);
			wrong = results["false"].length;
		}
		localStorage.setItem("results", JSON.stringify(results));
		check=true;
		setTimeout(() => {  check=false;newtask(); }, 500);
	};
</script>

<main>
	<div>
		<h1>
			{#if $name !== "Test"}
				{$name}s
			{/if}
			Rechentrainer
		</h1>
		{#if (good +	wrong)>0}
		<p>
			{Math.round(100 * (good / (good + wrong)))}% richtig von {good +
				wrong} Aufgaben
		</p>
		{/if}
		<div class="gallery-grid">
		{#each $photos as foto,i}
		
			{#if good>(i*(1+$level/10))}
			
			<figure class="gallery-frame">
			  <img class="gallery-img"  src={foto} alt="" title="">			  
			</figure>
			{:else}
			<div></div>
			{/if}

			
		{/each}
		</div>
			
		
	</div>
	{#if !settingsok | showsettings}
		<div>
			<h3>Einstellungen</h3>
			<p>
				{#if $name=='Test'}
				<strong>Bitte ändere Deinen Namen und wähle eine Schwierigkeitsstufe!</strong><br><br>
				{/if}
				Dein Name: <input
					bind:value={$name}
					placeholder="enter your name"
				/>
			</p>
			<p>Bilder</p>
			{#each topics as thetopic, i}
				<button on:click={() => settopic(thetopic)}>
					{#if thetopic === topic}
						<Icon
							style="size:1.5rem;color:#e73c7e;"
							scale="1.5"
							data={topics_icon[i]}
						/>
					{:else}
						<Icon
							scale="1.5"
							style="size:1.5rem;"
							data={topics_icon[i]}
						/>
					{/if}
				</button>
			{/each}

			<p>Schwierigkeitsgrad</p>

			{#each $alllevels as thelevel}
				{#if thelevel == $level}
					<button
						style="size:1.5rem;color:#e73c7e;"
						on:click={() => newtask()}>{thelevel}</button
					>
				{:else}
					<button on:click={() => updatetask(thelevel, operation)}
						>{thelevel}</button
					>
				{/if}
			{/each}

			<p>Rechenart</p>
			{#each $alloperations as theop}
				{#if operation === theop}
					<button style="color:#e73c7e;padding:.3rem;"
						>&nbsp;&nbsp;{theop}&nbsp;&nbsp;</button
					>
				{:else}
					<button
						style={"padding:.3rem;"}
						on:click={updatetask($level, theop)}
						>&nbsp;&nbsp;{theop}&nbsp;&nbsp;</button
					>
				{/if}
			{/each}
		</div>
		{#if $name!="Test"}
		<div>
			<button class="strongbtn" on:click={() => savesetttings()}
				>ändern</button
			>
			<br>
			<button class="strongbtn" on:click={() => dochangesettings()}
				>schließen</button
			>
		</div>
		{/if}
	{/if}
	{#if $name!="Test"}
	<div class="centered">
		<h3>Deine Aufgabe</h3>
		<span class="huge"> {a}{operation}{b} = {res} </span>
			{#if check==true}
			
			{#if res == desired}
			<span >	
				<Icon scale="2.0"
				style="size:1.5rem;margin-left: 5px;" data={faSmile}/></span>
			
			{:else}
			<span ><Icon 	scale="2.0"
				style="size:1.5rem;margin-left: 5px;" data={faFrown}/></span>
		
			{/if}
			{/if}
		
		
		
	</div>

	<div style="display:flex;justify-content: space-around;">
		<Keypad bind:value={res} on:submit={checkres} />
	</div>
	<div style="margin:3rem;">
		<button class="strongbtn" on:click={() => dochangesettings()}
			>Einstellungen ändern</button
		>

	</div>
	{/if}
</main>
