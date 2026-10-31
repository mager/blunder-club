<script lang="ts">
  import { ArrowRight, Check, Crosshair, Castle, Eye, Shield, Swords, Flag } from '@lucide/svelte';
  import { connections } from './learning';
  import { journeyProgress } from './journey';
  import type { SavedLesson } from './progress';
  let { saved, practiced, selected=$bindable('safety'), onStart, onPractice }: {
    saved:SavedLesson[]; practiced:string[]; selected?:string;
    onStart:(lesson:string)=>void; onPractice:(items:SavedLesson[])=>void;
  } = $props();
  const places = [
    {id:'center',name:'Center square',icon:Crosshair,x:18,y:24,mx:25,my:15},
    {id:'development',name:'Knight outpost',icon:Flag,x:50,y:24,mx:75,my:15},
    {id:'king',name:'King’s keep',icon:Castle,x:82,y:24,mx:75,my:50},
    {id:'threats',name:'The lookout',icon:Eye,x:82,y:76,mx:75,my:85},
    {id:'safety',name:'Safe ground',icon:Shield,x:50,y:76,mx:25,my:85},
    {id:'tactics',name:'Fork road',icon:Swords,x:18,y:76,mx:25,my:50},
  ];
  let progress=$derived(journeyProgress(saved,practiced));
  let current=$derived(progress.find(skill=>skill.id===selected) || progress[0]);
  let explored=$derived(progress.filter(skill=>skill.explored).length);
  let independent=$derived(progress.reduce((total,skill)=>total+skill.independent,0));
</script>
<section class="journey-world" aria-label="Connected chess skills">
  <p class="journey-summary"><strong>{explored} / 6 explored</strong><span>{independent} {independent === 1 ? 'position' : 'positions'} solved without help</span></p>
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
        <span class="world-marker"><place.icon size={23}/>{#if record.independent}<span class="world-check"><Check size={11}/></span>{/if}</span>
        <strong>{place.name}</strong><small>{record.revisit ? `${record.revisit} to revisit` : record.explored ? 'Explored' : 'Unvisited'}</small>
      </button>
    {/each}
  </div>
  <div class="world-detail" aria-live="polite">
    <div><h3>{current.name}</h3><p>{current.text}</p><p class="world-evidence">{current.tried} tried · {current.solved} solved · {current.independent} without help</p></div>
    <button class="primary-button" onclick={()=>current.positions.length ? onPractice(current.positions) : onStart(current.lesson)}>{current.positions.length ? 'Revisit my positions' : current.lesson === 'italian' ? 'Learn the Italian Game' : 'Practise this idea'} <ArrowRight size={17}/></button>
  </div>
</section>
