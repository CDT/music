# From Inner Melody to Piano

## 1. Purpose and implementation contract

This file is the complete product, curriculum, and implementation specification for a personal music learning app. A future coding agent should be able to build the complete application from this file without needing the original conversation, a separate product document, a paid service, or an external course author.

The user's goal is: **“I have a melody in my heart; I can play it on the piano and accompany it with chords.”** Support improvisation and transfer of musical understanding to other instruments. The core outcome is hearing, finding, harmonizing, and developing simple melodies.

The learner:

- Has a piano, can read sheet music, and can play chords.
- Can play an arrangement of Canon in D; its difficulty and the learner's technique are unknown.
- Cannot currently play melodies by ear.
- Likes classical, anime, and pop music, especially melody with simple accompaniment.
- Has no fixed practice schedule.
- Wants a comprehensive written course with guided lessons.

Do not infer advanced ear skills or advanced technique from the named piece. Do not start with months of notation drills, require perfect pitch, promise instant mastery, or turn the app into a jazz specialization. Teach relative pitch and practical tonal harmony. “Immediate” playing develops gradually as the learner internalizes familiar patterns; there is no completion-date guarantee.

### Deliverable and scope

Build a static, frontend-only app using **Vite, React, TypeScript, and Tailwind CSS**, deployable to GitHub Pages. All course content, audio generation, exercises, and progress management run in the browser. No backend, account, API key, runtime AI, subscription, or cloud database is needed.

The complete release includes all 48 lessons below, all six study pieces, working practice tools, progress and review scheduling, an accessible responsive interface, and deployment instructions. The build phases later in this file are implementation order, not permission to ship only a dashboard or sample lessons.

This document specifies future implementation. Writing this guide does not request implementation, a commit, a push, or a deployment in the current task. When later instructed to build the app, implement the specified application and verify it. A deployment workflow can be prepared without publishing the site.

The product name is **从心中旋律到钢琴**. Short navigation label: **内在旋律**. The app uses Simplified Chinese only, with no language switch. Keep content separate from components.

### Required versus optional

Required: written teaching, synthesized examples, a virtual piano, a metronome, phrase playback and looping, ear exercises, a chord comparison tool, accompaniment patterns, a melody notebook, manual real-piano practice, local progress, backup/import, search, print styles, and GitHub Pages compatibility.

Optional future enhancements: Web MIDI input, microphone pitch detection, audio recording, installable/offline PWA behavior, MusicXML/MIDI export, advanced notation engraving, and instrument-specific technique tracks. Hide unimplemented optional features; never present nonfunctional buttons. All required learning must work without these enhancements.

## 2. Teaching model

### The recurring learning loop

Every lesson follows **listen → imagine or sing → play → compare → understand → vary → use in music**. Reading is available but does not reveal an ear exercise before an attempt. The learner can reveal help at any point, without punishment.

Use two clearly distinct modes:

- **Learn:** notes, keyboard highlights, degrees, explanations, and answers can be visible.
- **Try by ear:** pitches, staff, answer-specific labels, and target keyboard animation stay hidden until the learner asks for a hint or reveals the answer. Rhythm-only indicators may remain visible.

An acoustic piano cannot be assessed automatically by this app. Say “How did it go?” and collect self-reports. Never claim to have heard, measured, or corrected the learner's playing. Screen-input exercises can be scored, but report their results separately from real-piano practice.

Teach scale degrees as positions in a key, alongside note names. Optional movable-do labels can be displayed, but degrees are the default common language. Use tonic-based minor: in A minor, A is 1, C is lowered 3, and G is lowered 7. Explain that some other teaching systems use different minor solfege conventions.

Singing is a useful bridge, not an audition. Allow humming, a comfortable octave, or silent imagination followed by comparison. Do not treat inability to sing on pitch as inability to understand music. A supplied reference pitch is normal; remembering absolute concert pitch is not required.

### Flexible practice

Offer three session sizes with editable durations. These are suggestions, not deadlines:

| Session | Suggested allocation |
| --- | --- |
| 5 minutes | 1 minute recall, 2 minutes one ear task, 2 minutes musical application |
| 15 minutes | 3 minutes review, 5 minutes new lesson, 5 minutes at piano, 2 minutes variation/reflection |
| 30 minutes | 5 minutes review, 8 minutes lesson, 10 minutes application, 5 minutes improvising, 2 minutes reflection |

Permit untimed practice and stopping midway. A session resumes at its last task. No broken-streak warnings, daily guilt messages, countdown exams, or forced lesson locks. Finishing a short meaningful task is progress.

### Feedback and completion

Use self-report choices: **Not yet**, **With help**, **Comfortable**. “With help” includes repeated listening, trial-and-error, displayed notes, or slower tempo. This is useful information, not failure.

Each lesson has an observable readiness check. These are practical course targets, not scientifically validated proficiency cutoffs. Record “completed” when the learner finishes its practice and reflection or explicitly marks it complete. Record readiness separately. Let the learner continue with help and recommend review.

Do not equate reading a lesson with acquiring a skill. Track these skill IDs separately: `inner-hearing`, `pitch-mapping`, `tonal-center`, `rhythm`, `phrase-memory`, `chord-hearing`, `harmonization`, `accompaniment`, `coordination`, `improvisation`, `transposition`, `arranging`.

### Physical practice guidance

Use a comfortable register, relaxed movements, slow tempos, and short phrases. Avoid compulsory large stretches or fixed fingerings for every hand. Give compact voicings and single bass notes before octaves. Pedal is optional and introduced after clear unpedaled playing. If a movement hurts, stop that movement; the app is not a technique or medical assessment.

## 3. Musical conventions and common reference

### Pitch, rhythm, and labels

Middle C is **C4 = MIDI 60** throughout. A4 = MIDI 69 = 440 Hz. Some hardware labels octaves differently; the app uses this convention consistently.

Written examples below use `pitch:duration` tokens. Durations are **quarter-note beats**, independent of meter: `C4:1` is a quarter note, `D4:0.5` an eighth, `E4:2` a half, `r:1` a quarter rest. `|` divides bars. Unless specified, meter is 4/4 and tempo is 60 quarter notes per minute. In 3/4 a bar totals 3; in 6/8 it totals 3 quarter beats but groups as two dotted-quarter pulses. No example has a pickup unless explicitly marked.

Degree examples use `1 2 3` for scale positions. `1'` is the tonic one octave above; `7,` is degree seven below the tonic octave. Accidentals such as `b3` and `#4` alter a degree relative to the major scale. Do not parse an unqualified “3” as major when a lesson explicitly supplies a minor-scale pitch collection: store the actual degree alteration in data.

| Key | Scale | I/i | IV/iv | V | vi/VI |
| --- | --- | --- | --- | --- | --- |
| C major | C D E F G A B | C E G | F A C | G B D | A C E |
| G major | G A B C D E F# | G B D | C E G | D F# A | E G B |
| F major | F G A Bb C D E | F A C | Bb D F | C E G | D F A |
| D major | D E F# G A B C# | D F# A | G B D | A C# E | B D F# |
| A minor | A B C D E F G | A C E | D F A | E G# B | F A C |

In A minor the table's V uses G#, an alteration of natural minor. The natural-minor v is E G B. The final column is vi in major and VI in minor. Teach the difference rather than silently inserting G# into the natural-minor scale.

### Essential theory, taught when used

- A semitone is one adjacent piano key, including black keys. A whole tone is two semitones. Major-scale offsets are `[0,2,4,5,7,9,11]`.
- Natural-minor offsets are `[0,2,3,5,7,8,10]`. Harmonic minor raises the seventh to 11. In actual minor-key music, sixth and seventh degrees can vary with musical context; do not force every phrase into a single fixed scale.
- An interval describes distance between notes. Teach direction and key context first, then names: unison 0 semitones, minor second 1, major second 2, minor third 3, major third 4, perfect fourth 5, tritone 6, perfect fifth 7, minor sixth 8, major sixth 9, minor seventh 10, major seventh 11, octave 12. Enharmonic spelling can change the interval name; the semitone chart is a beginner reference.
- Major triad offsets: `[0,4,7]`; minor: `[0,3,7]`; diminished: `[0,3,6]`. In a major key the diatonic triads are I, ii, iii, IV, V, vi, vii°.
- Uppercase Roman numerals mean major, lowercase mean minor, and ° means diminished. Numerals describe a chord's root relative to the key, not the current bass note.
- A chord root names the chord. Its bass is the lowest sounding note. C/E is a C-major chord with E in the bass, not an E-major chord. Root position, first inversion, and second inversion put the root, third, and fifth in the bass respectively.
- V7 is a major triad plus a minor seventh above its root: G B D F in C major. It often creates a strong return to I. Do not suggest all seventh chords are dominant sevenths.
- Tonic, predominant, and dominant describe common harmonic roles. I and often vi can provide tonic-related stability; ii/IV often lead away; V often points home. Context matters, and these are useful tendencies, not fixed emotional laws.
- Harmonic rhythm is how often chords change. A melody may contain many notes over one chord.
- Passing and neighbor tones can connect chord tones. A melody note does not force a chord change. Strong or sustained notes are useful clues, but not every accented note must be a chord tone.
- A cadence is a phrase-ending gesture. Teach V–I as a strong return, a phrase ending on V as open, and IV–I as another closing sound. Specific classical cadence labels also depend on voicing and melody; avoid calling every V–I a perfect authentic cadence.
- Transposition preserves musical relationships while changing key. Moving the same physical white-key shape does not reliably transpose a melody.
- Improvising includes choosing rhythm, repetition, silence, phrase endings, and variation. It is not simply playing random scale notes.

### Harmonizing a melody: the reusable procedure

1. Sing the whole phrase and identify a plausible home note. Check it by playing a closing gesture; the last note alone is not proof of the key.
2. Find the melody and its rhythm in small groups. Use a reference note and degrees if helpful.
3. Mark phrase endings, long notes, and strong beats. Start with one chord per bar or per two bars.
4. Try I and V first, then IV and vi (i, iv, V, VI for the minor exercises). Hear each option with the entire phrase.
5. Inspect sustained melody notes against chord tones. Treat short connecting notes flexibly. If a long tension sounds unintended, try another chord, move the chord change, or choose a simpler voicing.
6. Play bass roots only while singing or playing the melody. Listen to the bass line and the ending.
7. Add compact chords, then one accompaniment pattern. Keep the melody audible.
8. Compare at least two plausible choices. Record why one suits the desired phrase. Multiple harmonizations may work.

This procedure must appear as a reusable checklist in the Harmony Lab and the arrangement projects.

## 4. Curriculum: 12 modules, 48 lessons

Stable lesson IDs are `m01-l01` through `m12-l04`. Within a module, the previous lesson is the default recommended prerequisite; each module recommends the previous module. These recommendations never block access. Each record tags the most relevant skill IDs from section 2.

The following lesson briefs are authoritative teaching content. Turn each into a readable lesson using the template in section 5, preserving its concrete explanation, example, task, readiness check, and remedy. Expand transitions and worked explanations as needed; do not replace the briefs with generic advice or repeat the same exercise with a new title. All seed material and study pieces needed to author the lessons are in this file.

