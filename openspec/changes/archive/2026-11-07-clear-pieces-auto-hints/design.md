# Design

## Intent and scope
Improve identification of the king and give beginners immediate move guidance. Keep the existing Svelte app, blue board, white/navy palette, routes, saved games, and one-screen layout.

## Approaches
A king-only scale increase leaves the disliked piece set intact. External artwork adds a license and asset dependency. Use original SVG paths for a coherent classic set, with the king taller and broader than its neighbors and a bold cross. The user selected classic pieces with a clear king.

## Automatic hints
Store optional `autoHints` in existing Progress; absent or invalid values normalize to true and explicit false survives restore and sync. Reuse the authored step or analyzed best legal move when prepare reaches ready. Do not reveal during analysis, review, warnings, promotion, completion, recall, or free-play after-game coaching. Apply after rethink too. Hide hint and square selection hide the current hint until the next prepared position. Switching off clears visible suggestions; switching on shows one on an eligible turn. Manual Hint remains available.

Use existing assistance flags and persist when a hint is shown. Start recall before prepare so Try without hints cannot briefly reveal an answer or mark the fresh run helped. Explicit linked/manual hints remain possible in recall. No automatic move is made.

## Verification
Test normalization and opt-out, fresh default, hide behavior, turn advancement, reload, lesson assistance and independent recall, settings, keyboard, promotion, and check. Inspect rendered pieces and layout at 1440x900, 320x568, and 844x390 using fresh test-origin guests. Run unit suite, build, strict specs, and browser checks. Archive, commit, push, deploy, and verify the live bundle and guest behavior.
