# The Life of a Tomato

A small static site that follows one tomato week by week: a photo, a drawing in a new style, and scores for firmness, smell, freshness, color, and skin.

Everything fits on one screen, with no scrolling:

- **Wind back time**: the Time Stone dial. Wind the ring, grab the tomato and turn it, press play, or use ← →, and the weekly photos crossfade forward and backward in time.
- **The path**: every week stands on a road from the first week to the last at the horizon. Winding the dial travels down the road: the camera zooms in so the current week always sits in the same spot, the weeks ahead come toward you, and passed weeks fade away. Click a week to jump to it.
- **This week's card**: rides beside the current week on the path, with the drawing style, the notes, and the five scores.
- **Reports**: the third tab swaps the path for one chart per score plus their average. The week the dial is on is marked, and clicking a chart jumps to that week.

No build step and no dependencies. Open `index.html` in a browser.

## Adding a week

1. Save the photo as `images/photos/week-07.jpg` and the drawing as `images/drawings/week-07.jpg`.
   Square, well-lit photos from the **same angle and distance every week** make the time scrubber look best (use a tape mark for the tomato and the phone).
2. Add an entry to `weeks` in `data.js`:

```js
{
  week: 7, date: "2026-11-02",
  photo: "images/photos/week-07.jpg",
  drawing: "images/drawings/week-07.jpg",
  style: "Cubism",
  scores: { firmness: 1, smell: 1, freshness: 1, color: 1, skin: 1 },
  notes: "…",
},
```

When `photo` or `drawing` is `null`, the site draws a placeholder tomato.

Drawing style ideas: graphite, watercolor, ink crosshatch, pixel art, charcoal, pointillism, cubism, blind contour, colored pencil, digital/vector, comic panel, one continuous line.

## Hosting (GitHub Pages)

```sh
gh repo create tomatodocs --public --source . --push
gh api -X POST repos/{owner}/tomatodocs/pages -f "source[branch]=main" -f "source[path]=/"
```

The site will be at `https://<username>.github.io/tomatodocs/` within a minute or two. After that, every push to `main` redeploys it.