### Module 1 — Connect the inner sound to a key

**m01-l01 — Hear, sing, find.** A heard note, an imagined note, and a piano key can become associated through deliberate comparison. Play C4, hum it in a comfortable octave, and compare. Hear `C4:1 D4:1 C4:2`, then echo it; repeat with E4 replacing D4. Hide the keyboard answer on the second attempt. At the piano, find three short echoes before revealing notes. Ready: reproduce two of three with corrections allowed, identifying whether a miss was too high or too low. If searching feels random, reduce to C and D only. Take away: form an intention before pressing a key.

**m01-l02 — Repeats, steps, and leaps.** First hear the shape; naming the exact interval comes later. Compare `C4:1 C4:1 D4:1 C4:1` with `C4:1 E4:1 G4:1 E4:1`. Say “same, up, down” between notes, then distinguish adjacent scale steps from skips. Complete six contour prompts and find one phrase on the piano. Ready: five of six contour answers after listening, plus one playable phrase. If a leap is confusing, sing through intermediate scale notes, then sing the leap again. Do not equate every scale step with a whole tone.

**m01-l03 — Remember a whole small phrase.** Replaying every single note can conceal weak phrase memory. Use `C4:1 D4:1 E4:1 D4:1 | C4:2 r:2`. Listen twice, sing the whole phrase, wait one comfortable breath, then play it. Compare whole phrases before correcting the smallest trouble spot. Invent a different ending using C, D, and E. Ready: retain the phrase through the breath and reproduce the rhythm approximately. If it disappears, shorten to three notes; if it is easy, delay for two breaths. The goal is musical memory, not visual memorization.

**m01-l04 — Your first accompanied invention.** Sound a soft C3–E3–G3 chord, then sing a two-bar right-hand phrase using C4, E4, and G4. Find your sung phrase on the piano. First play chord and melody separately, then hold one chord under the whole phrase. Make a second phrase that ends on C4. Ready: repeat one intended phrase with a quiet accompaniment, even slowly. If coordination interrupts hearing, use only C3 in the left hand. Explain that this restricted note set is a starting exercise, not a rule that all melodies must contain only chord tones.

### Module 2 — Hear a home note and scale degrees

**m02-l01 — Find home.** Play C–F–G–C chords, then C-major phrases ending on C, D, and B. A tonal center comes from context, and an ending can feel open. Sing the note that would make each phrase feel settled; compare with C. Repeat in G using G–C–D–G. Ready: find the tonic after four of five contextual examples; a supplied tonic reference is allowed. If the last melody note keeps being mistaken for home, hear B–C and D–C over the final C chord. Avoid isolated “name this random note” tests.

**m02-l02 — Anchor degrees 1, 3, and 5.** In C, sing C–E–G–E–C over a C chord and label it 1–3–5–3–1. Echo three-note combinations from those anchors; start with 1–3–1, 1–5–3, and 3–5–1. Hear each before viewing degrees. Play the same relationships in G as G–B–D. Ready: find four of five C examples and one G example after a tonic reference. If a five-note phrase is hard, keep the tonic audible and use pairs. Explain that degree 3 becomes lowered in minor, addressed later.

**m02-l03 — Hear 2 and 4 through resolution.** Sing 1–2–1 and 3–4–3 in C, then 1–2–3 and 5–4–3. D and F gain meaning from the notes around them. Complete six short echoes using degrees 1–5, including repeats and descending movement. Ready: four of six without visible notes, plus one invented phrase ending on 1. If 2 and 4 blur together, return to their anchor resolutions and compare slowly. Describe resolution as a contextual tendency, not a compulsory direction for every occurrence of the note.

**m02-l04 — Complete the major scale.** Introduce A as 6 and B as 7 in C. Compare 5–6–5, 7–1', and 1'–7–6–5. Sing the scale once, then practise short phrases rather than only the scale. Use `G4:1 A4:1 B4:1 C5:1 | B4:1 A4:1 G4:2`. Ready: find a four-note phrase containing 6 or 7 and explain where home is. If 7–1 feels difficult vocally, use a comfortable lower octave. Transfer the final three-note resolution to G major with F#.

### Module 3 — Rhythm and phrase memory

**m03-l01 — Keep the pulse while notes change.** Beat and note onset are different: a long note spans continuing beats. At 60 BPM, clap `1, 1, 2` quarter-beat durations, then `0.5, 0.5, 1, 2`. Apply both rhythms to C–D–E. Use a count-in, then four bars with the metronome. Ready: maintain the pulse through held notes in two short attempts, self-assessed at the piano. If tapping the screen is late, distinguish interface delay from the musical task; use clapping without a score. Slow to 45 BPM if useful.

**m03-l02 — Rests, pickups, and repeated notes.** Silence is part of a phrase. Compare `C4:1 r:1 D4:1 E4:1` and `C4:1 C4:1 D4:1 E4:1`. Then demonstrate a one-quarter-note pickup G4 leading to a complete bar `C5:2 B4:1 A4:1`; show its pickup separately. Clap rhythm first, then find pitches. Ready: reproduce a rest without inserting a note and enter after a count-in. If pickup counting is confusing, clap the strong first beat while the app plays the pickup. The general exercise generator may omit pickups; this authored lesson must demonstrate one correctly.

**m03-l03 — Hear pairs of phrases.** Use study S01, bars 1–4 as a question and 5–8 as an answer. Listen to one two-bar chunk at a time, sing it, and assemble the phrase. Notice repeated material and the different ending. Ready: play four bars from memory with one restart allowed and describe which ending feels more settled. If all eight bars overload memory, retain only the first and last two. Do not reveal the complete score automatically when the learner requests one chunk's hint.

**m03-l04 — Recover a familiar tune.** Choose a tune the learner can already sing; the app need not supply its recording or score. Sing one phrase, find a comfortable starting note, map contour, recover rhythm, then join chunks. Provide S01 as the fully included alternative. Ready: recover a recognizable four-to-eight-bar melody with notes hidden and note one uncertain spot. If the tune cannot be sung from memory, use the included study first. Separate forgetting the tune from difficulty finding its notes. Saving a personal title does not add third-party music to the distributed course.

### Module 4 — Hear and choose basic chords

**m04-l01 — Major and minor chord color.** Compare C–E–G and C–Eb–G in the same register and rhythm. The third changes the chord quality; “happy/sad” is only a loose association. Hear four contrasting pairs, then identify six major/minor triads with randomized roots after guided practice. At the piano, turn C major into C minor and A minor into A major. Ready: four of six plus identifying the changed note in C. If recognition depends on register, compare both qualities on the same root before changing roots.

**m04-l02 — I and V: departure and return.** In C, play C–G–C with block chords and then bass roots alone. Hear `G4:1 B4:1 D5:2 | E5:1 D5:1 C5:2` over G then C. Compare a phrase ending on G harmony with its continuation to C. Ready: choose a closing I after hearing V in three contextual trials and play C–G–C while keeping a pulse. If hand movement is distracting, play C3–G2–C3 only. Do not require fast root-position jumps or call every ending the same cadence type.

**m04-l03 — Add IV and vi.** Compare C–F–G–C with C–Am–F–G. Hear how both F major and A minor can support A in a melody. Use `A4:2 G4:1 E4:1` over F, then Am, then C; discuss the different sustained tension over C. Ready: play both progressions slowly and name two candidate chords containing A. If there are too many labels, keep C, F, G first and add Am afterward. Explain that choosing among plausible chords requires listening to the surrounding phrase.

**m04-l04 — Harmonize a four-bar melody.** Use S01 bars 5–8 with candidate chords C, F, G, Am and one chord per bar. Follow the checklist in section 3. The reference F–C–G–C is one solution; Am–C–G–C is another option to compare. First play roots, then triads. Ready: support the phrase with a chosen progression and explain one choice using a long note or ending. If it sounds busy, change only every two bars as an experiment, then compare. Do not auto-mark an alternative as wrong merely because it differs from the reference.

### Module 5 — Make accompaniment comfortable

**m05-l01 — Inversions reduce travel.** Compare root-position C–F–G–C with left-hand voicings C3–E3–G3, C3–F3–A3, B2–D3–G3, C3–E3–G3. Name the root and lowest note separately. Keep shared notes or nearby voices when convenient. Ready: move through the compact sequence four times slowly and identify F/C correctly. If three-note shapes feel awkward, use two notes or bass alone. Explain that nearest motion is a useful arranging choice; it does not replace listening or the needs of a particular musical style.

**m05-l02 — Bass and chord patterns.** Learn the block and bass-plus-chord patterns in section 7. Apply C–Am–F–G first without melody, then with S02 bars 1–4 at 50–60 BPM. Ready: keep one pattern for four bars while singing the melody, then add the right hand if comfortable. If the pulse stops at chord changes, practise just the transition across the bar line. The left-hand pattern may be simplified to a bass on beat 1; consistency is more useful here than density.

**m05-l03 — Flowing broken chords.** Play the compact broken and open broken patterns from section 7 on C, then Am, F, G. Explain the difference between chord-tone index and scale degree. Apply one pattern to S01. Ready: play four bars with the correct new harmony at each bar line and no required pedal. If the open pattern stretches the hand, move between notes or choose the compact pattern. Do not instruct the learner to hold a large interval physically. Introduce even tone and quiet accompaniment before speed.

**m05-l04 — Balance, coordination, and pedal.** Play S01 hands separately, then melody with one bass note per bar, then the selected pattern. Make the melody perceptibly stronger than the left hand. Only after notes are clear, try changing pedal after a chord change: play new harmony, lift the old pedal, then depress again as appropriate. Ready: complete four bars with audible melody and distinguish clear from blurred harmony by listening. If coordination fails, remove inner accompaniment notes; if pedal blurs the phrase, practise without it. The app cannot assess touch or pedal acoustically.

### Module 6 — Improvise phrases with intention

**m06-l01 — Sing a motif before playing.** A motif is a small recognizable idea. Over a held C chord, sing a three-to-five-note phrase using C, D, E, G, and A; find it and repeat it exactly. This is a major pentatonic collection, not a promise that every note is equally settled against every chord. Ready: reproduce two invented motifs and identify their endings. If fingers run ahead, stop playing, sing again, then copy the sung rhythm. Use silence between attempts instead of an endless stream of notes.

**m06-l02 — Change one thing.** Start with `C4:1 D4:1 E4:2`. Make a rhythmic variation, then an ending variation, then repeat it one scale step higher as a diatonic sequence. Supply an audible comparison for each. Ready: create three variants while retaining an identifiable connection to the original. If the whole phrase changes, preserve its first two notes or rhythm. Explain that a diatonic sequence adjusts intervals to the key, while exact chromatic transposition preserves semitone distances; the app must not confuse these operations.

