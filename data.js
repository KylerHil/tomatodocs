// ─────────────────────────────────────────────────────────────
//  Tomato log — the only file you edit each week.
//
//  To add a week:
//    1. Put the photo in images/photos/ and the drawing in images/drawings/
//    2. Copy a week entry below, bump the number, fill in the paths/scores
//       technique: the drawing technique tried that week
//       liked:     true / false, how the technique felt to use
//       thoughts:  a line or two on the technique (shown while the drawing fills most of the dial)
//       photoNotes: anything about the photo itself (shown while the photo does)
//  Scores are 1–10 (10 = best / most like a fresh tomato).
//  Leave photo or drawing as null and a placeholder is drawn instead.
// ─────────────────────────────────────────────────────────────

window.TOMATO = {
  title: "The Life of a Tomato",
  subtitle: "One tomato, drawn once a week in a new technique: what worked, what didn't, and how the tomato held up.",

  // How each score is taken. Shown on the Notes tab.
  method: {
    rule: "Leave it where it sits",
    intro: "It stays in the same spot on its fridge shelf the whole time, and every check happens in place: no picking it up, rolling it, or turning it to its good side. Handling would bruise it and speed up the rot, and keeping it still keeps every photo and drawing on the same side.",
    order: "Each week: look first (color, skin), then smell, then one squeeze, then the gut call on freshness.",
    exception: "Week 2 is the one exception: a jar knocked it by accident, so it sits at a new angle from then on.",
  },

  metrics: [
    { key: "firmness",  label: "Firmness",  hint: "How it holds up to a gentle squeeze",
      method: "One quick, gentle squeeze between thumb and finger, right where it sits. Enough to feel it give, never enough to mark it." },
    { key: "smell",     label: "Smell",     hint: "10 = fresh vine, 1 = leave the room",
      method: "I lean into the fridge and smell it up close, without lifting it off the shelf." },
    { key: "freshness", label: "Freshness", hint: "Overall would-you-eat-it",
      method: "A gut call, made last: how it looks, smells, and felt in the squeeze. Would I still eat it?" },
    { key: "color",     label: "Color",     hint: "Vibrancy and evenness of the red",
      method: "By eye only: how deep and even the red is, from where it sits, without turning it to find its best side." },
    { key: "skin",      label: "Skin",      hint: "Smooth and taut vs. wrinkled or split",
      method: "By eye only: how healthy the skin looks. Smooth, taut, and glossy, or starting to wrinkle, dull, split, or spot." },
  ],

  weeks: [
    {
      week: 1, date: "2026-09-16",
      photo: "images/photos/week-01.jpg",
      drawing: "images/drawings/week-01.jpg",
      technique: "Graphite observational still life sketch",
      liked: true,
      thoughts: "Fun to draw.",
      photoNotes: "First week, the starting photo.",
      scores: { firmness: 10, smell: 10, freshness: 10, color: 10, skin: 10 },
    },
    {
      week: 2, date: "2026-09-23",
      photo: "images/photos/week-02.jpg",
      drawing: "images/drawings/week-02.jpg",
      technique: "Cross-hatched graphite",
      liked: false,
      thoughts: "Very hard to use.",
      photoNotes: "My wife moved the tomato by accident with a jar, so this photo is from a different angle.",
      scores: { firmness: 9.5, smell: 10, freshness: 9.5, color: 10, skin: 10 },
    },
  ],
};
