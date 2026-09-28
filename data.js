// ─────────────────────────────────────────────────────────────
//  Tomato log — the only file you edit each week.
//
//  To add a week:
//    1. Put the photo in images/photos/ and the drawing in images/drawings/
//    2. Copy a week entry below, bump the number, fill in the paths/scores
//  Scores are 1–10 (10 = best / most like a fresh tomato).
//  Leave photo or drawing as null and a placeholder is drawn instead.
// ─────────────────────────────────────────────────────────────

window.TOMATO = {
  title: "The Life of a Tomato",
  subtitle: "One tomato, photographed, drawn, and judged once a week until there's nothing left to judge.",

  metrics: [
    { key: "firmness",  label: "Firmness",  hint: "How it holds up to a gentle squeeze" },
    { key: "smell",     label: "Smell",     hint: "10 = fresh vine, 1 = leave the room" },
    { key: "freshness", label: "Freshness", hint: "Overall would-you-eat-it" },
    { key: "color",     label: "Color",     hint: "Vibrancy and evenness of the red" },
    { key: "skin",      label: "Skin",      hint: "Smooth and taut vs. wrinkled or split" },
  ],

  weeks: [
    {
      week: 1, date: "2026-09-21",
      photo: null, drawing: null,
      style: "Graphite pencil",
      scores: { firmness: 10, smell: 9, freshness: 10, color: 10, skin: 10 },
      notes: "Day one. Glossy, firm, smells like a garden.",
    },
    {
      week: 2, date: "2026-09-28",
      photo: null, drawing: null,
      style: "Watercolor",
      scores: { firmness: 8, smell: 8, freshness: 8, color: 9, skin: 9 },
      notes: "Slight give when pressed. Colour deepening.",
    },
    {
      week: 3, date: "2026-10-05",
      photo: null, drawing: null,
      style: "Ink & crosshatch",
      scores: { firmness: 6, smell: 7, freshness: 6, color: 7, skin: 6 },
      notes: "First wrinkles near the stem.",
    },
    {
      week: 4, date: "2026-10-12",
      photo: null, drawing: null,
      style: "Pixel art",
      scores: { firmness: 4, smell: 5, freshness: 4, color: 5, skin: 4 },
      notes: "Soft spot on the bottom. Sweet, slightly sour smell.",
    },
    {
      week: 5, date: "2026-10-19",
      photo: null, drawing: null,
      style: "Charcoal",
      scores: { firmness: 3, smell: 3, freshness: 2, color: 4, skin: 3 },
      notes: "Mold spotted. Skin sagging.",
    },
    {
      week: 6, date: "2026-10-26",
      photo: null, drawing: null,
      style: "Pointillism",
      scores: { firmness: 1, smell: 1, freshness: 1, color: 2, skin: 1 },
      notes: "Collapsed. A science experiment now.",
    },
  ],
};