**m06-l03 — Aim for a note at a chord change.** Over C–Am–F–G, plan target notes E–E–A–G on beat 1. Sing a route between each pair, starting with one connecting note and leaving rests. Strong-beat chord tones are a useful scaffold. Ready: land intentionally on three of four targets in a slow loop, assessed manually, and repeat the chosen line. If the next chord arrives too soon, use two bars per chord. Explain that later phrases may deliberately delay resolution or use tension; this lesson practises one controllable choice.

**m06-l04 — Ask and answer.** Create a four-bar question ending over G, followed by a four-bar answer ending over C. Reuse one motif and change its ending. Use S01's harmony or just C–G–C–C. Ready: repeat an eight-bar invention with a recognizable related answer, even if individual notes vary slightly. If eight bars is too much, use a one-bar question and one-bar answer. Save the phrase or a verbal description in the notebook; a notation-perfect transcription is not required to finish the lesson.

### Module 7 — Minor keys and expressive color

**m07-l01 — Hear A as home.** C major and A natural minor share pitch classes but can have different tonal centers. Compare a C-major cadence with Am–Dm–Em–Am, then hear S03. Sing A as home and play A–C–E–C–A. Ready: distinguish the established home in four contextual examples and find S03's first two bars. If the shared notes confuse the learner, hold an A bass and finish on A. Do not describe minor as merely starting the C scale on another note without establishing context.

**m07-l02 — The raised seventh in minor.** Compare Em–Am with E–Am; only G changes to G#. Sing G#–A, then play `B4:1 G#4:1 E4:2 | A4:4` over E then Am. Ready: hear and play the difference and identify the raised seventh in A minor. If G# feels like a mistake, isolate G#–A over E–Am before returning to the phrase. Introduce harmonic minor as a useful collection and explain that natural G can still occur elsewhere in minor-key music.

**m07-l03 — Minor progressions and alternatives.** Play Am–F–C–G and Am–Dm–E–Am. Compare the more open loop with the return through E. Use roots first and compact chords second. Try C5 as a sustained melody over Am and F and compare its role. Ready: play both progressions and invent a two-bar melody over one. If the chord symbols are overwhelming, display i–VI–III–VII and i–iv–V–i together with note names, never replacing one with the other invisibly.

**m07-l04 — Arrange a minor melody.** Find S03 by ear in two-bar chunks, add its bass roots, then compact broken chords. Notice G# at the E chords and the final A. Ready: play four connected bars and explain why G# occurs; completing all eight is the stretch task. If the right hand loses the altered note, practise only bars 3–4 and 7–8 with left-hand roots. Compare the final E–Am with Em–Am and save a listening observation rather than declaring one universally superior.

### Module 8 — Transfer the sound to new keys

**m08-l01 — Think in degrees, not key shapes.** Translate S01 bars 1–2 from C into G using 1–2–3–5 and 6–5–3. Establish G as home before playing. Ready: play the two bars in both keys and name the starting tonic. If the learner copies white-key distances, show G-major's F# and sing the complete scale once; do not require it in a phrase that does not contain 7. Gradually hide note labels while retaining degrees.

**m08-l02 — F major and D major.** Transfer S01's final two bars to F and then D: degree 2–5–7–5 followed by 3–2–1. Show Bb in F's key signature and F#/C# in D's, with correct spellings. Ready: play the final resolution in either new key without returning to C. If both keys at once overwhelm, choose one and leave the other as a review variation. Explain that a transposed accompaniment must move with the melody.

**m08-l03 — Change the starting register.** Play the same short phrase in two octaves and transpose it to a comfortable singing range. Distinguish octave displacement from changing key. Ready: preserve rhythm and contour after moving an octave, then preserve degrees in one different key. If a leap crosses the visible keyboard, use octave controls instead of shrinking all 88 keys into the screen. Transfer task: try the phrase on another available instrument or sing it; its physical fingering must be learned separately.

**m08-l04 — A melody in three keys.** Choose S01 bars 5–8 or an original four-bar phrase. Play it with root accompaniment in C, G, and F; D is optional. Recall degrees before checking a reference. Ready: complete the phrase in two keys with help and one additional key as a deliberate attempt. If errors cluster around one scale degree, isolate that degree's resolution and rejoin the phrase. Record readiness per key rather than averaging everything into one “ear skill” percentage.

### Module 9 — Hear the bass and refine harmony

**m09-l01 — Root versus bass.** Hear C/E, F, C/G, G, C with a bass-focused playback mix. The chord identity can stay C while the bass changes. Sing the bass line E–F–G–G–C, then play melody-free voicings. Ready: identify root C and bass E for C/E and reproduce the five-note bass line. If listening to inner voices distracts, solo the bass, then restore chords. Explain that a lowest audible note can be masked in real recordings; this is a controlled introduction.

**m09-l02 — Harmonic rhythm and non-chord tones.** Play `E4:1 F4:1 G4:2` over C and compare changing to F for the brief F with holding C. F can act as a passing note here. Next hold F for two beats and compare harmonizations. Ready: explain why every melody note does not require a new chord and choose a slower harmonic rhythm for a phrase. If the learner treats chord-tone membership as a rule, hear both versions at the same tempo and discuss their different effects.

**m09-l03 — ii and V7.** In C, play Dm–G7–C: D–F–A, G–B–D–F, C–E–G. Hear F move to E and B move to C in a compact demonstration. Accompany `F4:2 A4:2 | B4:2 F4:2 | E4:2 D4:1 C4:1`. Ready: play the progression slowly and identify G7's seventh F. If four notes feel difficult, omit the fifth D from G7 or play a bass plus B/F. Avoid implying that every V7 must use the same voicing or resolution in all styles.

**m09-l04 — Compare two arrangements.** Harmonize S01 bars 5–8 as F–C–G–C, then Dm–Am–G7–C. Keep tempo and melody identical; compare bass direction, phrase tension, and ending. Ready: select a preference with an audible reason and play its roots under the melody. If both sound fine, that is a valid result. The Harmony Lab records alternatives, does not award “correctness” based only on matching a preset. Optionally try C/E for the second bar and name the bass separately.

### Module 10 — Accompaniment styles for the learner's music

**m10-l01 — A simple classical texture.** Use S04 in 3/4 and the waltz pattern. Then audition an Alberti pattern on S01 in 4/4. Explain texture and balance without claiming these patterns define all classical music. Ready: keep S04's three-beat grouping for four bars with a clear melody. If the pattern dominates, play fewer upper chord tones and soften them. Do not mix a 4/4 pattern into 3/4 by dropping events silently; each pattern explicitly declares compatible meters.

**m10-l02 — A pop ballad texture.** Use S02 with block chords, bass-plus-chord, and open broken accompaniment. Compare all at the same tempo. Add the syncopated pattern only after the simpler version is stable. Ready: choose one texture and play four bars without adding unplanned pauses at changes. If syncopation obscures the beat, return to block chords and clap the offbeat attacks. Teach an arrangement choice, not a claim that a four-chord loop is sufficient for every pop song.

**m10-l03 — An anime-inspired lyrical texture.** Use the original S05, a major-key IV–V–iii–vi phrase followed by ii–V–I–I. Hear its melody with roots, then flowing broken chords; add optional Cadd9 at the final tonic. Explain iii as Em in C and add9 as an added D above a C triad, with no seventh implied. Ready: play one four-bar phrase with a singing melody and choose whether the added note helps. If the color is distracting, use plain triads. Do not imitate or embed a named soundtrack melody.

**m10-l04 — Simplify music you love.** Take S05 or a personally chosen piece. Reduce it to melody, bass roots, chord symbols, and phrase lengths; omit ornamental runs and inner voices first. Play the skeleton, then add one pattern. Ready: create a playable four-to-eight-bar reduction and identify what was removed. If source material is too difficult to hear, use the included study and transfer the process later. The app provides a worksheet, not automatic song transcription or external recording analysis.

### Module 11 — Canon as a bridge to independent music making

**m11-l01 — Understand the familiar harmonic ground.** Explore the D-major sequence D–A–Bm–F#m–G–D–G–A, labeled I–V–vi–iii–IV–I–IV–V. Use one bar per chord as a teaching simplification, without claiming to reproduce the timing of the user's arrangement. Play and sing bass roots, then identify F# and C# in the key. Ready: play the root sequence from a degree prompt and recognize its return to the start. If it is long, split it into two four-chord groups. No score from the user's particular arrangement is required.

**m11-l02 — Write your own melody on the ground.** Use original study S06 as a demonstration, then choose one target chord tone per bar and sing a new melody before finding it. Start with two-bar chunks and rests. Ready: repeat an original four-bar phrase over the first half of the progression. If it sounds like memorized finger patterns, sing a rhythm while away from the keys and return to reproduce it. Make clear S06 is a new exercise over the progression, not a transcription of Canon's melody.

**m11-l03 — Vary density and register.** Arrange S06 once with block chords, once with broken chords, and once with the melody an octave higher where comfortable. Keep the harmonic sequence recognizable. Ready: perform two contrasting four-bar versions and describe how their textures differ. If octave placement weakens the melody, choose a nearer register instead. Save choices as arrangements referencing the same melody, not duplicate unrelated lessons. Optional challenge: repeat the second four-bar phrase with a changed ending.

**m11-l04 — Move the ground to C.** Transpose the progression to C–G–Am–Em–F–C–F–G and transfer two bars of S06 using degrees. Then improvise a new short phrase in C without reading the D notes. Ready: play the C root sequence and one transferred phrase. If semitone calculations slow everything, write the roots as I–V–vi–iii–IV–I–IV–V and build them from C. Finish by comparing what musical knowledge transferred and which hand movements needed fresh practice.

### Module 12 — Independent playing and continued growth

**m12-l01 — Recover a fresh melody.** Use a new generated four-bar phrase in C or G, constrained to the generator rules in section 8. Listen, sing, chunk, find, then join. No notation until requested. Ready: recover most of the phrase and explicitly locate any uncertainty; a correct self-diagnosis matters. If four bars is too much, use two and repeat later. Store the seed so the same phrase can be revisited, and provide a different seed for a later transfer attempt.

**m12-l02 — Harmonize without a supplied chart.** Use the melody from l01 or S01 with chords hidden. Apply the eight-step checklist, compare two choices, and settle on an accompaniment. Ready: sustain four bars with a deliberate ending and explain one chord choice. If finding pitches and choosing chords together overloads attention, confirm the melody first. The app's reference solution is a worked example, not the only acceptable answer. Record manual readiness separately from any chord-tone multiple-choice quiz.

**m12-l03 — Make a complete miniature.** Create a 30–90-second piece with a short introduction, a question, an answer, one variation, and an ending. The duration is a suggestion; a shorter coherent result is acceptable. Use one key and a familiar accompaniment pattern. Ready: play a beginning, related phrases, and an intentional ending without needing to invent new material every bar. If it grows unmanageable, use two bars per section and one chord per bar. Save melody notes or a practice journal entry and an arrangement recipe.

