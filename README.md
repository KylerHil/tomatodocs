# The Life of a Tomato

A small static site that follows one tomato week by week, drawn each week in a new technique. Each week has the drawing, what I thought of the technique, a reference photo, and scores for how the tomato is holding up (firmness, smell, freshness, color, skin).

Everything fits on one screen, with no scrolling:

- **Wind back time**: the Time Stone dial. Wind the ring, grab the tomato and turn it, press play, or use ← →, and the weeks crossfade forward and backward in time. A line across the dial wipes between the drawing (left) and the photo (right); leave it in the middle for half of each.
- **The path**: every week stands on a road from the first week to the last at the horizon. Winding the dial travels down the road: the camera zooms in so the current week always sits in the same spot, the weeks ahead come toward you, and passed weeks fade away. Click a week to jump to it.
- **This week's card**: rides beside the current week on the path, with the technique, whether I liked it, notes for whichever of drawing or photo fills more of the dial, and the five scores.
- **Reports**: the third tab swaps the path for one chart per score plus their average. The week the dial is on is marked, and clicking a chart jumps to that week.
- **Notes**: how each score is taken (a quick squeeze, a sniff up close, a look), and the one rule behind all of them: the tomato is never moved. The text lives in `method` and each metric's `method` in `data.js`.

No build step and no dependencies. Open `index.html` in a browser.

## Adding a week

1. Save the photo as `images/photos/week-07.jpg` and the drawing as `images/drawings/week-07.jpg`.
   Square, well-lit photos from the **same angle and distance every week** make the time scrubber look best (use a tape mark for the tomato and the phone).
2. Add an entry to `weeks` in `data.js`:

```js
{
  week: 7, date: "2026-10-28",
  photo: "images/photos/week-07.jpg",
  drawing: "images/drawings/week-07.jpg",
  technique: "Cubism",
  liked: true,           // did the technique feel good to use?
  thoughts: "…",           // about the drawing
  photoNotes: "…",         // about the photo
  scores: { firmness: 1, smell: 1, freshness: 1, color: 1, skin: 1 },
},
```

When `photo` or `drawing` is `null`, the site draws a placeholder tomato.

Technique ideas: graphite, watercolor, ink crosshatch, pixel art, charcoal, pointillism, cubism, blind contour, colored pencil, digital/vector, comic panel, one continuous line.

## Hosting (GitHub Pages)

```sh
gh repo create tomatodocs --public --source . --push
gh api -X POST repos/{owner}/tomatodocs/pages -f "source[branch]=main" -f "source[path]=/"
```

The site will be at `https://<username>.github.io/tomatodocs/` within a minute or two. After that, every push to `main` redeploys it.
