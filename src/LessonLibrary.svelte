<script lang="ts">
  import { ArrowRight, Check } from '@lucide/svelte';
  import { studies } from './curriculum';
  import { skills } from './learning';
  import type { StudyResults } from './study';
  let {studyResults,skill=$bindable(''),onStart}:{studyResults:StudyResults;skill?:string;onStart:(id:string)=>void}=$props();
  let visible=$derived(studies.filter(lesson=>!skill || lesson.skill===skill || lesson.steps.some(step=>step.skill===skill)));
</script>
<div class="lesson-library">
  <div class="lesson-filter"><label for="lesson-topic">Explore<select id="lesson-topic" bind:value={skill}><option value="">All skills</option>{#each skills as topic}<option value={topic.id}>{topic.name}</option>{/each}</select></label><span>{visible.length} lessons</span></div>
  {#each ['opening','scenario'] as kind}
    {@const group=visible.filter(lesson=>lesson.kind===kind)}
    {#if group.length}<section aria-label={kind==='opening'?'Openings':'Challenges'}><h3>{kind==='opening'?'Openings':'Challenges'}</h3>
    {#each group as lesson}
      {@const result=studyResults[lesson.id]}
      <button class="lesson-row" onclick={()=>onStart(lesson.id)}>
        <span><strong>{lesson.title}</strong><small>{lesson.steps.length} {lesson.steps.length===1?'move':'moves'} · {lesson.level}{result?.solved ? ` · ${result.independent?'Solved without help':'Solved with help'}`:''}</small></span>
        {#if result?.independent}<Check size={18}/>{:else}<ArrowRight size={18}/>{/if}
      </button>
    {/each}</section>{/if}
  {/each}
  <p class="library-note">Lessons start a new board. Bookmark your game to return to it.</p>
</div>