**m12-l04 — Transfer and make a personal plan.** Replay an early ear task, harmonize a familiar phrase, and move it to another key. Compare with the learner's own earlier notes, without fabricated improvement statistics. Choose one continuing focus: hearing longer phrases, new keys, steadier accompaniment, richer harmony, or another instrument. Ready: state what can now be done, what still needs help, and select three specific next practice tasks. Provide the ongoing practice ladder in section 12. Completing the course does not certify unrestricted improvisation or mastery of other instruments.

## 5. Lesson presentation and fully worked model

### Required lesson structure

Each lesson renders these sections in this order, with compact sections collapsible after the first reading:

1. **What you will be able to do:** one observable musical outcome.
2. **Before you start:** recommended prior lesson, relevant instrument setup, key, tempo, and notation assumptions.
3. **Listen:** a playable authored example and one focused listening question. Provide play, stop, repeat, and reveal controls.
4. **Understand:** two to five short paragraphs explaining this lesson's idea with actual notes, degrees, or rhythm. Define new terms inline and link to the reference page.
5. **Try it:** at least two concrete tasks: a supported attempt followed by an attempt with less visual help. Include exact repeat counts or a clear stopping point.
6. **At your piano:** an acoustic-piano task that remains usable with the screen several feet away. Display large instructions and optional accompaniment playback.
7. **Make it yours:** one small creative or transfer task.
8. **If this is difficult:** the specific remedy from the brief, plus an easier variant.
9. **Ready to continue?:** the lesson's observable check with the three self-report choices.
10. **Remember and revisit:** one takeaway, an optional short note, and a review task.

Target roughly 350–650 words of learner-facing content per lesson, scaling with complexity. This is an editorial target, not a reason to pad. Every lesson needs meaningful content and its own musical application. For lessons with invented or personal melodies, include an authored demonstration using the supplied note collection so the Listen section always works.

The five-minute path shows Listen, one Try task, and Make it yours. Longer paths add reading, repetitions, and transfer. Changing time budget does not create a different lesson ID or erase progress.

### Fully worked learner-facing lesson: m01-l01

**Hear a short phrase, then find it**

You will practise connecting a sound to a piano key. You can already use notation to tell your fingers where to go. Here, the instruction comes from a sound you have just heard. It is normal to need a few attempts.

Sit at the piano with your device nearby. Find middle C. We call it C4; you do not need to remember that label to do the exercise. Keep the volume comfortable and leave the left hand free for now.

**Listen.** Play the example once. It begins on C, moves to a nearby higher note, and comes back. Listen again without touching the piano. Can you imagine its final note after the sound stops?

Authoring data: C4 for one beat, D4 for one beat, C4 for two beats, at 60 BPM. Learn mode can show notes. Try by ear mode conceals the middle note until a hint or reveal.

**Understand.** You do not need to identify a note from silence. The first C is your reference. You are learning how the next sound relates to it. Hearing whether a note repeats, rises, or falls gives your hands useful information before you search.

Hum the phrase in a comfortable octave. If humming is awkward, imagine it silently and listen again. The purpose is to hold the sound long enough to compare it with the piano, not to judge your singing voice.

**Try it.** Play C, then find the higher note you heard, then return to C. Before each attempt, hear the phrase internally. If your chosen middle note sounds too high, try a lower nearby key. If it sounds too low, try a higher one. Compare the whole phrase after each adjustment.

Repeat until you can play it twice. Now listen to the second phrase: C, a higher note, C. Its middle note is farther away. Try to find it before showing the answer. The second phrase is C4–E4–C4 with the same rhythm.

**At your piano.** Alternate the two phrases three times, listening to the app before each one. Then choose one and play it after a quiet breath, with no replay during the breath. Give yourself time to correct it.

**Make it yours.** Sing a new three-note phrase using the notes you found. Play what you sang, then repeat that exact idea. If your fingers play something different, decide whether to correct the fingers or intentionally adopt the new phrase; notice the difference between those choices.

**If this is difficult.** Use only C and D. Play each separately, sing or imagine it, and compare. Return to the short phrase when those two sounds feel distinguishable. If remembering is harder than finding keys, shorten the pause before playing.

**Ready to continue?** Can you reproduce two of three short echoes, with corrections allowed, and say whether a missed note was above or below your intended sound? Choose Not yet, With help, or Comfortable. All three choices let you continue.

**Remember.** Hear an intention, play, then compare. Next time, revisit one phrase before revealing its notes.

### Worked harmony explanation to reuse

For S01 bar 5, the melody is A4–A4–G4. F major contains A, as does A minor. Try both under the bar. F gives a IV harmony in C; Am gives vi. The brief G does not automatically demand a new chord. Continue into bar 6, E4–D4–C4, over C, then hear G–C under the final two bars. The phrase context helps you choose between F and Am. Neither choice is rejected solely because it differs from the reference arrangement.

Include this comparison in m04-l04 with synchronized melody and switchable chord alternatives. Put the written explanation behind Reveal in its challenge version.

## 6. Included study pieces and content assets

These six short melodies are authored for this guide. Use the note data below as the canonical assets; generate their sound locally. Do not substitute copyrighted soundtrack recordings or scores. The Canon-related exercise uses the harmonic sequence as teaching material and a new melody. Label each piece accurately as an original study, not a transcription of a commercial song or of the user's arrangement.

Each study must support: Listen; Learn melody by ear in chunks; View notes/degrees; Add bass; Add chords; Choose pattern; Transpose; Make a variation; Save arrangement choices. Allow melody, bass, and upper accompaniment to be auditioned independently.

### S01 — First Light

C major, 4/4, 60 BPM. Eight bars; right-hand register C4–B4. Reference chords, one per bar: **C | Am | F | G | F | C | G | C**.

```text
1  C4:1 D4:1 E4:1 G4:1
2  A4:2 G4:1 E4:1
3  F4:1 E4:1 D4:1 C4:1
4  D4:2 G4:2
5  A4:1 A4:1 G4:2
6  E4:1 D4:1 C4:2
7  D4:1 G4:1 B4:1 G4:1
8  E4:1 D4:1 C4:2
```

Teaching: contour, two-bar memory, question/answer, basic harmonization, and transposition. Bar 3's connecting tones demonstrate that one chord can support several melodic pitches. Use bars 5–8 for the first harmony worksheet. Acceptable comparison progression: Am–C–G–C for those four bars.

### S02 — Small Steps

C major, 4/4, 68 BPM. Reference chords: **C | Am | F | G | C | Am | F G | C**. In bar 7, F occupies beats 1–2 and G beats 3–4.

```text
1  E4:1 E4:0.5 G4:0.5 G4:1 E4:1
2  A4:1 G4:1 E4:2
3  F4:1 A4:1 G4:1 F4:1
4  D4:2 r:1 G4:1
5  E4:1 G4:1 C5:1 B4:1
6  A4:2 E4:1 G4:1
7  A4:1 F4:1 D4:1 B4:1
8  C5:3 r:1
```

Teaching: pop phrasing, an eighth-note pair, a rest, and a mid-bar chord change. Keep the melody rhythm intact when changing accompaniment. For bar 7, pattern events after beat 2 use G harmony; split sustained accompaniment at the change.

### S03 — Evening Window

A minor, 4/4, 58 BPM. Reference chords: **Am | Dm | E | Am | F | Dm | E | Am**.

```text
1  A4:1 C5:1 B4:1 A4:1
2  F4:1 A4:1 D5:2
3  B4:1 G#4:1 E4:2
4  A4:3 r:1
5  C5:1 A4:1 F4:2
6  A4:1 F4:1 D4:2
7  E4:1 G#4:1 B4:1 G#4:1
8  A4:4
```

Teaching: minor tonic, iv–V–i, and the raised seventh. Spell G# correctly rather than Ab. Display natural G in the reference scale and explicitly mark G# as an alteration in the melody.

### S04 — Little Waltz

C major, **3/4**, 72 quarter-note BPM. Reference chords: **C | G | C | G | F | C | G | C**.

```text
1  E4:1 G4:1 C5:1
2  B4:2 G4:1
3  E4:1 G4:1 E4:1
4  D4:3
5  F4:1 A4:1 C5:1
6  G4:2 E4:1
7  D4:1 G4:1 B4:1
8  C5:3
```

Teaching: three-beat grouping, bass–chord–chord accompaniment, and phrase closure. Do not play the default four-beat count-in for this study; count one complete three-beat bar.

### S05 — Skyward Letter

C major, 4/4, 64 BPM. Reference chords: **F | G | Em | Am | Dm | G | C | C**.

```text
1  A4:1 G4:1 F4:1 A4:1
2  B4:1 A4:1 G4:2
3  G4:1 B4:1 E5:2
4  C5:1 B4:1 A4:2
5  F4:1 A4:1 D5:2
6  B4:1 A4:1 G4:1 D5:1
7  E5:2 D5:1 C5:1
8  C5:3 r:1
```

Teaching: lyrical contour, IV–V–iii–vi and ii–V–I, texture, and long-note phrasing. Optional final chord Cadd9 = C–E–G–D; explain the added D and audition it. Do not label this progression as universal to anime music or as belonging to a particular composer.

### S06 — Ground and Wings

D major, 4/4, 60 BPM. Reference chords: **D | A | Bm | F#m | G | D | G | A**. Loop may return to D; for a standalone ending append a ninth bar D harmony with D5:4.

```text
1  F#4:1 A4:1 F#4:1 E4:1
2  E4:1 C#4:1 E4:2
3  F#4:1 B4:1 A4:1 F#4:1
4  A4:2 F#4:1 C#4:1
5  B4:1 A4:1 G4:2
6  F#4:1 E4:1 D4:2
7  G4:1 B4:1 A4:1 G4:1
8  E4:1 C#4:1 E4:2
```

Teaching: familiar harmonic ground, target tones, variation, and D-to-C transposition. The eight-bar loop intentionally ends on V. Do not claim it has already closed on tonic. Store the optional ninth-bar ending as a named variant rather than altering the canonical eight-bar score.

### Reference library

Provide searchable entries for every term introduced in section 3 and the lessons. Each entry needs a plain definition, a concrete C-major or A-minor example, a Play button where meaningful, and links to relevant lessons. Include these additional concise definitions:

- **Audiation / inner hearing:** imagining musical sound when it is not currently sounding. Task: imagine C–D–E after hearing it, then compare.
- **Contour:** the pattern of rising, falling, and repeated pitches.
- **Motif:** a short musical idea that can be repeated and varied.
- **Phrase:** a musical thought with a perceived grouping or ending; it need not have a fixed number of bars.
- **Arpeggio / broken chord:** chord notes sounded successively instead of simultaneously.
- **Voicing:** the register, spacing, order, and possible omissions or doublings of chord tones.
- **Lead sheet:** a compact representation of melody and chord symbols, sometimes with lyrics; this app's studies use melody and chords.
- **Syncopation:** rhythmic emphasis that interacts with the expected beat, often through offbeat attacks or sustained notes across strong beats.
- **Compound meter:** beats divided into three; the 6/8 tool groups six eighth notes as two larger pulses.
- **Add9 versus sus2:** Cadd9 includes E along with C, G, and D; Csus2 replaces the third with D. Use only add9 in the required course.
- **Relative versus parallel minor:** C major and A minor share a key signature; C major and C minor share a tonic.

