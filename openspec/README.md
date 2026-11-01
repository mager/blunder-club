# Nextmove specs

OpenSpec is installed locally and configured for Codex. Run `npm ci` after a fresh clone. No separate global CLI is needed.

- `specs/` describes implemented behavior.
- `changes/` holds active proposals, designs, delta specs, and tasks.
- `changes/archive/` holds completed changes after their deltas update the baseline.
- `config.yaml` supplies project constraints to the workflows.
- `../HANDOFF.md` is the session entry point; `../AGENTS.md` gives repository instructions.

## Resume

```sh
npm run openspec -- list
npm run openspec -- list --specs
npm run openspec -- status --change <active-change-name>
npm run spec:check
```

For a new change, select **openspec-propose** in Codex Skills and describe the problem. Use **openspec-apply-change** to implement a prepared change and **openspec-archive-change** to finish it. Restart or reopen the project if newly generated skills do not appear. The six generated skills are versioned under `.agents/skills/`.

Official reference: [OpenSpec getting started](https://github.com/Fission-AI/OpenSpec/blob/main/docs/getting-started.md).

## Baseline map

| Spec | Boundary |
| --- | --- |
| play-and-coaching | Legal play, opponents, warnings, previews, and game review |
| authored-lessons | Typed lessons, accepted answers, hints, completion, and continued play |
| personal-practice | Saved mistakes, short practice sessions, evidence, and return to game |
| progress-sync | Guest saves, Google accounts, cloud conflicts, and result merging |
| journey-and-routes | Honest journey evidence and revisitable validated URLs |
| coach-decisions | Optional Jev choices, validation, and local fallback |
| board-presentation | Board and piece appearance, interaction states, and viewport fit |

The initial baseline records the app at commit `750de04`. Later archived changes describe subsequent behavior. It is not a claim that all future product ideas are implemented.
