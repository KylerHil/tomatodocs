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
        <text x="100" y="188" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="${ink}" opacity=".6">${weeks[i].style || "sketch"} (placeholder)</text>
      </svg>`;
    }
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  const src = (i, kind) => weeks[i][kind] || placeholder(i, kind);

  // ── Header ─────────────────────────────────────────────────────────────
  $("#title").textContent = D.title;
  $("#subtitle").textContent = D.subtitle;
  $("#range").textContent = N
    ? `${N} week${N > 1 ? "s" : ""} · ${fmtDate(weeks[0].date)} – ${fmtDate(weeks[N - 1].date, { month: "short", day: "numeric", year: "numeric" })}`
    : "No weeks logged yet";
  if (!N) return;

  // ── State ──────────────────────────────────────────────────────────────
  let mode = "photo";
  let v = 0;          // continuous time position, 0 … N-1
  let sel = 0;        // selected week index
  const listeners = [];
  const onSelect = (fn) => listeners.push(fn);
  function select(i) {
    sel = Math.max(0, Math.min(N - 1, i));
    listeners.forEach((fn) => fn(sel));
  }

  // ── Scrubber ───────────────────────────────────────────────────────────
  const stage = $("#stage"), wrap = $(".stage-wrap"), ring = $("#ring");

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
    const green = getComputedStyle(ring).color;
    for (let k = parts.length - 1; k >= 0; k--) {
      const p = parts[k];
      p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96; p.life -= 0.025;
      if (p.life <= 0) { parts.splice(k, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.hot ? "#fff6c2" : green;
      ctx.beginPath();
      ctx.arc((p.x + 20) * s, (p.y + 20) * s, (p.hot ? 0.9 : 1.3) * p.life * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    sparkLoop = parts.length ? requestAnimationFrame(drawSparks) : 0;
  }

  function buildFrames() {
    stage.innerHTML = "";
    weeks.forEach((w, i) => {
      const img = new Image();
      img.alt = `Week ${w.week} ${mode}`;
      img.src = src(i, mode);
      img.draggable = false;
      stage.appendChild(img);
    });
  }

  function render() {
    const lo = Math.floor(v), frac = v - lo;
    [...stage.children].forEach((img, i) => {
      img.style.opacity = i === lo ? 1 : i === lo + 1 ? frac : 0;
    });
    [15, -35, 60].forEach((speed, k) => layers[k].setAttribute("transform", `rotate(${v * speed} 100 100)`));
    const deg = N > 1 ? (v / (N - 1)) * SWEEP : 0;
    progress.setAttribute("stroke-dasharray", `${deg} 360`);
    const [hx, hy] = polar(START + deg, R);
    handle.setAttribute("cx", hx); handle.setAttribute("cy", hy);
    if (wrap.classList.contains("scrubbing") && v !== lastV) emit(START + deg, v - lastV);
    lastV = v;
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
  function tweenTo(target, ms = 450, done) {
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
    tweenTo(N - 1, (N - 1 - v) * 900, () => { stopPlay(); select(N - 1); });
  });

  document.querySelectorAll(".seg button").forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.mode;
      document.querySelectorAll(".seg button").forEach((o) => o.setAttribute("aria-pressed", o === b));
      buildFrames(); render();
    })
  );

  onSelect((i) => { if (!drag && !playing && Math.abs(v - i) > 0.01) tweenTo(i); });

  // ── Timeline ───────────────────────────────────────────────────────────
  const tl = $("#timeline");
  weeks.forEach((w, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<button type="button" class="tl-btn">
      <img alt="" src="${src(i, "photo")}">
      <span class="tl-week">Week ${w.week}</span>
      <span class="tl-date">${fmtDate(w.date)}</span></button>`;
    li.firstElementChild.addEventListener("click", () => select(i));
    tl.appendChild(li);
  });

  const detail = $("#detail");
  function renderDetail(i) {
    const w = weeks[i];
    [...tl.querySelectorAll(".tl-btn")].forEach((b, k) => b.setAttribute("aria-current", k === i));
    const li = tl.children[i];
    if (li.offsetLeft < tl.scrollLeft || li.offsetLeft + li.offsetWidth > tl.scrollLeft + tl.clientWidth)
      tl.scrollTo({ left: li.offsetLeft - tl.clientWidth / 2 + li.offsetWidth / 2, behavior: "smooth" });
    detail.innerHTML = `
      <figure><img alt="Photo, week ${w.week}" src="${src(i, "photo")}"><figcaption><strong>Photo</strong></figcaption></figure>
      <figure><img alt="Drawing, week ${w.week}" src="${src(i, "drawing")}"><figcaption><strong>Drawing</strong> · ${w.style || "—"}</figcaption></figure>
      <div class="info">
        <h3>Week ${w.week}</h3>
        <p class="date">${fmtDate(w.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
        <dl class="meters">${D.metrics.map((m) => {
          const s = w.scores?.[m.key];
          return `<div class="meter"><dt>${m.label}</dt><div class="bar"><span style="width:${(s ?? 0) * 10}%"></span></div><dd>${s ?? "–"}</dd></div>`;
        }).join("")}</dl>
        ${w.notes ? `<p class="notes">${w.notes}</p>` : ""}
      </div>`;
  }
  onSelect(renderDetail);

  // ── Charts: one small chart per metric, shared 0–10 scale ──────────────
  const W = 300, H = 130, PL = 22, PR = 10, PT = 10, PB = 20;
  const x = (i) => PL + (N > 1 ? (i / (N - 1)) * (W - PL - PR) : (W - PL - PR) / 2);
  const y = (s) => PT + (1 - s / 10) * (H - PT - PB);
  const charts = $("#charts");
  const chartSel = [];

  D.metrics.forEach((m) => {
    const pts = weeks.map((w, i) => [i, w.scores?.[m.key]]).filter(([, s]) => s != null);
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
    const nearest = (e) => {
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * W;
      return Math.max(0, Math.min(N - 1, Math.round(((px - PL) / (W - PL - PR)) * (N - 1))));
    };
    const hit = card.querySelector(".hit");
    hit.addEventListener("pointermove", (e) => {
      const i = nearest(e), s = weeks[i].scores?.[m.key];
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
      const r = svg.getBoundingClientRect(), cr = card.getBoundingClientRect();
      tip.hidden = false;
      tip.textContent = `Week ${weeks[i].week} · ${s ?? "no score"}`;
      tip.style.left = r.left - cr.left + (x(i) / W) * r.width + "px";
      tip.style.top = r.top - cr.top + (y(s ?? 10) / H) * r.height - 6 + "px";
    });
    hit.addEventListener("pointerleave", () => { tip.hidden = true; cross.setAttribute("visibility", "hidden"); });
    hit.addEventListener("click", (e) => select(nearest(e)));

    chartSel.push((i) => {
      card.querySelectorAll(".dot").forEach((d) => d.classList.toggle("sel", +d.dataset.i === i));
      const s = weeks[i].scores?.[m.key];
      card.querySelector(".now").textContent = `Week ${weeks[i].week}: ${s ?? "–"}/10`;
    });
  });
  onSelect((i) => chartSel.forEach((fn) => fn(i)));

  // ── Go ─────────────────────────────────────────────────────────────────
  fitCanvas();
  buildFrames();
  render();
  select(0);
})();