Include a compact chord reference for C, F, G, Am, Dm, Em, G7, D, A, Bm, F#m, E, Bb, and Cadd9, with spelled notes, piano highlighting, and audible playback. Generate transposed equivalents from the theory model, not hardcoded label substitutions.

## 7. Accompaniment pattern specification

All timing is in quarter-note beats from bar start. Patterns operate on spelled chord tones and a selected voicing, not on string-parsed display names. For examples below, C-major root-position compact tones are `[C3,E3,G3]`, root is C3, fifth is G3, and upper root is C4. F and G may be voiced nearer the previous chord; bass roots are selected in MIDI 36–55. Keep upper accompaniment below the melody when practical; never silently change the melody register.

| ID | Meter | Events within one bar |
| --- | --- | --- |
| `held` | Any supported | Full compact chord at 0, held to the next change or bar end |
| `block` | 4/4 | Full compact chord at 0 and 2; each lasts 1.8 beats |
| `bass-chord` | 4/4 | Bass at 0 and 2, duration 0.9; compact upper chord at 1 and 3, duration 0.8 |
| `compact-broken` | 4/4 | Voicing tone indices 0,1,2,1 at offsets 0,1,2,3; each lasts 0.9 |
| `open-broken` | 4/4 | Root, fifth, upper root, fifth at offsets 0,1,2,3; each lasts 0.9 |
| `alberti` | 4/4 | Low, high, middle, high, repeated: indices 0,2,1,2,0,2,1,2 at offsets 0,.5,1,1.5,2,2.5,3,3.5; duration .45 |
| `waltz` | 3/4 | Bass at 0, duration .9; upper chord at 1 and 2, duration .8 |
| `gentle-six` | 6/8 | Root, middle, high, fifth, middle, high at offsets 0,.5,1,1.5,2,2.5; duration .45; accent offsets 0 and 1.5 |
| `pop-offbeat` | 4/4 | Bass at 0 and 2, duration .8; upper chord at .5,1.5,2.5,3.5, duration .4 |

These durations deliberately leave small gaps. Articulation controls may alter them within safe bounds. Pattern labels are suggestions, not a genre classifier. Add a one-bar preview and a slow two-chord demonstration for each.

Chord changes can occur mid-bar. Retain the bar-relative rhythmic grid; select the active chord at each event onset. Cut old sustained harmony at the change. If no pattern event occurs exactly at a change, add a quiet bass onset there so the change is heard. Do not restart a full four-beat pattern at beat 3 and spill over the bar. Held pattern retriggers at each change.

For simple triads, use ordered compact three-note voicings within a comfortable register. G7 can use a compact four-note voicing for held/block patterns; arpeggio patterns can use a documented three-note subset including third and seventh, such as B–D–F with a separate G bass. Cadd9 requires a named four-note voicing for held/block or an explicitly documented arpeggio adaptation. Never silently pretend an incomplete three-note set contains every chord tone. The learner can always return to plain triads.

## 8. Practice tools and exact behavior

### Shared exercise flow

States: `ready → listening → awaiting-response → feedback → complete`, with repeat and retry transitions. Stop returns listening to ready without logging a failed attempt. Navigation stops all sounding notes. Each attempt stores prompt ID/seed, input mode, hints used, submitted answer if any, outcome, and time. Replaying a prompt is allowed; count replays separately from hints.

Every task includes instructions, a clearly labeled listening control, a hint, answer reveal, retry, and an appropriate manual alternative. Feedback says what happened: “Your second note was higher than the target,” or “This chord contains the sustained A.” Never use a single score to judge musical expressiveness.

### Ear trainer

Modes:

1. Contour choice: same/up/down for pairs, then contour of three-to-five-note phrases.
2. Contextual degree identification: play a cadence or tonic reference, then a target note; answer with a degree. Never display a target note name before the response.
3. Phrase reconstruction: listen, then enter an ordered sequence on the virtual piano or degree buttons; optional rhythms are provided first. Replay the learner's sequence and target separately.
4. Rhythm imitation: hear a pattern, clap at the piano or tap a screen pad after a count-in. Always offer manual assessment.
5. Chord quality: major/minor with identical timbre and comparable register; later triads with varied roots.
6. Functional listening: establish a key and compare phrase endings or choose tonic/dominant contextually.
7. Free piano echo: listen, play on the actual piano, reveal, and self-report. No automatic pitch claim.

For screen phrase reconstruction, score submitted pitch sequence by position and length, with explicit handling of missing/extra notes. Default is exact pitches within the stated range. An explicit octave-equivalent practice mode compares pitch classes and says so; do not silently accept octave errors. Rhythmic accuracy is separate from pitch accuracy. Hints can reveal contour, first pitch, degrees, then notes. Store each hint; a revealed answer is an assisted attempt.

For rhythm tapping, use `performance.now()` timestamps relative to the count-in start. Default mode assesses spacing only: align the first tap to the first expected onset, compare subsequent inter-onset timing, and label the result “Rhythm spacing.” Optional beat-aligned mode uses the count-in timeline and a user-adjustable latency offset. Use one-to-one monotonic matching within a configurable tolerance, initially 0.2 quarter beats, and show unmatched/missing taps separately. Do not claim acoustic-piano timing accuracy. No score is produced for a rest-only or single-onset spacing prompt. Tiny sample sizes get descriptive feedback, not a proficiency percentage.

### Deterministic phrase generation

Include at least 24 authored starter prompts, derived from the seeds below, plus bounded deterministic generation for later practice. Prompt identity includes generator version and seed; refreshing does not change an active prompt.

- Level A: C major; degrees 1–3; three notes; first note 1; quarter notes with final half note. Seed contours: 1–2–1, 1–3–1, 1–2–3, 3–2–1, 1–1–2, 2–3–2. When a seed starts above 1, supply the tonic reference first; do not force a different melody by overwriting its first note.
- Level B: C major then G; degrees 1–5; four notes; mostly steps, occasional third; one bar of quarters. Seed phrases: 1–2–3–2, 3–2–1–1, 1–3–5–3, 5–4–3–2, 2–3–4–3, 5–3–2–1.
- Level C: C/G/F; full major scale over one octave; two bars; maximum melodic leap a perfect fifth; repeat a motif and vary its ending. Seed degrees: 1–2–3–5 / 6–5–3(2 beats); 3–4–5(2) / 2–7,–1(2); 5–6–5–3 / 4–2–1(2); 1–3–2–4 / 3–2–1(2); 3–5–6–5 / 4–3–2(2); 5–3–4–2 / 3–2–1(2). Omit any seed whose register or interval violates the selected exercise bounds rather than modifying it silently.
- Level D: four bars in one key, with a two-bar motif followed by a related answer; mostly stepwise movement, no leap greater than a fifth, at most one eighth-note pair per bar initially, and optional quarter rest. Six authored prompts are S01 bars 1–4, S01 bars 5–8, S02 bars 1–4, S03 bars 1–4, S04 bars 1–4, and S05 bars 1–4; these authored studies retain their own keys/meters and are not all subject to the narrower generated-prompt constraints.

For generated Level D prompts, choose harmony I–IV–V–I or I–vi–V–I, one chord per bar. Choose a chord-tone anchor on each downbeat in the selected octave; fill remaining notes with neighboring scale tones or repeats. End on tonic. Rhythm templates per 4/4 bar are `[1,1,1,1]`, `[1,1,2]`, `[2,1,1]`, or `[.5,.5,1,2]`. At most one nonfinal event per phrase may become a rest. For a related answer, reuse the first bar's rhythm and first two degrees where compatible, then resolve the ending. Reject violations with bounded retries and fall back to a known-valid authored prompt. Never allow an unbounded generator loop.

Generated exercises must not rely on all possible random notes sounding equally musical. Validate beat totals, pitch bounds, key spelling, leap limits, deterministic reproduction, and answer integrity. Reference harmony remains an example; free harmonization is manually evaluated.

### Virtual piano

Default visible range C4–C6, with octave shifts and an expanded view C3–C6 on larger screens. Support pointer and touch note-on/note-off, multi-touch where available, black-key hit testing, and keyboard shortcuts in an explicitly focused piano region. White-key shortcuts A S D F G H J K map to C D E F G A B C; W E T Y U map to C# D# F# G# A# within the active base octave. Display mappings when enabled; make them reassignable later, not a release requirement.

Ignore repeated keydown events, track pressed keys, release on pointer cancel, lost capture, blur, route changes, and Stop. Do not intercept typing in text fields or global browser shortcuts. Provide roving keyboard focus and accessible note labels. A simpler sequential note-entry control is the accessible/mobile alternative; playing multiple keys simultaneously is never required to navigate the app.

Label mode: note names, scale degrees, both, or hidden. In challenges, hide target highlights even from answer-revealing accessible descriptions; keep actionable controls properly labeled. Manual notes played by the learner can remain highlighted.

### Metronome and transport

Tempo 30–180 quarter-note BPM, default 60. Support 4/4, 3/4, and 6/8 with clear grouping. For 6/8, display quarter-note BPM plus the equivalent dotted-quarter pulse rate (`quarter BPM × 2/3`) and accent the two compound beats. Count-ins use the selected meter. Controls: play/stop, tempo, one/two-bar count-in, subdivision off/eighths, volume, and accented first beat.

Phrase player: play/stop, replay, tempo, bar-range loop inclusive of chosen start/end bars, one-shot versus loop, optional count-in, and melody/bass/upper-chord mix. Changing tempo or loop bounds during playback takes effect on restart in the required release; communicate this simply and restart on explicit user action. No live tempo-warp implementation is required. Stopping also clears queued notes and UI highlights.

### Harmony Lab

Choose an included study or notebook melody, key, chord region, chord options, and pattern. Show a bar timeline with melody and chord slots. Each slot has start and duration in beats; support one or two chords per bar. Default candidate set follows learned material, with an “All course chords” option. Compare A/B arrangements at identical tempo and melody volume. Offer bass-only and block-chord previews.

For a selected melody note and candidate chord, highlight common pitch classes and label root/bass. Provide factual feedback such as “A is the third of F major” and “G is outside this triad.” Do not label all non-chord tones errors. Do not implement a misleading “best chord” AI button. Save the selected progression, voicings, pattern, and written reason in the notebook.

### Melody notebook

Support two entry types: a free-text practice journal and a structured melody. Structured entry uses a bar grid or sequential note editor with pitch buttons/virtual piano, octave, duration (0.5, 1, 1.5, 2, 3, 4 beats), rest, delete, undo/redo for the current editing session, and playback. Support C/G/F/D major and A minor initially, with chromatic notes available for G# and later alterations. Data representation supports other keys without a redesign.

A bar-total indicator shows remaining or excess beats. Save drafts with incomplete bars, but mark them as drafts and disable full arrangement playback until valid, explaining which bar needs repair. Autosave local drafts after a short debounce; preserve IDs and timestamps. Record titles, lesson links, tags, text reflection, chosen chords/pattern, and optional A/B alternatives. Offer JSON backup and a printable melody/chord worksheet. Audio transcription, staff drag-and-drop, and audio file upload are outside the required release.

