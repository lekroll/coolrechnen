<script>
	import Keypad from './Keypad.svelte';
	import {level,name,results,alllevels,alloperations} from './store.js';
	import { onMount } from 'svelte';

	let a = 1;
	let b = 2;
	let desired = 3;
	let good =0;
	let wrong=0;
	let res ="";
	let check ="";
	let operation = "+";
	onMount(async => {newtask();});

	function updatetask(thelevel,theoperation){
		level.set(thelevel);
		operation= theoperation;
		newtask();
	}

 	function newtask(){
		res ="";
		let num1 = Math.round(Math.random()*$level); 
		let num2 = Math.round(Math.random()*$level); 
		if (operation=="+"){
			desired= Math.max(num1,num2);
			a = Math.min(num1,num2);
			b=desired-a;
			
		}
		if (operation=="-"){
			desired= Math.min(num1,num2);
			b = Math.min(num1,num2);
			a=b+desired;
			
		}
		if (operation=="*"){
			desired= Math.round(num2/2+1);
			b = num1+1;
			a=Math.floor(desired/b);
			desired=a*b;
			
		}
		if (operation==":"){
			desired= Math.round(num2/2+1);
			b = num1+1;
			a=Math.floor(desired*b);
			desired=a/b;
			
		}
		
	} 
	const checkres = () => 
		{ 
			let check = res==desired;

		if (check){
			results['ok'].push({'a':a,'b':b,'operation':operation});
			good=results['ok'].length;			
		}
		else {
			results['false'].push({'a':a,'b':b,'operation':operation});
			wrong=results['false'].length;
		}
		newtask();
		console.log(results);
	};
		

</script>

<main>
    <div><h1>Rechentrainer</h1>   </div>
        <div>
            <h3>Einstellungen</h3>
			<!-- <p>Dein Name: <input bind:value={$name} placeholder="enter your name"> </p>  -->
            <p>Schwierigkeitsgrad</p>
			
				{#each $alllevels as thelevel}
				{#if thelevel===$level}
					<button on:click={newtask()}  style="color:#e73c7e;">{thelevel}</button>
				{:else}
					<button  on:click={updatetask(thelevel,operation)}>{thelevel}</button>
				{/if}
				{/each}
			
		
			
            <p>Rechenart</p>    
			{#each $alloperations as theop}
			{#if operation===theop}
				<button  style="color:#e73c7e;">&nbsp;&nbsp;{theop}&nbsp;&nbsp;</button>
			{:else}
				<button on:click={updatetask($level,theop)}  >&nbsp;&nbsp;{theop}&nbsp;&nbsp;</button>
			{/if}
			{/each}
		
        </div>     
        <div>
           
			
        </div>
		<div class="centered">
			<h3>Deine Aufgabe</h3>
			<span class="huge"> {a}{operation}{b} = {res}</span>
			<p>{check}</p>
		</div>
		
			<div style="display:flex;justify-content: space-around;">
				<Keypad bind:value={res} on:submit={checkres} /></div>
		
        <div>
            <h3>Deine Punkte</h3>
			<p>Richtig: {good}</p>
			<p>Falsch: {wrong}</p>
        </div>

</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1,h2,h3,h4 {
		color: white;
		text-transform: uppercase;
		font-weight: 100;
		text-shadow: none;
		
	}
	.huge {
		font-size: 3rem;
		line-height: 6rem;
	}
	h1 {
		font-size: 2.0rem;
	}
	h2 {
		font-size: 1.5rem;
	}
	h3 {
		font-size: 1.3rem;
	}


/* 	
	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	} */
</style>