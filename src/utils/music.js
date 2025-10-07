function playSong(audioCtx)
{
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(0, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);

    const musicNoteNerveLength = buildNerveLengthLUT();

    const nerveLengthToNote = {
        'A0': 'proslambanomenos',
        'B0': 'hypathe hypaton',
        'C0': 'parhypate hypaton diatonos',
        'D0': 'lichanos hypaton diatonos',
        'E0': 'hypathe meson',
        'F0': 'parhypate meson diatonos',
        'G0': 'lichanos meson diatonos',
        'A1': 'mese',
        'A2': 'nete hyperboleon',
    };


    const phrase0 = [
        ['R', 0, 2],
        ['R', 0, 4],
        ['R', 0, 8],
        ['F', 1, 8],
    ];
    const phrase1 = [
        ['E', 1, 4],
        ['R', 0, 8],
        ['E', 1, 8],
        ['F', 1, 4],
        ['R', 0, 8],
        ['F', 1, 8],
    ];
    const phrase2 = [
        ['E', 1, 4],
        ['R', 0, 8],
        ['E', 1, 8],
        ['D', 1, 4],
        ['R', 0, 8],
        ['F', 1, 8],
    ];
    const musicNotes = [
        phrase0,
        phrase1,
        phrase1,
        phrase1,
        phrase2,
    ];
    // const musicNotes = [
    //     ['A', 2, 1],
    //     ['G', 1, 1],
    //     ['F', 1, 1],
    //     ['E', 1, 1],
    //     ['D', 1, 1],
    //     ['C', 1, 1],
    //     ['B', 1, 1],
    //     ['A', 1, 1],
    // ];

    
    playNote(audioCtx, oscillator, musicNotes.flat(), 0, nerveLengthToNote, musicNoteNerveLength);

    oscillator.start();
}

function playNote(audioCtx, oscillator, phrase, cursor, nerveLengthToNote, musicNoteNerveLength)
{
    const note = phrase[cursor];

    const pitch = note[0];
    const octave = note[1];
    const duration = note[2];

    let frequency = 0;
    
    if (pitch !== 'R')
    {
        const key = pitch + (octave - 1).toString();
        frequency = 110 * (octave) / musicNoteNerveLength[nerveLengthToNote[key]];
    }

    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    let nextCursor = cursor + 1;
    if (nextCursor === phrase.length)
    {
        nextCursor = 0;
    }

    const bpm = 130;
    const spb = 60 / bpm;
    const beat = 4;
    const durationMillis = (beat / duration) * spb * 1000;

    setTimeout(() => playNote(audioCtx, oscillator, phrase, nextCursor, nerveLengthToNote, musicNoteNerveLength), durationMillis);
}

function buildNerveLengthLUT()
{
    const A = 1;

    const O = A * (1 / 2);
    const LL = O * (1 / 2);

    const H = O * (4 / 3);
    const B = H * (4 / 3);

    const M = O * (9 / 8);
    const E = H * (9 / 8);
    const C = E * (9 / 8);
    const I = M * (9 / 8);

    return {
        'proslambanomenos': A,

        'hypathe hypaton': B,

        'parhypate hypaton diatonos': C,
        'lichanos hypaton diatonos': E,

        'hypathe meson': H,

        'parhypate meson diatonos': I,
        'lichanos meson diatonos': M,

        'mese': O,

        'nete hyperboleon': LL,
    };
}