### Notation and written accessibility

Required musical display is a readable beat grid with note names, durations, bar lines, chord symbols, and scale degrees. Include simple SVG staff notation for the six canonical studies and authored lesson examples, generated from the same event data with correct clefs, key signatures, accidentals, rests, and rhythmic values used here. A tested notation library is acceptable; select and verify it at implementation time. All notation has an equivalent text/beat-grid view. The notebook may use the beat grid only in the required release.

If implementing staff rendering becomes substantial, keep audio and text-grid lessons usable during development, then complete the canonical staff views before declaring the release done. Do not display decorative notes that contradict playback.

## 9. Information architecture and interface

### Routes

Use hash routing so a lesson URL can be refreshed on GitHub Pages without a server rewrite. The URL shape is `/music/#/lesson/m01-l01` for a repository named `music`; the actual repository base is configurable.

| Route | Purpose and required content |
| --- | --- |
| `#/` | Continue lesson, choose 5/15/30 minutes or untimed, next review, recent notebook entry |
| `#/start` | Optional onboarding and a short diagnostic; skippable |
| `#/course` | All 12 modules and 48 lessons, searchable/filterable with real completion states |
| `#/lesson/:lessonId` | Full lesson reader, embedded tasks, piano practice mode, reflection |
| `#/practice` | Ear trainer, metronome, free piano, recent presets |
| `#/practice/ear` | Exercise configuration and attempt flow |
| `#/harmony` | Melody and chord comparison workspace |
| `#/studies` | Six included studies, filters, learning stages |
| `#/studies/:studyId` | Study player, chunk learning, accompaniment and arrangements |
| `#/notebook` | Local entries, create/edit, search, draft states |
| `#/notebook/:entryId` | Entry editor and playback |
| `#/reference` | Searchable glossary, key/chord/pattern reference |
| `#/progress` | Completed lessons, self-reported readiness by skill, due reviews, session history |
| `#/settings` | Sound, labels, text size, motion, practice defaults, storage status, backup/import/reset |

Unknown routes, missing lesson IDs, and removed notebook IDs show a useful not-found view with links back to Course or Notebook. No blank screens. Back/forward navigation restores the appropriate route. Query parameters within the hash may carry study, key, or bar selection; do not put journal text in URLs.

### First visit and returning visit

First visit: show the promise in one sentence, “Learn to turn the music you hear into melody and accompaniment,” then Start first lesson and Browse course. Onboarding asks only useful preferences: comfortable starting range, label choice, sound test, and default session length with “Decide each time.” Prefill the user's known profile from section 1 and let it be edited; do not ask the same four background questions again as a requirement.

Optional diagnostic: echo a three-note phrase manually, distinguish up/down, and play a known chord. Record self-reports and suggest m01-l01. Existing chord and reading skills never cause the app to skip ear fundamentals automatically. The diagnostic is not a prerequisite.

Returning visit: lead with Continue and the previous task title. Display actual progress or a welcoming empty state. Do not seed fake streaks, hours, scores, journal entries, or completed lessons to make the dashboard look populated.

### Visual direction

Design a quiet practice companion with a book-like reading experience. Use a warm light background, dark legible text, a restrained teal primary color, and amber for listening/reveal accents. Suggested tokens: background `#F7F5F0`, surface `#FFFFFF`, text `#202825`, muted text `#52605A`, primary `#176B5B`, border `#D8DFD8`. Verify actual contrast for each text/background pairing rather than assuming these suggestions guarantee accessibility.

Use a system sans-serif font for controls and a readable serif stack for optional lesson headings; no external font request is required. Body text at least 16px, lesson reading text around 18px, line-height 1.6–1.75, reading width 65–75 characters. Use consistent spacing and clearly visible primary actions. Avoid a dense analytics dashboard, decorative sheet music, animated backgrounds, or giant hero sections between the learner and practice.

Desktop: compact left navigation, central reading column, optional right-side practice panel. Tablet: collapsible navigation and practice below reading. Mobile: top bar plus a small bottom navigation for Home, Course, Practice, Notebook, with other destinations in a labeled menu. A fixed transport must not cover focused controls or the last lines of a lesson. Piano practice mode enlarges the current instruction and essential playback buttons.

Use icons only with labels or accessible names. A Play control must visibly become Stop while playing. Show status text for loading, suspended audio, unsaved changes, and unavailable storage. Prefer inline feedback over toast-only information.

### Accessibility and printing

Use semantic landmarks, ordered headings, skip navigation, visible focus, native buttons, and labels on every input. Meet WCAG 2.2 AA as a verification target. Aim for touch targets at least 44 CSS pixels where possible. Information conveyed by color must also have text or shape. Honor reduced-motion preferences; avoid mandatory animation. Text zoom and narrow widths must preserve essential controls.

Do not announce every playback note through a live region; that overwhelms screen readers. Announce state changes and exercise feedback politely. For visual music, provide note/duration text; for an ear test, keep the answer text hidden until reveal just as it is visually. Let users choose a learning mode with visual support when hearing-only assessment is unsuitable; do not pretend this measures the same listening skill.

Print lesson and study pages with controls/navigation removed, readable black text, visible notation or grids, chord tables, and exercise instructions. A Print course action renders all 48 written lessons in order in a dedicated print view; it must work without loading every interactive audio component. Print views include example note data as a sound-independent reference. Print does not change progress or reveal state in the active exercise.

## 10. Frontend architecture and data contracts

### Toolchain decisions

Use the Vite React TypeScript template, strict TypeScript checking, React components and hooks, and Tailwind's Vite integration. Keep versions mutually compatible, select supported stable releases when building, and commit the lockfile. Use a supported Node LTS satisfying the chosen Vite version; record its exact major in `.nvmrc`, package engine guidance, and CI. Avoid copying an old Node requirement into a future build. Vite is a documented option for building a React app from scratch. [React setup guidance](https://react.dev/learn/build-a-react-app-from-scratch)

Tailwind setup: install `tailwindcss` and `@tailwindcss/vite`, register the plugin alongside React in Vite configuration, and import Tailwind from the main CSS file with `@import "tailwindcss";`. Use the installed major's configuration conventions; do not mix legacy initialization instructions into this setup. [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite)

Use a hash router (a maintained React routing library is appropriate), React state/context or a small store for UI preferences, and a dedicated service for persistence. Keep the music engine independent of React. A global audio service must not be recreated on every render. Exercise state can use a reducer with explicit transitions. Avoid a heavyweight state framework unless it reduces actual complexity.

Use native Web Audio for the required synthesized instrument. A notation library, test libraries, and icon package are acceptable build dependencies. Bundle runtime dependencies and assets locally; no runtime CDN is required. Do not add a server framework, hosted authentication, external analytics, or runtime AI SDK.

### Suggested project layout

```text
GUIDE.md
README.md
package.json
package-lock.json
vite.config.ts
tsconfig*.json
index.html
.nvmrc
.github/workflows/ci.yml
.github/workflows/deploy.yml
public/
  favicon.svg
src/
  main.tsx
  app/                 router, app shell, providers, error boundary
  pages/               route-level views
  components/          shared buttons, fields, dialogs, navigation
  features/
    lessons/           reader, lesson blocks, practice mode
    exercises/         runner, response controls, feedback
    piano/             keyboard and accessible note entry
    transport/         player and metronome controls
    harmony/           chord timeline and A/B comparison
    notebook/          editor, journal, arrangement controls
    progress/          session planning, review, summaries
    notation/          staff adapter and beat grid
  content/
    modules/           12 module files with complete lesson records
    studies.ts         six canonical studies and named variants
    exercises.ts       authored prompts and generator presets
    glossary.ts
    patterns.ts
  domain/
    types.ts
    pitch.ts           spelling, MIDI, intervals, degrees
    harmony.ts         chord construction and voicings
    rhythm.ts          meter, beat positions, bar validation
    generator.ts       seeded exercise generation
    assessment.ts      screen-answer comparison only
    review.ts          deterministic review scheduling
  services/
    audio/             context, synthesis, scheduler, transport
    storage/           versioning, validation, persistence, backups
  styles/
    index.css
    print.css
  tests/               focused unit/content tests
e2e/                   core browser journeys
```

The actual source code should be modular. The user's “one single file” requirement applies to this specification, not to placing the whole React application in one source file. Do not parse GUIDE.md at runtime as a substitute for authored structured content. Do not make this document the app's only lesson page.

### Canonical types

These interfaces establish the semantic contract; extend them with implementation details while keeping IDs and units stable. Store spelled pitch as well as MIDI so F# is not accidentally rendered Gb. Validate that both agree.

```ts
type LessonId = `m${string}-l${string}`;
type Readiness = 'not-yet' | 'with-help' | 'comfortable';
type InputMode = 'manual-piano' | 'screen' | 'midi';
type SkillId =
  | 'inner-hearing' | 'pitch-mapping' | 'tonal-center' | 'rhythm'
  | 'phrase-memory' | 'chord-hearing' | 'harmonization' | 'accompaniment'
  | 'coordination' | 'improvisation' | 'transposition' | 'arranging';

interface Pitch {
  midi: number;                       // integer 0..127; C4 = 60
  letter: 'A'|'B'|'C'|'D'|'E'|'F'|'G';
  accidental: -2|-1|0|1|2;
  octave: number;
}
interface KeySpec {
  tonic: Pick<Pitch, 'letter'|'accidental'>;
  mode: 'major'|'minor';               // alterations live on individual notes
}
interface Meter { numerator: number; denominator: 4|8; }
interface NoteEvent {
  id: string;
  startBeat: number;                  // quarter beats from score start
  durationBeats: number;
  pitch: Pitch | null;                // null = explicit rest
  velocity?: number;                  // normalized 0..1
  voice: 'melody'|'bass'|'chord';
}
interface ChordSymbol {
  root: Pick<Pitch, 'letter'|'accidental'>;
  quality: 'major'|'minor'|'diminished'|'dominant7'|'add9';
  bass?: Pick<Pitch, 'letter'|'accidental'>;
}
interface ChordEvent {
  startBeat: number;
  durationBeats: number;
  symbol: ChordSymbol;
  romanLabel: string;
  voicing?: Pitch[];
}
interface Score {
  id: string;
  title: string;
  key: KeySpec;
  meter: Meter;
  tempoQuarterBpm: number;
  pickupBeats?: number;               // omitted unless deliberately authored
  totalBeats: number;
  notes: NoteEvent[];
  chords: ChordEvent[];
  origin: 'guide-original'|'learner';
}
type LessonBlock =
  | {type:'prose'; heading?:string; paragraphs:string[]}
  | {type:'example'; scoreId:string; prompt:string; hideAnswer:boolean}
  | {type:'exercise'; exerciseId:string}
  | {type:'piano-task'; steps:string[]; easier:string; stretch:string}
  | {type:'reflection'; prompt:string};
interface Lesson {
  id: LessonId;
  moduleId: string;
  title: string;
  objective: string;
  prerequisites: LessonId[];
  skills: SkillId[];
  blocks: LessonBlock[];
  readinessCheck: string;
  takeaway: string;
  reviewExerciseId: string;
}
interface Attempt {
  id: string;
  exerciseId: string;
  lessonId?: LessonId;
  seed?: number;
  generatorVersion?: number;
  inputMode: InputMode;
  startedAt: string;                  // UTC ISO timestamp
  completedAt: string;
  hints: string[];
  replayCount: number;
  readiness?: Readiness;
  screenResult?: {
    correct: number;
    total: number;
    metric: 'pitch-sequence'|'choice'|'rhythm-spacing'|'beat-aligned';
  };
}
interface LessonProgress {
  lessonId: LessonId;
  status: 'not-started'|'in-progress'|'completed';
  blockIndex: number;
  readiness?: Readiness;
  completedAt?: string;
  updatedAt: string;
}
interface ReviewItem {
  id: string;
  lessonId: LessonId;
  exerciseId: string;
  stage: number;
  dueDate: string;                    // local YYYY-MM-DD calendar date
  lastReviewedAt?: string;
}
interface NotebookEntry {
  id: string;
  title: string;
  kind: 'journal'|'melody';
  text: string;
  tags: string[];
  lessonId?: LessonId;
  score?: Score;
  draft: boolean;
  arrangements: Array<{
    id: string; title: string; chords: ChordEvent[];
    patternId: string; comment: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
interface PersistedData {
  schemaVersion: number;
  contentVersion: string;
  revision: number;
  savedAt: string;
  settings: {
    labelMode: 'notes'|'degrees'|'both'|'hidden';
    defaultSessionMinutes: 5|15|30|null;
    masterVolume: number;
    reducedMotion: 'system'|'on';
    pianoTone: 'synthesized'|'recorded';
  };
  lessons: Record<string, LessonProgress>;
  reviews: ReviewItem[];
  attempts: Attempt[];
  notebook: NotebookEntry[];
  sessions: Array<{
    id:string; startedAt:string; activeSeconds:number;
    lessonIds:LessonId[]; completed:boolean;
  }>;
}
```

