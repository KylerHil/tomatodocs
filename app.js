(() => {
  const D = window.TOMATO;
  const weeks = D.weeks.slice().sort((a, b) => a.week - b.week);
  const N = weeks.length;
  const $ = (s) => document.querySelector(s);
  const NS = "http://www.w3.org/2000/svg";

  const fmtDate = (iso, opts = { month: "short", day: "numeric" }) =>
    new Date(iso + "T12:00:00").toLocaleDateString(undefined, opts);

  // ── Placeholder tomato (used until real images are added) ──────────────
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (c1, c2, t) => {
    const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const [a, b] = [p(c1), p(c2)];
    return "#" + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, "0")).join("");
  };
  function placeholder(i, kind) {
    const t = N > 1 ? i / (N - 1) : 0;
    const body = t < 0.5 ? mix("#e2321c", "#b8431f", t * 2) : mix("#b8431f", "#6e4a2a", (t - 0.5) * 2);
    const hi = mix("#ff8a6a", "#9c7a55", t);
    const leaf = mix("#3f8f3a", "#6b5a2c", t);
    const rx = lerp(62, 56, t), ry = lerp(56, 40, t), cy = lerp(108, 122, t);
    const wrinkles = t > 0.2
      ? [...Array(5)].map((_, k) => {
          const x = 70 + k * 15, o = lerp(0, 0.45, (t - 0.2) / 0.8);
          return `<path d="M${x} ${cy - ry + 14} q6 ${ry * 0.6} -2 ${ry * 1.3}" stroke="#3a1a0e" stroke-opacity="${o}" stroke-width="1.5" fill="none"/>`;
        }).join("")
      : "";
    const spots = t > 0.55
      ? [[82, 128, 7], [118, 112, 5], [100, 140, 9], [132, 132, 4], [70, 112, 4]]
          .slice(0, Math.ceil((t - 0.55) / 0.45 * 5))
          .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r * lerp(0.6, 1.4, t)}" fill="#dfe6cf" opacity=".85"/><circle cx="${x}" cy="${y}" r="${r * 0.5}" fill="#9fb07f" opacity=".7"/>`)
          .join("")
      : "";
    let svg;
    if (kind === "photo") {
      svg = `<svg xmlns="${NS}" viewBox="0 0 200 200">
        <defs><radialGradient id="g" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="${hi}"/><stop offset=".55" stop-color="${body}"/><stop offset="1" stop-color="${mix(body, "#1a0a05", 0.45)}"/></radialGradient></defs>
        <rect width="200" height="200" fill="#efe6da"/>
        <ellipse cx="100" cy="${cy + ry + 6}" rx="${rx * 0.9}" ry="8" fill="#000" opacity=".12"/>
        <ellipse cx="100" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#g)"/>
        ${wrinkles}${spots}
        <ellipse cx="${100 - rx * 0.35}" cy="${cy - ry * 0.45}" rx="12" ry="7" fill="#fff" opacity="${lerp(0.45, 0.05, t)}" transform="rotate(-25 ${100 - rx * 0.35} ${cy - ry * 0.45})"/>
        <path d="M100 ${cy - ry + 4} l-18 -6 l14 -2 l-8 -12 l12 8 l6 -12 l4 12 l12 -8 l-6 12 l14 2 z" fill="${leaf}"/>
      </svg>`;
    } else {
      const ink = "#2b2522";
      svg = `<svg xmlns="${NS}" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#fbf7ef"/>
        <ellipse cx="100" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${ink}" stroke-width="2"/>
        <ellipse cx="101" cy="${cy + 1}" rx="${rx - 2}" ry="${ry - 1}" fill="none" stroke="${ink}" stroke-width=".8" opacity=".5"/>
        ${wrinkles.replaceAll("#3a1a0e", ink)}
        ${spots.replace(/fill="#[0-9a-f]+"/g, `fill="none" stroke="${ink}"`)}
        <path d="M100 ${cy - ry + 4} l-18 -6 l14 -2 l-8 -12 l12 8 l6 -12 l4 12 l12 -8 l-6 12 l14 2 z" fill="none" stroke="${ink}" stroke-width="1.5"/>
        <text x="100" y="188" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="${ink}" opacity=".6">${esc(weeks[i].technique || "sketch")} (placeholder)</text>
      </svg>`;
    }
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const src = (i, kind) => weeks[i][kind] || placeholder(i, kind);

  // ── Header ─────────────────────────────────────────────────────────────
  $("#title").textContent = D.title;
  $("#subtitle").textContent = D.subtitle;
  $("#range").textContent = N
    ? `${N} week${N > 1 ? "s" : ""} · ${fmtDate(weeks[0].date)} – ${fmtDate(weeks[N - 1].date, { month: "short", day: "numeric", year: "numeric" })}`
    : "No weeks logged yet";
  if (!N) return;

  // ── State ──────────────────────────────────────────────────────────────
  // Divider position across the dial: 0 = all photo, 1 = all drawing.
  // Drawing sits on the left of the line, photo on the right.
  let split = 0.5;
  const leading = () => (split >= 0.5 ? "drawing" : "photo");
  let v = 0;          // continuous time position, 0 … N-1
  let sel = 0;        // selected week index
  const listeners = [];
  const onSelect = (fn) => listeners.push(fn);
  function select(i) {
    sel = Math.max(0, Math.min(N - 1, i));
    listeners.forEach((fn) => fn(sel));
  }

  // ── Scrubber ───────────────────────────────────────────────────────────
  const stage = $("#stage"), frames = $("#frames"), wrap = $(".stage-wrap"), ring = $("#ring");

  // The ring is the time dial: 12 o'clock is week 1, going clockwise, with a
  // small gap at the top so the first and last weeks don't touch.
  const GAP = 24, START = GAP / 2, SWEEP = 360 - GAP, R = 93;
  const polar = (deg, r) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [100 + Math.cos(a) * r, 100 + Math.sin(a) * r];
  };
  const weekAngle = (i) => START + (N > 1 ? i / (N - 1) : 0) * SWEEP;

  // Mandala: layers counter-rotate as time moves (and drift slowly on their own).
  const ticks = [...Array(120)].map((_, k) => {
    const long = k % 10 === 0;
    const [x1, y1] = polar(k * 3, long ? 83 : 85.5), [x2, y2] = polar(k * 3, 88);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${long ? 1 : 0.5}"/>`;
  }).join("");
  const square = (rot) => [0, 90, 180, 270].map((a) => polar(a + rot, 119).join(",")).join(" ");
  const RUNES = "ᚠᚢᚦᚨᚱᚲᚷᚹ·ᚺᚾᛁᛃᛇᛈᛉᛊ·ᛏᛒᛖᛗᛚᛜᛞᛟ·";
  ring.innerHTML = `
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.6" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <path id="rune-path" d="M100,-5 a105,105 0 1,1 -0.01,0"/>
    </defs>
    <g class="deco" filter="url(#glow)">
      <g class="spin rev"><g class="l-outer">
        <polygon points="${square(0)}"/><polygon points="${square(45)}"/>
        <circle cx="100" cy="100" r="112"/><circle cx="100" cy="100" r="118" stroke-dasharray="1 3"/>
      </g></g>
      <g class="spin"><g class="l-runes">
        <circle cx="100" cy="100" r="99"/>
        <text><textPath href="#rune-path" textLength="655" lengthAdjust="spacing">${RUNES.repeat(3)}</textPath></text>
      </g></g>
      <g class="l-ticks">${ticks}<circle cx="100" cy="100" r="81" stroke-dasharray="1 4"/></g>
    </g>`;
  const layers = ["outer", "runes", "ticks"].map((n) => ring.querySelector(".l-" + n));

  // Dial: track, progress arc, week markers, handle. pathLength=360 → dash units are degrees.
  const arc = (cls) => `<circle class="${cls}" cx="100" cy="100" r="${R}" pathLength="360" transform="rotate(${START - 90} 100 100)"/>`;
  ring.insertAdjacentHTML("beforeend",
    `<g class="dial">${arc("track")}${arc("progress")}
     <g class="marks">${weeks.map((_, i) => { const [cx, cy] = polar(weekAngle(i), R); return `<circle cx="${cx}" cy="${cy}" r="2.2"/>`; }).join("")}</g>
     <circle class="handle" r="5.5"/></g>`);
  ring.querySelector(".track").setAttribute("stroke-dasharray", `${SWEEP} 360`);
  const progress = ring.querySelector(".progress"), handle = ring.querySelector(".handle");
  const marks = [...ring.querySelectorAll(".marks circle")];

  // Sparks thrown off the handle while time is being wound.
  const canvas = $("#sparks"), ctx = canvas.getContext("2d");
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const parts = [];
  let sparkLoop = 0, lastV = 0;
  const fitCanvas = () => {
    const d = devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * d; canvas.height = canvas.clientHeight * d;
  };
  addEventListener("resize", fitCanvas);
  function emit(deg, amount) {
    if (calm) return;
    const [hx, hy] = polar(deg, R);
    const dir = amount > 0 ? 1 : -1;
    for (let k = 0; k < Math.min(14, Math.abs(amount) * 60 + 1); k++) {
      const tangent = ((deg - 90 + (dir > 0 ? -90 : 90)) * Math.PI) / 180 + (Math.random() - 0.5) * 1.4;
      const sp = 0.4 + Math.random() * 1.6;
      parts.push({ x: hx, y: hy, vx: Math.cos(tangent) * sp, vy: Math.sin(tangent) * sp, life: 1, hot: Math.random() < 0.35 });
    }
    if (!sparkLoop) sparkLoop = requestAnimationFrame(drawSparks);
  }
  function drawSparks() {
    const s = canvas.width / 240; // canvas spans viewBox -20…220
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const glow = getComputedStyle(ring).color;
    for (let k = parts.length - 1; k >= 0; k--) {
      const p = parts[k];
      p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96; p.life -= 0.025;
      if (p.life <= 0) { parts.splice(k, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.hot ? "#ffe680" : glow;  // hot sparks burn gold
      ctx.beginPath();
      ctx.arc((p.x + 20) * s, (p.y + 20) * s, (p.hot ? 0.9 : 1.3) * p.life * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    sparkLoop = parts.length ? requestAnimationFrame(drawSparks) : 0;
  }

  // One frame per week, each holding the drawing with the photo laid over it.
  // The photo is clipped to the right of the divider (see --split in styles.css).
  function buildFrames() {
    frames.innerHTML = weeks.map((w, i) => `
      <div class="frame">
        <img class="drawing" src="${src(i, "drawing")}" alt="Week ${w.week} drawing" draggable="false">
        <img class="photo" src="${src(i, "photo")}" alt="Week ${w.week} photo" draggable="false">
      </div>`).join("");
  }

  function render() {
    const lo = Math.floor(v), frac = v - lo;
    [...frames.children].forEach((f, i) => {
      f.style.opacity = i === lo ? 1 : i === lo + 1 ? frac : 0;
    });
    [15, -35, 60].forEach((speed, k) => layers[k].setAttribute("transform", `rotate(${v * speed} 100 100)`));
    const deg = N > 1 ? (v / (N - 1)) * SWEEP : 0;
    progress.setAttribute("stroke-dasharray", `${deg} 360`);
    const [hx, hy] = polar(START + deg, R);
    handle.setAttribute("cx", hx); handle.setAttribute("cy", hy);
    if (wrap.classList.contains("scrubbing") && v !== lastV) emit(START + deg, v - lastV);
    lastV = v;
    paintBoard();
    marks.forEach((m, k) => m.classList.toggle("past", k <= v + 1e-6));
    const i = Math.round(v);
    wrap.setAttribute("aria-valuenow", weeks[i].week);
    wrap.setAttribute("aria-valuetext", `Week ${weeks[i].week}, ${fmtDate(weeks[i].date)}`);
    $("#scrub-week").textContent = `Week ${weeks[i].week}`;
    $("#scrub-date").textContent = fmtDate(weeks[i].date, { weekday: "short", month: "short", day: "numeric" });
  }
  const setV = (x) => { v = Math.max(0, Math.min(N - 1, x)); render(); };

  // Smoothly animate v to a target.
  let anim = 0;
  function tweenTo(target, ms = 1350, done) {
    cancelAnimationFrame(anim);
    const from = v, t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3);
      setV(from + (target - from) * e);
      if (p < 1) anim = requestAnimationFrame(step); else done && done();
    };
    anim = requestAnimationFrame(step);
  }
  const settle = () => { const i = Math.round(v); tweenTo(i, 250); if (i !== sel) select(i); };

  // Pointer → clockwise degrees from 12 o'clock, plus distance from center (0–1).
  const pointerAngle = (e) => {
    const r = wrap.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    return { deg: ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360, dist: Math.hypot(dx, dy) / (r.width / 2) };
  };
  const vAtAngle = (deg) => {
    if (deg < START) return 0;               // in the top gap, just past 12 o'clock
    if (deg > START + SWEEP) return N - 1;   // in the top gap, just before 12 o'clock
    return ((deg - START) / SWEEP) * (N - 1);
  };

  // Press on the ring to jump there; press anywhere and move in a circle to wind time.
  // Movement is accumulated relative to the last angle, so spinning past either end
  // just stops there instead of jumping to the other side.
  let drag = null;
  wrap.addEventListener("pointerdown", (e) => {
    stopPlay(); cancelAnimationFrame(anim);
    const { deg, dist } = pointerAngle(e);
    if (dist > 1.02) return;
    if (dist > 0.8) setV(vAtAngle(deg));
    drag = { last: deg };
    wrap.setPointerCapture(e.pointerId);
    wrap.classList.add("scrubbing");
    e.preventDefault();
  });
  wrap.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const { deg } = pointerAngle(e);
    const delta = ((deg - drag.last + 540) % 360) - 180;
    drag.last = deg;
    setV(v + (delta / SWEEP) * (N - 1));
  });
  const endDrag = () => { if (!drag) return; drag = null; wrap.classList.remove("scrubbing"); settle(); };
  wrap.addEventListener("pointerup", endDrag);
  wrap.addEventListener("pointercancel", endDrag);

  wrap.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (step) { e.preventDefault(); select(sel + step); }
    if (e.key === "Home") { e.preventDefault(); select(0); }
    if (e.key === "End") { e.preventDefault(); select(N - 1); }
  });
  wrap.setAttribute("aria-valuemin", weeks[0].week);
  wrap.setAttribute("aria-valuemax", weeks[N - 1].week);

  // Play forward through time (restarts from week 1 if at the end).
  const playBtn = $("#play");
  let playing = false;
  function stopPlay() { if (!playing) return; playing = false; cancelAnimationFrame(anim); playBtn.textContent = "▶"; playBtn.ariaLabel = "Play"; wrap.classList.remove("scrubbing"); }
  playBtn.addEventListener("click", () => {
    if (playing) { stopPlay(); settle(); return; }
    if (v >= N - 1) setV(0);
    playing = true; playBtn.textContent = "❚❚"; playBtn.ariaLabel = "Pause";
    wrap.classList.add("scrubbing");
    tweenTo(N - 1, (N - 1 - v) * 2700, () => { stopPlay(); select(N - 1); });
  });

  // Tabs: Timeline shows the path; Reports and Notes swap it for the score
  // charts or the scoring method. The dial stays as it was.
  let view = "path";
  const tabs = [...document.querySelectorAll(".seg button")];
  tabs.forEach((b) =>
    b.addEventListener("click", () => {
      view = b.dataset.view;
      tabs.forEach((o) => o.setAttribute("aria-pressed", o === b));
      // toggleAttribute, because the board is an <svg> and SVG elements ignore .hidden
      board.toggleAttribute("hidden", view !== "path");
      detail.hidden = view !== "path";
      charts.hidden = view !== "reports";
      method.hidden = view !== "notes";
      placeCard();
    })
  );

  onSelect((i) => { if (!drag && !playing && Math.abs(v - i) > 0.01) tweenTo(i); });

  // Drawing ↔ photo divider. It handles its own pointer and keys so dragging it
  // wipes between the two instead of winding time.
  const splitEl = $("#split"), tags = [$("#tag-drawing"), $("#tag-photo")];
  function setSplit(p) {
    const was = leading();
    split = Math.max(0, Math.min(1, p));
    stage.style.setProperty("--split", split);
    splitEl.setAttribute("aria-valuenow", Math.round(split * 100));
    splitEl.setAttribute("aria-valuetext", `${Math.round(split * 100)}% drawing, ${Math.round((1 - split) * 100)}% photo`);
    tags[0].style.opacity = split > 0.4 ? 1 : 0;  // hide a tag before the line reaches it
    tags[1].style.opacity = split < 0.6 ? 1 : 0;
    paintSplit();
    if (leading() !== was && shown >= 0) { renderDetail(shown); placeCard(); }
  }
  let splitting = false;
  const splitAt = (e) => { const r = stage.getBoundingClientRect(); return (e.clientX - r.left) / r.width; };
  splitEl.addEventListener("pointerdown", (e) => {
    e.stopPropagation(); e.preventDefault();
    splitting = true; splitEl.setPointerCapture(e.pointerId); splitEl.classList.add("dragging");
  });
  splitEl.addEventListener("pointermove", (e) => { if (splitting) setSplit(splitAt(e)); });
  const endSplit = () => { splitting = false; splitEl.classList.remove("dragging"); };
  splitEl.addEventListener("pointerup", endSplit);
  splitEl.addEventListener("pointercancel", endSplit);
  splitEl.addEventListener("keydown", (e) => {
    const step = { ArrowLeft: -0.05, ArrowDown: -0.05, ArrowRight: 0.05, ArrowUp: 0.05 }[e.key];
    const to = { Home: 0, End: 1 }[e.key];
    if (step == null && to == null) return;
    e.preventDefault(); e.stopPropagation();
    setSplit(to ?? split + step);
  });

  // ── Path board: the weeks on a road that runs back to the horizon ────────
  // Week 1 stands up front, the last week at the far end. The board is a camera:
  // as the dial winds, it travels down the road, zooming so the current point on
  // the path always sits on the same spot (SPOT) at the same size. Weeks fade
  // out as they pass the camera, and the week card rides beside that spot.
  const board = $("#board"), detail = $("#detail");
  const BW = 600, BH = 560, VX = 250, VY = 36, NEAR = 520;
  const proj = (x, z) => { const s = 1 / (1 + 2.5 * z); return [VX + x * 270 * s, VY + (NEAR - VY) * s, s]; };
  const pathX = (u) => -0.5 * Math.sin(u * 2.3 * Math.PI + 0.5);
  const at = (u) => proj(pathX(u), u);
  const uOf = (x) => (N > 1 ? x / (N - 1) : 0);
  const pts = (list) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const SAMPLES = [...Array(81)].map((_, k) => k / 80);
  const line = ([x1, y1], [x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;

  const grid = [-1.6, -1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2, 1.6].map((x) => line(proj(x, -0.3), proj(x, 3)))
    .concat([...Array(25)].map((_, k) => k * 0.1 - 0.3).map((z) => line(proj(-2, z), proj(2, z)))).join("");
  const road = pts(SAMPLES.map((u) => proj(pathX(u) - 0.12, u)).concat(SAMPLES.slice().reverse().map((u) => proj(pathX(u) + 0.12, u))));
  const [sx, sy] = at(0);
  const nodePos = weeks.map((_, i) => { const [x, y, s] = at(uOf(i)); const r = 56 * s; return { x, y, s, r, cy: y - r * 1.05 }; });

  board.innerHTML = `
    <defs>
      <clipPath id="node-clip" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath>
      <radialGradient id="grid-fade-g" cx=".45" cy=".7" r=".6"><stop offset=".4" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
      <mask id="grid-fade" maskUnits="userSpaceOnUse" x="0" y="0" width="${BW}" height="${BH}"><rect id="grid-fade-r" width="${BW}" height="${BH}" fill="url(#grid-fade-g)"/></mask>
      <linearGradient id="horizon" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color:var(--bg)"/><stop offset="1" style="stop-color:var(--bg);stop-opacity:0"/>
      </linearGradient>
    </defs>
    <g class="b-grid" mask="url(#grid-fade)">${grid}</g>
    <rect x="0" y="0" width="${BW}" height="${VY + 150}" fill="url(#horizon)"/>
    <polygon class="b-road" points="${road}"/>
    <polyline class="b-center" points="${pts(SAMPLES.map(at))}"/>
    <polyline class="b-trail" id="trail"/>
    <text class="b-end" id="start-label" x="${sx + 46}" y="${sy + 16}">START · ${fmtDate(weeks[0].date).toUpperCase()}</text>
    <g id="nodes">${weeks.map((w, i) => {
      const { x, y, s, r, cy } = nodePos[i];
      return `<g class="b-node" data-i="${i}" tabindex="0" role="button" aria-label="Week ${w.week}, ${fmtDate(w.date)}">
        <ellipse class="b-shadow" cx="${x}" cy="${y}" rx="${r * 0.9}" ry="${r * 0.22}"/>
        <circle class="b-glow" cx="${x}" cy="${cy}" r="${r + 7}"/>
        <clipPath id="node-split-${i}"><rect x="${x - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}"/></clipPath>
        <g clip-path="url(#node-clip)">
          <image class="n-drawing" x="${x - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" preserveAspectRatio="xMidYMid slice"/>
          <g clip-path="url(#node-split-${i})"><image class="n-photo" x="${x - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" preserveAspectRatio="xMidYMid slice"/></g>
        </g>
        <circle class="b-ring" cx="${x}" cy="${cy}" r="${r + 1}"/>
        <text class="b-label" x="${x}" y="${y + 6 + 14 * s}" font-size="${(8 + 7 * s).toFixed(1)}">W${w.week}</text>
      </g>`;
    }).reverse().join("")}</g>`;  // far weeks first, so near ones paint on top

  const trail = $("#trail"), startLabel = $("#start-label");
  const fade = [board.querySelector("#grid-fade"), $("#grid-fade-r")];
  const nodeEls = [...board.querySelectorAll(".b-node")].sort((a, b) => a.dataset.i - b.dataset.i);
  const paintImages = () => nodeEls.forEach((g, i) => {
    g.querySelector(".n-drawing").setAttribute("href", src(i, "drawing"));
    g.querySelector(".n-photo").setAttribute("href", src(i, "photo"));
  });
  // Each week on the path shows the same drawing/photo split as the dial.
  const splitRects = nodeEls.map((g) => g.querySelector("clipPath rect"));
  function paintSplit() {
    splitRects.forEach((rect, i) => {
      const { x, r } = nodePos[i];
      rect.setAttribute("x", x - r + 2 * r * split);
      rect.setAttribute("width", 2 * r * (1 - split));
    });
  }

  const labels = nodeEls.map((g) => g.querySelector(".b-label"));
  const SPOT = { x: 190, y: 300, r: 64 };  // where, and how big, the current week appears (board units)

  let shown = -1;
  function paintBoard() {
    const cut = uOf(v);
    trail.setAttribute("points", pts(SAMPLES.filter((u) => u < cut).map(at).concat([at(cut)])));

    // Camera: zoom by how much smaller the current point is than week 1, and pan
    // so it lands on week 1's spot. At week 1 this is the whole board.
    const [px, py, ps] = at(cut), k = (56 * ps) / SPOT.r, pcy = py - 56 * ps * 1.05;
    const vb = [px - SPOT.x * k, pcy - SPOT.y * k, BW * k, BH * k];
    board.setAttribute("viewBox", vb.map((n) => n.toFixed(2)).join(" "));
    fade.forEach((el) => ["x", "y", "width", "height"].forEach((a, j) => el.setAttribute(a, vb[j])));
    nodeEls.forEach((g, j) => {
      const a = nodePos[j].r / k / SPOT.r;  // on-screen size, 1 = the current week
      // Keep labels the same size on screen while the camera zooms.
      labels[j].setAttribute("font-size", ((9 + 6 * Math.min(a, 1)) * k).toFixed(2));
      // Weeks you've passed fade out as they slide past the camera.
      const op = Math.max(0, Math.min(1, (1.25 - a) / 0.2));
      g.style.opacity = op;
      g.style.pointerEvents = op < 0.2 ? "none" : "";
    });
    startLabel.setAttribute("font-size", (9 * k).toFixed(2));

    const i = Math.round(v);
    nodeEls.forEach((g, k) => { g.classList.toggle("past", k <= v + 1e-6); g.classList.toggle("sel", k === i); });
    if (i !== shown) { shown = i; renderDetail(i); chartSel.forEach((fn) => fn(i)); placeCard(); }
  }

  // The card sits just right of SPOT, which never moves on screen, so it only
  // needs placing on resize, on a new week, and when the path comes back.
  function placeCard() {
    const r = board.getBoundingClientRect();
    if (!r.width || getComputedStyle(detail).position !== "absolute") return;
    const m = Math.min(r.width / BW, r.height / BH), ox = (r.width - BW * m) / 2, oy = (r.height - BH * m) / 2;
    const w = detail.offsetWidth, h = detail.offsetHeight;
    const left = Math.min(ox + (SPOT.x + SPOT.r + 24) * m, r.width - w);
    const top = Math.max(0, Math.min(oy + (SPOT.y - SPOT.r * 0.6) * m, r.height - h));
    detail.style.setProperty("--card-x", left + "px");
    detail.style.setProperty("--card-y", top + "px");
  }
  addEventListener("resize", placeCard);
  addEventListener("load", placeCard);  // fonts can change the card height

  nodeEls.forEach((g, i) => {
    g.addEventListener("click", () => { stopPlay(); select(i); });
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stopPlay(); select(i); } });
  });

  // Drawing and photo each have their own notes; the card shows the ones for
  // whichever takes up more of the dial.
  function renderDetail(i) {
    const w = weeks[i], mode = leading();
    const notes = mode === "photo" ? w.photoNotes : w.thoughts;
    detail.innerHTML = `
      <p class="date">Week ${w.week} · ${fmtDate(w.date, { weekday: "long", month: "long", day: "numeric" })}</p>
      <h3>${w.technique || "Untitled technique"}</h3>
      ${mode === "drawing" && w.liked != null ? `<p class="verdict ${w.liked ? "yes" : "no"}">${w.liked ? "Liked it" : "Didn't like it"}</p>` : ""}
      ${notes ? `<p class="notes-head">${mode === "photo" ? "Photo notes" : "Drawing notes"}</p><p class="notes">${notes}</p>` : ""}
      <p class="meters-head">How the tomato is holding up</p>
      <dl class="meters">${D.metrics.map((m) => {
        const s = w.scores?.[m.key];
        return `<div class="meter" title="${m.hint || ""}"><dt>${m.label}</dt><div class="bar"><span style="width:${(s ?? 0) * 10}%"></span></div><dd>${s ?? "–"}</dd></div>`;
      }).join("")}</dl>`;
  }

  // ── Reports: one small chart per score, plus the average, shared 0–10 scale ──
  const W = 300, H = 120, PL = 22, PR = 10, PT = 10, PB = 20;
  const x = (i) => PL + (N > 1 ? (i / (N - 1)) * (W - PL - PR) : (W - PL - PR) / 2);
  const y = (s) => PT + (1 - s / 10) * (H - PT - PB);
  const charts = $("#charts");
  const chartSel = [];
  const average = (w) => {
    const vals = D.metrics.map((m) => w.scores?.[m.key]).filter((s) => s != null);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  };
  const series = D.metrics.map((m) => ({ ...m, score: (w) => w.scores?.[m.key] }))
    .concat({ key: "average", label: "Average", hint: "All five scores together", score: average });

  series.forEach((m) => {
    const pts = weeks.map((w, i) => [i, m.score(w)]).filter(([, s]) => s != null);
    const card = document.createElement("div");
    card.className = "chart";
    const path = pts.map(([i, s], k) => `${k ? "L" : "M"}${x(i)},${y(s)}`).join("");
    const area = pts.length ? `${path}L${x(pts.at(-1)[0])},${y(0)}L${x(pts[0][0])},${y(0)}Z` : "";
    const xLabelEvery = Math.ceil(N / 8);
    card.innerHTML = `
      <div class="chart-head"><h3>${m.label}</h3><span class="now"></span></div>
      <p class="sub">${m.hint || ""}</p>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${m.label} score by week">
        <g class="grid">${[0, 5, 10].map((s) => `<line x1="${PL}" x2="${W - PR}" y1="${y(s)}" y2="${y(s)}"/>`).join("")}</g>
        <g class="axis">
          ${[0, 5, 10].map((s) => `<text x="${PL - 6}" y="${y(s) + 3}" text-anchor="end">${s}</text>`).join("")}
          ${weeks.map((w, i) => i % xLabelEvery ? "" : `<text x="${x(i)}" y="${H - 4}" text-anchor="middle">W${w.week}</text>`).join("")}
        </g>
        <path class="area" d="${area}"/>
        <line class="cross" y1="${PT}" y2="${H - PB}" visibility="hidden"/>
        <path class="line" d="${path}"/>
        ${pts.map(([i, s]) => `<circle class="dot" data-i="${i}" cx="${x(i)}" cy="${y(s)}" r="4"/>`).join("")}
        <rect class="hit" x="0" y="0" width="${W}" height="${H}" fill="transparent" style="cursor:pointer"/>
      </svg>`;
    charts.appendChild(card);

    const svg = card.querySelector("svg"), cross = card.querySelector(".cross");
    const tip = document.createElement("div");
    tip.className = "tip"; tip.hidden = true; card.appendChild(tip);
    // The chart is letterboxed inside its cell, so map through the drawn box, not the element box.
    const box = () => {
      const r = svg.getBoundingClientRect(), k = Math.min(r.width / W, r.height / H);
      return { left: r.left + (r.width - W * k) / 2, top: r.top + (r.height - H * k) / 2, k };
    };
    const nearest = (e) => {
      const b = box(), px = (e.clientX - b.left) / b.k;
      return Math.max(0, Math.min(N - 1, Math.round(((px - PL) / (W - PL - PR)) * (N - 1))));
    };
    const hit = card.querySelector(".hit");
    hit.addEventListener("pointermove", (e) => {
      const i = nearest(e), s = m.score(weeks[i]);
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
      const b = box(), cr = card.getBoundingClientRect();
      tip.hidden = false;
      tip.textContent = `Week ${weeks[i].week} · ${s ?? "no score"}`;
      tip.style.left = b.left - cr.left + x(i) * b.k + "px";
      tip.style.top = b.top - cr.top + y(s ?? 10) * b.k - 6 + "px";
    });
    hit.addEventListener("pointerleave", () => { tip.hidden = true; cross.setAttribute("visibility", "hidden"); });
    hit.addEventListener("click", (e) => { stopPlay(); select(nearest(e)); });

    chartSel.push((i) => {
      card.querySelectorAll(".dot").forEach((d) => d.classList.toggle("sel", +d.dataset.i === i));
      const s = m.score(weeks[i]);
      card.querySelector(".now").textContent = `Week ${weeks[i].week}: ${s ?? "–"}/10`;
    });
  });

  // ── Notes: how each score is taken ───────────────────────────────────
  const method = $("#method");
  const M = D.method || {};
  method.innerHTML = `
    <section class="rule">
      <p class="kicker">The one rule</p>
      <h3>${M.rule || ""}</h3>
      ${M.intro ? `<p>${M.intro}</p>` : ""}
      ${M.order ? `<p class="order">${M.order}</p>` : ""}
      ${M.exception ? `<p class="exception">${M.exception}</p>` : ""}
    </section>
    ${D.metrics.map((m) => `
      <section class="how">
        <h3>${m.label}</h3>
        <p>${m.method || ""}</p>
        ${m.hint ? `<p class="scale">1–10 · ${m.hint}</p>` : ""}
      </section>`).join("")}`;

  // ── Go ─────────────────────────────────────────────────────────────────
  fitCanvas();
  buildFrames();
  paintImages();
  setSplit(split);
  render();
  select(0);
})();
