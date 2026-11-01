<script lang="ts">
  import { ArrowRight, Check, Crosshair, Castle, Eye, Shield, Swords, Flag } from '@lucide/svelte';
  import { connections } from './learning';
  import type { StudyResults } from './study';
  import { journeyProgress } from './journey';
  import type { SavedLesson } from './progress';
  let { saved, practiced, studyResults, onExplore, selected=$bindable('safety'), onPractice }: {
    saved:SavedLesson[]; practiced:string[]; studyResults:StudyResults;onExplore:(skill:string)=>void; selected?:string;
    onPractice:(items:SavedLesson[])=>void;
  } = $props();
  const places = [
    {id:'center',cue:'Use your pawns and pieces to control the center.',name:'Center square',icon:Crosshair,x:18,y:24,mx:25,my:15},
    {id:'development',cue:'Bring out new pieces before moving the same one again.',name:'Knight outpost',icon:Flag,x:50,y:24,mx:75,my:15},
    {id:'king',cue:'Castle safely. Learn how to escape check and give mate.',name:'King’s keep',icon:Castle,x:82,y:24,mx:75,my:50},
    {id:'threats',cue:'After each move, check what your opponent attacks.',name:'The lookout',icon:Eye,x:82,y:76,mx:75,my:85},
    {id:'safety',cue:'Check whether your next square is safe.',name:'Safe ground',icon:Shield,x:50,y:76,mx:25,my:85},
    {id:'tactics',cue:'Find checks, safe captures, and attacks on two targets.',name:'Fork road',icon:Swords,x:18,y:76,mx:25,my:50},
  ];
  let progress=$derived(journeyProgress(saved,practiced,studyResults));
  let current=$derived(progress.find(skill=>skill.id===selected) || progress[0]);
  let explored=$derived(progress.filter(skill=>skill.explored).length);
  let independent=$derived(progress.reduce((total,skill)=>total+skill.independent,0)+Object.values(studyResults).filter(result=>result.independent>0).length);
</script>
<section class="journey-world" aria-label="Connected chess skills">
  <p class="journey-summary"><strong>{explored} / 6 explored</strong><span>{independent} {independent === 1 ? 'challenge' : 'challenges'} solved without help</span></p>
  <div class="world-map">
    {#each ['wide','narrow'] as layout}
      <svg class={`world-paths ${layout}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {#each connections as [from,to]}
          {@const a=places.find(p=>p.id===from)!}{@const b=places.find(p=>p.id===to)!}
          <line x1={layout==='wide'?a.x:a.mx} y1={layout==='wide'?a.y:a.my} x2={layout==='wide'?b.x:b.mx} y2={layout==='wide'?b.y:b.my} class:active={from===selected || to===selected}/>
        {/each}
      </svg>
    {/each}
    {#each places as place}
      {@const record=progress.find(skill=>skill.id===place.id)!}
      <button class="world-stop" class:chosen={selected===place.id} class:visited={record.explored} style={`--x:${place.x}%;--y:${place.y}%;--mx:${place.mx}%;--my:${place.my}%`} onclick={()=>selected=place.id} aria-pressed={selected===place.id} aria-label={`${place.name}: ${record.revisit ? `${record.revisit} to revisit` : record.explored ? 'explored' : 'unvisited'}`}>
        <span class="world-marker"><place.icon size={23}/>{#if record.independent || record.clean}<span class="world-check"><Check size={11}/></span>{/if}</span>
        <strong>{place.name}</strong><small>{record.revisit ? `${record.revisit} to revisit` : record.explored ? 'Explored' : 'Unvisited'}</small>
      </button>
    {/each}
  </div>
  <div class="world-detail" aria-live="polite">
    <div><h3>{current.name}</h3><p>{places.find(place=>place.id===current.id)?.cue}</p><p class="world-evidence">{current.completed} / {current.curriculum.length} lessons · {current.clean} without help</p></div>
    <div class="journey-actions"><button class="primary-button" onclick={()=>onExplore(current.id)}>Explore lessons <ArrowRight size={17}/></button>{#if current.positions.length}<button class="text-button" onclick={()=>onPractice(current.positions)}>Revisit my positions <ArrowRight size={15}/></button>{/if}</div>
  </div>
</section>