Add a discriminated `Exercise` union for the seven exercise modes with prompts, expected answers where applicable, hints, key/meter, and score references. Manual tasks have no machine correctness field. Store enough screen-response detail to render the immediate comparison; long-term attempt history can retain a bounded summary. Add resume state for an unfinished session, including selected budget, ordered task IDs, current task index, and accumulated active time. Do not serialize AudioNodes or transient pressed-key state.

### Music engine invariants

- Bar length is `numerator × 4 / denominator` quarter beats. Compute it once and reuse it.
- Score time is in quarter beats; audio time is in seconds. Conversion is `seconds = beats × 60 / tempoQuarterBpm`.
- Scientific pitch to frequency is `440 × 2 ** ((midi - 69) / 12)`.
- Chord membership compares pitch classes; spelled names still follow harmonic meaning.
- Melody voices do not overlap unless deliberately authored as polyphonic material, outside the required lesson melodies. Chord voices may overlap legitimately.
- Chord regions remain within score bounds and are non-overlapping. Studies' reference charts cover the entire score.
- Canonical full bars sum correctly including rests. Pickups are modeled separately, not padded into an unexplained full bar.
- Transposition moves melody, chord roots, bass, voicings, key, and displayed degrees consistently. Preserve rhythmic values. Respelling follows destination key and explicit alterations.
- Out-of-range transposition shows a useful message or offers a whole-phrase octave shift; never clamp individual notes to bounds.

## 11. Audio implementation

Initialize or resume a single AudioContext after a deliberate user gesture such as Play or Enable sound. Show a recoverable message when audio is suspended or unavailable. Include volume and Stop controls. This follows browser autoplay constraints and Web Audio guidance. [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)

The following are application design requirements, not promises of browser timing perfection:

- Use a gentle synthesized piano tone built from native Web Audio nodes, not a recorded sample library. Model the behaviours that make a piano sound like a piano: a hammer strike point that notches out every eighth partial, two unison string layers detuned by one to three cents, upper partials stretched sharp by string stiffness, a short attack of 3–10 ms, upper partials that die within 0.1–0.3 s while the fundamental continues, a two-stage decay that is always falling rather than a flat sustain, a ring time that runs from around 13 s in the bass to about 1 s at the top, and a damper release of 0.07 s in the treble to 0.34 s in the bass. Velocity sets brightness as well as level. Avoid harsh sawtooth defaults and flat sustains. Call it a synthesized piano sound; do not imply it is an acoustic piano recording.
- Offer an optional recorded-piano pack as a deliberate choice, never as a default or an automatic download. Present it on the first-visit preferences page and in Settings, stating its size before it is fetched. Sample every minor third so no note is pitch-shifted by more than a semitone, cover the whole range the course plays, serve the files from this site rather than a CDN, keep the download in Cache Storage so later visits need no network, and offer a delete. Match its loudness to the synthesized piano, and keep the whole course working when the pack is absent, when the download fails and when the browser refuses to cache it. Credit the recordings and their licence wherever the choice is offered.
- Pass every pitched voice through a shared soundboard stage — a small low-mid lift, a gentle high-shelf cut and a short generated room impulse at a low send level — so notes are not heard as bare oscillators. Generate the impulse response in code; do not ship audio assets for it. Keep the metronome out of that stage.
- Give melody, bass, upper chords, and metronome separate gains. Start at conservative master volume, with melody louder than accompaniment. Normalize chord amplitude for multiple voices and use a compressor/limiter stage to reduce clipping risk. Cap polyphony, for example at 32 voices, and release the oldest inactive/releasing voices first.
- Use the audio clock for scheduling. A short interval, around 25 ms, queues events into a roughly 100 ms lookahead window; it does not directly produce each beat. Visual highlighting follows audio time through animation frames.
- Keep handles to scheduled voices. Stop cancels scheduling, releases/disconnects voices, resets highlights, and invalidates queued callbacks using a transport generation token. This prevents old playback from resurfacing after restart.
- One shared transport owns score playback and accompaniment; metronome clicks may join the same timeline. Starting a new example stops the previous example. Virtual piano monitoring can coexist with backing playback but obeys the same master Stop.
- Pause/stop on page visibility loss in the required release and explain “Playback stopped while this tab was inactive.” No uninterrupted background playback guarantee. Release held screen keys on blur.
- Clean up timers and voices on route changes, component unmount, and development hot reload. React's development lifecycle must not create duplicate playback engines.
- Use slightly different metronome timbres or pitches for the first beat and other beats, with a quiet subdivision. Give count-in and exercise playback explicit timing so first notes do not double-trigger.
- A/B previews use the same tempo, start position, and melody gain. Ear prompts vary register only intentionally; loudness differences should not reveal chord-quality answers.

Provide an audio smoke test page in development or a small diagnostic panel in Settings: play C4, play a triad, play a four-beat count-in, stop. Users should not need developer tools to recover from suspended audio.

Web MIDI is optional because browser support is limited and access has security/permission requirements. Feature-detect it and request access only after the user selects Connect MIDI; never require it for onboarding or lessons. If implemented, handle disconnection, note-on with velocity zero as note-off, sustain, and an immediate fallback to manual practice. [MDN Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)

Microphone recognition is not part of the required release. Do not show “listening to your piano” or request microphone permission in the core app.

## 12. Progress, review, and persistence

### Review scheduling

Use a transparent small scheduler, not a claim of optimal learning science. Successful comfortable reviews progress through intervals **1, 3, 7, 14, 30 days**. On initial lesson completion, create stage 0 due tomorrow. On a comfortable review, increment stage (cap at 4) and schedule using that stage's interval. With help: keep stage and schedule tomorrow. Not yet: reset stage to 0 and schedule tomorrow, offering an easier task now. Repeated work on the same review item within one local day must not advance multiple stages.

Use local calendar dates for due status, UTC timestamps for historical events. Add calendar days rather than fixed 24-hour millisecond increments. Due reviews sort by oldest due date, then stable ID. Limit recommendations to one review for five-minute sessions, up to three for fifteen minutes, and up to five for thirty minutes; the full queue remains accessible. Never erase or punish overdue work.

Session planner order: one appropriate due review, the current lesson task, then a small creative application. Longer sessions can add more reviews and transfer. Do not force a whole lesson into a short session; save a partial location. Choose the next incomplete lesson by course order unless the learner explicitly selected another. No fabricated machine assessment enters the review scheduler for acoustic-piano tasks.

Progress displays completed lessons out of 48, recent self-reported readiness by skill, and screen exercise counts with their input mode. Avoid a combined “musicianship 87%” score. Active practice time only accumulates when the session is active and visible; pause after an idle threshold such as five minutes and on explicit pause. Explain that this is an estimate, not measured piano time.

### Continued practice after the course

Provide reusable tasks: recover one new two-bar melody; harmonize a familiar phrase two ways; play one phrase in two keys; improvise an answer to a motif; simplify a favorite piece to melody and bass; revisit a difficult transition slowly. Recommend three chosen tasks at a time. Extend to more keys, compound meter, chromatic melody notes, and secondary dominants only as later study suggestions, not unimplemented core lesson promises.

### Local storage

Use localStorage for bounded text/event data. It is origin-scoped, persists across ordinary browser sessions, and can be unavailable or cleared; wrap reads/writes and handle exceptions. Display “Saved on this browser” and a backup action, without claiming cloud sync. [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

Namespace storage by app and deployment path, for example `inner-melody:<normalized-base>:v1`, because different GitHub Pages repositories under one hostname share an origin. Store contentVersion separately from schemaVersion. Built-in content lives in bundled source; save only learner changes and references, not duplicate complete lesson content in storage.

Debounce routine saves around 500 ms and flush when a form blurs or navigation occurs. Commit completion state promptly. Retain an in-memory state on storage failures, show a persistent “Changes are not being saved” message, and keep JSON export available. Never report Saved if the write failed. Cap retained attempt summaries at 1,000 and session summaries at 365, keeping aggregate counts as needed; never silently delete notebook entries to reclaim space.

Listen for cross-tab storage events. If a newer revision arrives while the current tab has unsaved edits, pause autosaving and offer Reload saved version or Export my unsaved copy. Do not silently overwrite a notebook from another tab. If there are no local edits, load the newer valid revision and notify gently.

Validate persisted data on load. Invalid data must not crash the app or be overwritten immediately. Offer export of the raw stored value and a fresh temporary session. Schema migrations operate on a copy and preserve a recoverable previous snapshot when storage permits. Unknown lesson IDs from an older content version remain in backup data but are excluded from current completion totals.

### Backup, import, and reset

Export UTF-8 JSON containing an app identifier, export timestamp, schemaVersion, and all current learner data. Use a downloaded Blob and revoke its URL afterward. No server request.

Import only JSON, enforce a reasonable size limit such as 5 MB, validate types, ID lengths, numeric bounds, dates, score limits, and schema version. Treat imported text as text, never HTML or executable content. Reject an unsupported future schema with a clear message while preserving current data. Show a summary of lessons and notebook entries before applying the import. Required import mode is **Replace local data**, explicitly confirmed after preview; offer Export current data first. Merge can be a future enhancement, so there is no ambiguous half-merge behavior.

Reset progress and Delete all local data are separate actions with explicit descriptions and confirmation. Progress reset preserves settings and notebook; full reset clears only the app's namespaced keys, never all localStorage for the hostname. Deleted data is recoverable only from a prior export or retained backup; communicate that plainly before confirming. Normal lesson completion and notebook saves need no confirmation.

## 13. GitHub Pages build and deployment

Vite outputs the static site to `dist`. Use `base: '/music/'` only when the actual repository is named music and the site uses a project subpath; use `/` for a root site or custom domain. Hash routing handles client-side paths, while `base` handles asset URLs. Configure Pages to use GitHub Actions and deploy the build artifact. `vite preview` is for local production-build inspection. [Vite static deployment guidance](https://vite.dev/guide/static-deploy.html)

Suggested configuration, with the deployment base supplied explicitly:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.PAGES_BASE_PATH || '/',
});
```

Use imported asset URLs or `import.meta.env.BASE_URL` for public assets. Never hardcode `/assets/...` or `/audio/...` under a project deployment. Set the router independently to hash mode; do not duplicate the project path in hash route definitions. Fonts, icons, notation resources, and dynamic content chunks must respect the same base.

Required scripts, with exact tool options adjusted to the selected compatible releases:

```json
{
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc -b",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

Use an ESLint configuration appropriate to the scaffold, including hooks checks. The content integrity suite runs within `npm test`. Keep browser testing configuration explicit, including its local web server and base URL.

The following workflow illustrates a concrete deployment, using action revisions listed in the Vite deployment documentation when this guide was prepared. Recheck action compatibility at implementation time and pin reviewed revisions. `.nvmrc` and a committed npm lockfile must exist before this workflow can run. Set the branch to the repository's actual default branch if it differs from `main`.

```yaml
# .github/workflows/deploy.yml
name: Deploy Inner Melody
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
        env:
          # Define repository variable PAGES_BASE_PATH for a root/custom-domain
          # site. Otherwise use the repository name as the project subpath.
          PAGES_BASE_PATH: ${{ vars.PAGES_BASE_PATH || format('/{0}/', github.event.repository.name) }}
      - uses: actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Configure Pages
        uses: actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346
```

Add a separate `ci.yml` for pull requests that installs dependencies, lints, runs unit/content tests, builds, installs the selected browser-test runtime, and runs the core end-to-end suite. It does not deploy. Avoid giving pull-request test jobs Pages write permissions. A local build and prepared workflow are not evidence that a hosted deployment succeeded; report those states separately.

README must contain local setup, the chosen Node version, commands, base-path configuration, Pages setup, storage/backup behavior, sound limitations, and how to run tests. Include both PowerShell and POSIX examples for setting `PAGES_BASE_PATH` if shell commands are shown. Never imply that GitHub Pages stores the user's notebook remotely.

## 14. Verification and acceptance criteria

### Meaningful automated checks

Use focused unit tests for music math, generation, assessment, scheduling, and persistence. Use content validation for curriculum completeness. UI snapshot tests are not a substitute for these checks.

Required domain cases:

- C4 maps to MIDI 60; A4 to 69 and 440 Hz; F# and Gb sound alike but preserve intended spelling.
- C-major I/IV/V/vi and A-minor i/iv/V produce the expected pitches. E major in A minor includes G#.
- Transposing S01 C→G→C restores pitch/rhythm values; transposed G major includes correct F# where degree 7 appears. D→C moves S06 chords as well as notes.
- All 48 lesson IDs are unique and all prerequisites, glossary links, examples, review tasks, and study references resolve. Required lesson sections and nonempty task text exist.
- All six canonical studies have eight complete bars with correct meter totals; S06's ending variant has nine. S02's bar-7 chord change occurs exactly at quarter beat 26 from score start. S04 bars total three quarter beats.
- Authored prompts and generated prompts never leak a different answer from the one sounded. A fixed seed produces a fixed prompt; bounded generation always terminates. Test many seeds across supported presets.
- Pattern event starts/durations remain within chord/score bounds after mid-bar changes. Waltz and 4/4 patterns cannot be selected in incompatible meters without an explicit alternative.
- Pitch response comparison accounts for extra and missing notes. Octave-equivalent mode is explicit. Assisted attempts are tagged. Manual tasks cannot receive fabricated numeric correctness.
- Rhythm matching is one-to-one, excludes a no-information spacing score, and handles missing/extra taps. Count-in and latency settings are separate from target rhythm data.
- Review intervals follow the stated stages, do not advance twice in one local day, and behave across daylight-saving transitions and month/year boundaries.
- Storage round-trip preserves drafts, arrangements, and readiness. Corrupt JSON, blocked storage, full quota, newer schema imports, and cross-tab conflicts leave learner data recoverable.
- Import preview is non-mutating; cancel preserves current state; confirmation replaces only the scoped app data. Progress reset preserves notebook content.

### Core browser journeys

1. Fresh browser → Start → first lesson → deliberately enable audio → play and stop → complete a manual task → refresh → correct progress retained.
2. Course → every module and lesson route opens; search finds “minor,” “Canon,” “pedal,” and “transposition”; no placeholder lesson bodies.
3. Ear trainer → hear target with notes hidden → answer incorrectly → see useful feedback → reveal → retry → assisted status recorded correctly.
4. Study → select S04 → hear three-beat count-in → loop bars 3–4 → stop → no stale notes/highlights. Check event scheduling structurally in automation and audibly by hand.
5. Harmony Lab → choose S01 bars 5–8 → compare F–C–G–C with Am–C–G–C → save arrangement → reopen it.
6. Notebook → create incomplete melody → see bar warning → correct durations → play → save → export → import preview → cancel → confirm import in a separate test run → verify all data.
7. Simulate unavailable storage → continue lesson in memory → see unsaved status → export remains functional.
8. Build with `/music/` base → serve production output → load and refresh `/music/#/lesson/m01-l01` → assets and route work. Repeat root-base build for `/` deployment.
9. Keyboard-only navigation → operate player and exercises → type in notebook without piano shortcuts firing → close a dialog and regain focus.
10. Mobile-width screen → read a lesson, use note entry, change tempo, and reach final actions without hidden content or accidental page-wide horizontal scrolling.

Automation may verify scheduled events but cannot establish that the synthesized sound is pleasant or that physical-piano instructions are effective. Perform manual audio and content checks as well, and state any browser/hardware coverage not available.

### Manual review checklist

Audition one example from every module and every study; check notes, rhythm, count-in, chord changes, stop behavior, and volume balance. Read the complete learner-facing content for musical consistency, useful instructions, and gradual difficulty. Test actual practice with a piano if available; otherwise report that limitation.

Check current desktop Chromium, Firefox, and Safari/WebKit where available, plus one narrow touch layout. Required learning must work without MIDI. Confirm user-gesture audio startup, clean route changes while playing, and behavior after backgrounding the tab. A WebKit automation run is useful but does not prove behavior on every physical iPhone.

Review focus, contrast, text resizing, reduced motion, screen-reader labeling, text alternatives to notation, and print output. Ensure no exercise reveals its answer through hidden labels before the reveal action. Inspect the production network requests for missing assets, external font/CDN dependencies, or unexpected data transmission.

### Definition of complete

The app is complete only when:

- All 12 modules and 48 lessons contain the specified written teaching and functioning examples/tasks.
- All six studies are playable and teachable in chunks, with reference harmony, transpose, mix, and compatible patterns.
- A learner with an acoustic piano can do every required lesson and record readiness.
- The practice tools, notebook, reference, review, print, backup/import, and settings flows work.
- Progress and self-assessment are truthful, persistent when storage is available, and recoverable through export.
- Required builds and checks pass, with actual validation results documented and remaining limitations stated.
- The production build supports GitHub Pages subpaths and direct hash-route refresh.
- No required page is a stub, no “coming soon” replaces core scope, and no control pretends to perform an unimplemented action.

## 15. Implementation sequence for the building agent

1. Inspect repository instructions and preserve existing work. Read this guide in full. Record a working checklist covering content and functionality. Do not introduce a backend or change the agreed stack.
2. Scaffold Vite/React/TypeScript/Tailwind and establish hash routing, tokens, responsive shell, and basic accessibility. Configure the lockfile, type checking, and tests.
3. Implement music domain types and validators. Enter the six study datasets and authored prompts. Validate timing and spelling before using them as sound/notation sources.
4. Build the audio service, virtual piano, transport, and metronome. Complete a working first-lesson path including manual self-report, persistence, and refresh recovery.
5. Implement the reusable lesson renderer and exercise types. Author all 48 lessons from the specified briefs and model. Content is a major deliverable, not filler to add after UI work.
6. Build study pages, pattern playback, transposition, and Harmony Lab. Reuse the same score and chord data across sound, notation, and displays.
7. Complete notebook editing, arrangements, review planning, progress, reference, export/import, and print. Exercise storage-failure and malformed-data paths.
8. Complete visual refinement and responsive/accessibility checks. Remove development-only controls from the production learner flow.
9. Run domain/content tests and core browser journeys, inspect the production subpath build, and prepare README/workflows. Fix failures within scope before declaring completion.
10. Report what was built, what was tested, and any real limitations. Distinguish prepared deployment configuration from an actually published site. Do not replace missing core scope with future-work promises.

Routine decisions about component names, spacing, or internal library adapters do not need a new user questionnaire. This file supplies defaults. Ask only when a decision would materially change the user's goal or requires unavailable information that cannot be reasonably inferred.

## 16. Scope boundaries and future extensions

This is comprehensive within the target: beginning ear playing through simple melodic improvisation and accompaniment. It is not an encyclopedia of all music, a replacement for instrument technique instruction, or a promise to play arbitrary complex music instantly.

Transfer to other instruments is explicit: hear the tonal center, sing the phrase, map its degrees to the new instrument, preserve rhythm, and practise its physical fingering separately. On a monophonic instrument, play the melody over the app's chord backing; do not imply it can produce piano-style simultaneous accompaniment. Transposing instruments require the player to account for written versus sounding pitch; a dedicated transposing-instrument mode is a future extension, while the required app displays concert pitch.

Keep these outside the required release: automatic song recognition, copyrighted song catalogs, microphone-based polyphonic transcription, social feeds, leaderboards, paid accounts, teacher dashboards, cloud sync, generated AI feedback, exhaustive jazz harmony, instrument-specific fingering engines, and guaranteed offline installation. The required site uses only bundled content and local synthesis during normal practice, but a cold offline reload is not promised without an explicitly implemented service worker.

If extending later, preserve the written course and acoustic-piano workflow. Optional technology should help the learner hear and make music; it must not become a new prerequisite for the course.
