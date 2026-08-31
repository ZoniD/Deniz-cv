const prefersReducedMotion =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(edge0, edge1, value) {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function mixRgb(a, b, t) {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}

function rgbString(rgb) {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function seededRandom(seed) {
  let value = seed >>> 0;

  return function () {
    value += 0x6D2B79F5;

    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = seededRandom(4815162342);

const root = document.documentElement;
const eclipseCanvas = document.querySelector("#eclipseCanvas");
const eclipseContext = eclipseCanvas.getContext("2d", { alpha: true });

let viewportWidth = 0;
let viewportHeight = 0;
let canvasDpr = 1;
let animationId = 0;
let running = true;

const pointer = {
  targetX: 0,
  targetY: 0,
  currentX: 0,
  currentY: 0,
};

let targetScrollProgress = 0;
let currentScrollProgress = 0;


// ==========================================================
// CELESTIAL DATA
// ==========================================================

const stars = Array.from({ length: 62 }, () => ({
  x: 0.38 + random() * 0.61,
  y: random() * 0.70,
  radius: 0.2 + random() * 0.9,
  alpha: 0.02 + random() * 0.12,
}));

const clouds = Array.from({ length: 28 }, () => ({
  x: 0.46 + random() * 0.56,
  y: 0.02 + random() * 0.72,
  rx: 0.06 + random() * 0.18,
  ry: 0.025 + random() * 0.08,
  alpha: 0.012 + random() * 0.055,
  red: 0.008 + random() * 0.035,
  depth: 0.35 + random() * 0.9,
}));

const coronaWisps = Array.from({ length: 190 }, () => ({
  angle: random() * Math.PI * 2,
  length: 0.75 + random() * 1.72,
  alpha: 0.02 + random() * 0.105,
  width: 0.3 + random() * 1.2,
  curve: (random() - 0.5) * 0.14,
  phase: random() * Math.PI * 2,
}));


// ==========================================================
// GEOMETRY
// ==========================================================

function getCelestialGeometry() {
  const mobile = viewportWidth < 760;
  const tablet =
    viewportWidth >= 760 &&
    viewportWidth < 1050;

  // Slightly smaller than the previous "epic 3D" version.
  let diameter;

  if (mobile) {
    diameter = clamp(
      viewportWidth * 0.50,
      210,
      300
    );
  }
  else if (tablet) {
    diameter = clamp(
      viewportWidth * 0.40,
      320,
      460
    );
  }
  else {
    diameter = clamp(
      viewportWidth * 0.37,
      430,
      680
    );
  }

  const radius =
    diameter / 2;

  const moonBaseX =
    viewportWidth * 0.79;

  const moonBaseY =
    mobile
      ? 185
      : viewportHeight * 0.22;

  return {
    mobile,
    tablet,
    diameter,
    radius,
    moonBaseX,
    moonBaseY,
  };
}


// ==========================================================
// CANVAS SIZE
// ==========================================================

function resizeCanvas() {
  viewportWidth =
    Math.max(
      1,
      window.innerWidth
    );

  viewportHeight =
    Math.max(
      1,
      window.innerHeight
    );

  canvasDpr =
    Math.min(
      window.devicePixelRatio || 1,
      1.6
    );

  eclipseCanvas.width =
    Math.floor(
      viewportWidth * canvasDpr
    );

  eclipseCanvas.height =
    Math.floor(
      viewportHeight * canvasDpr
    );

  eclipseCanvas.style.width =
    `${viewportWidth}px`;

  eclipseCanvas.style.height =
    `${viewportHeight}px`;

  eclipseContext.setTransform(
    canvasDpr,
    0,
    0,
    canvasDpr,
    0,
    0
  );
}


// ==========================================================
// SCROLL
// ==========================================================

function calculateScrollProgress() {
  const maxScroll =
    Math.max(
      1,
      document.documentElement.scrollHeight -
      window.innerHeight
    );

  return clamp(
    window.scrollY / maxScroll,
    0,
    1
  );
}

function updateTargetScrollProgress() {
  targetScrollProgress =
    calculateScrollProgress();
}


// ==========================================================
// SITE LIGHTING
// ==========================================================

function updateSiteLighting(progress) {
  /*
    We deliberately finish most of the "dawn" transition
    before the very bottom, so the lower half already feels brighter.
  */

  const dawn =
    smoothstep(
      0.08,
      0.78,
      progress
    );

  const darkBg =
    [3, 3, 4];

  const dawnBg =
    [19, 18, 20];

  const darkSoft =
    [5, 4, 6];

  const dawnSoft =
    [28, 26, 27];

  const darkText =
    [242, 240, 238];

  const dawnText =
    [249, 245, 239];

  const darkMuted =
    [167, 163, 161];

  const dawnMuted =
    [194, 187, 181];

  const darkMutedDim =
    [113, 107, 105];

  const dawnMutedDim =
    [148, 140, 134];

  root.style.setProperty(
    "--page-bg",
    rgbString(
      mixRgb(
        darkBg,
        dawnBg,
        dawn
      )
    )
  );

  root.style.setProperty(
    "--page-bg-soft",
    rgbString(
      mixRgb(
        darkSoft,
        dawnSoft,
        dawn
      )
    )
  );

  root.style.setProperty(
    "--page-text",
    rgbString(
      mixRgb(
        darkText,
        dawnText,
        dawn
      )
    )
  );

  root.style.setProperty(
    "--page-muted",
    rgbString(
      mixRgb(
        darkMuted,
        dawnMuted,
        dawn
      )
    )
  );

  root.style.setProperty(
    "--page-muted-dim",
    rgbString(
      mixRgb(
        darkMutedDim,
        dawnMutedDim,
        dawn
      )
    )
  );

  root.style.setProperty(
    "--ambient-crimson",
    (
      lerp(
        0.070,
        0.025,
        dawn
      )
    ).toFixed(3)
  );

  root.style.setProperty(
    "--ambient-warm",
    (
      lerp(
        0.000,
        0.070,
        dawn
      )
    ).toFixed(3)
  );

  root.style.setProperty(
    "--hero-vignette-opacity",
    (
      lerp(
        1,
        0.24,
        dawn
      )
    ).toFixed(3)
  );
}


// ==========================================================
// ATMOSPHERE
// ==========================================================

function drawAtmosphere(
  geometry,
  progress
) {
  const ctx =
    eclipseContext;

  const {
    moonBaseX,
    moonBaseY,
    radius,
  } = geometry;

  const dawn =
    smoothstep(
      0.08,
      0.78,
      progress
    );

  const topDark =
    mixRgb(
      [2, 2, 3],
      [21, 20, 21],
      dawn
    );

  const bottomDark =
    mixRgb(
      [5, 4, 6],
      [30, 27, 27],
      dawn
    );

  const background =
    ctx.createLinearGradient(
      0,
      0,
      0,
      viewportHeight
    );

  background.addColorStop(
    0,
    rgbString(topDark)
  );

  background.addColorStop(
    1,
    rgbString(bottomDark)
  );

  ctx.fillStyle =
    background;

  ctx.fillRect(
    0,
    0,
    viewportWidth,
    viewportHeight
  );


  // Stars fade as the eclipse ends.
  const starVisibility =
    lerp(
      1,
      0.30,
      dawn
    );

  for (
    const star
    of stars
  ) {
    const sx =
      star.x *
      viewportWidth;

    const sy =
      star.y *
      viewportHeight;

    ctx.beginPath();

    ctx.arc(
      sx,
      sy,
      star.radius,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      `rgba(
        242,
        240,
        238,
        ${star.alpha * starVisibility}
      )`;

    ctx.fill();
  }


  // Clouds gain visibility/detail as ambient light rises.
  for (
    const cloud
    of clouds
  ) {
    const parallaxX =
      pointer.currentX *
      11 *
      cloud.depth;

    const parallaxY =
      pointer.currentY *
      7 *
      cloud.depth;

    const cx =
      cloud.x *
      viewportWidth +
      parallaxX;

    const cy =
      cloud.y *
      viewportHeight +
      parallaxY;

    const rx =
      cloud.rx *
      viewportWidth;

    const ry =
      cloud.ry *
      viewportHeight;

    ctx.save();

    ctx.translate(
      cx,
      cy
    );

    ctx.scale(
      rx,
      ry
    );

    const cloudBrightness =
      8 +
      dawn * 18;

    const redLift =
      cloud.red *
      420 *
      (1 - dawn * 0.35);

    const cloudAlpha =
      cloud.alpha *
      lerp(
        0.9,
        1.45,
        dawn
      );

    const g =
      ctx.createRadialGradient(
        0,
        0,
        0.04,
        0,
        0,
        1
      );

    g.addColorStop(
      0,
      `rgba(
        ${cloudBrightness + redLift},
        ${cloudBrightness},
        ${cloudBrightness + redLift * 0.35},
        ${cloudAlpha}
      )`
    );

    g.addColorStop(
      0.58,
      `rgba(
        ${cloudBrightness * 0.55},
        ${cloudBrightness * 0.52},
        ${cloudBrightness * 0.55},
        ${cloudAlpha * 0.55}
      )`
    );

    g.addColorStop(
      1,
      "rgba(3,3,4,0)"
    );

    ctx.fillStyle =
      g;

    ctx.beginPath();

    ctx.arc(
      0,
      0,
      1,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
  }


  // Ambient crimson around the celestial scene.
  const crimsonAtmosphere =
    ctx.createRadialGradient(
      moonBaseX,
      moonBaseY,
      radius * 0.6,
      moonBaseX,
      moonBaseY,
      radius * 3.9
    );

  crimsonAtmosphere.addColorStop(
    0,
    `rgba(
      196,
      30,
      58,
      ${lerp(0.11, 0.045, dawn)}
    )`
  );

  crimsonAtmosphere.addColorStop(
    0.38,
    `rgba(
      141,
      14,
      34,
      ${lerp(0.055, 0.014, dawn)}
    )`
  );

  crimsonAtmosphere.addColorStop(
    1,
    "rgba(141,14,34,0)"
  );

  ctx.fillStyle =
    crimsonAtmosphere;

  ctx.fillRect(
    0,
    0,
    viewportWidth,
    viewportHeight
  );


  // Warm atmospheric illumination introduced as sun is exposed.
  if (
    dawn > 0.001
  ) {
    const warmGlow =
      ctx.createRadialGradient(
        moonBaseX,
        moonBaseY,
        radius * 0.2,
        moonBaseX,
        moonBaseY,
        radius * 5.0
      );

    warmGlow.addColorStop(
      0,
      `rgba(
        255,
        239,
        213,
        ${0.055 * dawn}
      )`
    );

    warmGlow.addColorStop(
      0.42,
      `rgba(
        244,
        218,
        190,
        ${0.020 * dawn}
      )`
    );

    warmGlow.addColorStop(
      1,
      "rgba(244,218,190,0)"
    );

    ctx.fillStyle =
      warmGlow;

    ctx.fillRect(
      0,
      0,
      viewportWidth,
      viewportHeight
    );
  }
}


// ==========================================================
// SUN
// ==========================================================

function getSunPosition(
  geometry,
  progress
) {
  const {
    moonBaseX,
    moonBaseY,
    radius,
    mobile,
  } = geometry;

  /*
    The sun begins directly behind the moon.
    It then follows a curved orbital-feeling path.

    X movement dominates, while Y shifts more subtly.
  */

  const movement =
    smoothstep(
      0.02,
      0.86,
      progress
    );

  const orbitAngle =
    movement *
    Math.PI *
    0.64;

  const horizontalDistance =
    radius *
    (
      mobile
        ? 2.25
        : 2.65
    );

  const verticalDistance =
    radius *
    (
      mobile
        ? 0.56
        : 0.72
    );

  const sunX =
    moonBaseX +
    Math.sin(
      orbitAngle
    ) *
    horizontalDistance;

  const sunY =
    moonBaseY +
    (
      1 -
      Math.cos(
        orbitAngle
      )
    ) *
    verticalDistance -
    movement *
    radius *
    0.15;

  return {
    x: sunX,
    y: sunY,
    movement,
  };
}


function drawSun(
  time,
  geometry,
  progress
) {
  const ctx =
    eclipseContext;

  const {
    radius
  } = geometry;

  const {
    x,
    y,
    movement
  } =
    getSunPosition(
      geometry,
      progress
    );

  const exposed =
    movement;

  const coronaPulse =
    prefersReducedMotion
      ? 1
      : 1 +
        Math.sin(
          time * 0.00030
        ) *
        0.018;

  const coronaIntensity =
    lerp(
      0.82,
      1.15,
      exposed
    );


  // Giant atmospheric sun bloom.
  const outer =
    ctx.createRadialGradient(
      x,
      y,
      radius * 0.65,
      x,
      y,
      radius *
      3.0 *
      coronaPulse
    );

  outer.addColorStop(
    0,
    `rgba(
      255,
      248,
      239,
      ${0.20 * coronaIntensity}
    )`
  );

  outer.addColorStop(
    0.10,
    `rgba(
      244,
      220,
      201,
      ${0.16 * coronaIntensity}
    )`
  );

  outer.addColorStop(
    0.22,
    `rgba(
      196,
      30,
      58,
      ${lerp(0.22, 0.10, exposed)}
    )`
  );

  outer.addColorStop(
    0.56,
    `rgba(
      141,
      14,
      34,
      ${lerp(0.085, 0.025, exposed)}
    )`
  );

  outer.addColorStop(
    1,
    "rgba(141,14,34,0)"
  );

  ctx.fillStyle =
    outer;

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    radius *
    3.0 *
    coronaPulse,
    0,
    Math.PI * 2
  );

  ctx.fill();


  // Solar disc.
  const disc =
    ctx.createRadialGradient(
      x - radius * 0.22,
      y - radius * 0.22,
      radius * 0.02,
      x,
      y,
      radius * 1.02
    );

  disc.addColorStop(
    0,
    "rgba(255,255,250,1)"
  );

  disc.addColorStop(
    0.48,
    "rgba(255,247,231,1)"
  );

  disc.addColorStop(
    0.84,
    "rgba(247,220,190,1)"
  );

  disc.addColorStop(
    1,
    "rgba(229,179,151,1)"
  );

  ctx.fillStyle =
    disc;

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    radius * 0.94,
    0,
    Math.PI * 2
  );

  ctx.fill();


  // Subtle animated surface texture/turbulence.
  ctx.save();

  ctx.globalCompositeOperation =
    "screen";

  for (
    let i = 0;
    i < 14;
    i++
  ) {
    const angle =
      i *
      (
        Math.PI * 2 / 14
      ) +
      time *
      0.000035 *
      (
        i % 2 === 0
          ? 1
          : -1
      );

    const ringRadius =
      radius *
      (
        0.22 +
        (i % 5) * 0.11
      );

    const sx =
      x +
      Math.cos(angle) *
      ringRadius;

    const sy =
      y +
      Math.sin(angle) *
      ringRadius;

    ctx.beginPath();

    ctx.arc(
      sx,
      sy,
      radius *
      (
        0.045 +
        (i % 3) * 0.015
      ),
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      `rgba(
        255,
        255,
        255,
        ${0.025 + exposed * 0.012}
      )`;

    ctx.fill();
  }

  ctx.restore();


  return {
    x,
    y,
  };
}


// ==========================================================
// MOON
// ==========================================================

function drawMoon(
  geometry,
  sunPosition,
  progress
) {
  const ctx =
    eclipseContext;

  const {
    radius,
    moonBaseX,
    moonBaseY,
    mobile,
    tablet,
  } = geometry;

  const pointerShiftX =
    pointer.currentX *
    (
      mobile
        ? 6
        : tablet
          ? 9
          : 13
    );

  const pointerShiftY =
    pointer.currentY *
    (
      mobile
        ? 4
        : tablet
          ? 6
          : 9
    );

  const moonX =
    moonBaseX +
    pointerShiftX;

  const moonY =
    moonBaseY +
    pointerShiftY;


  // Slight 3D surface.
  ctx.save();

  ctx.beginPath();

  ctx.arc(
    moonX,
    moonY,
    radius,
    0,
    Math.PI * 2
  );

  ctx.clip();


  const body =
    ctx.createRadialGradient(
      moonX - radius * 0.32,
      moonY - radius * 0.35,
      radius * 0.06,
      moonX,
      moonY,
      radius * 1.08
    );

  body.addColorStop(
    0,
    "rgba(23,25,29,0.99)"
  );

  body.addColorStop(
    0.20,
    "rgba(10,11,14,1)"
  );

  body.addColorStop(
    0.55,
    "rgba(4,4,6,1)"
  );

  body.addColorStop(
    1,
    "rgba(0,0,0,1)"
  );

  ctx.fillStyle =
    body;

  ctx.fillRect(
    moonX - radius,
    moonY - radius,
    radius * 2,
    radius * 2
  );


  // Lit rim faces the moving sun.
  const dx =
    sunPosition.x -
    moonX;

  const dy =
    sunPosition.y -
    moonY;

  const length =
    Math.hypot(
      dx,
      dy
    ) || 1;

  const lightDirX =
    dx / length;

  const lightDirY =
    dy / length;

  const daylight =
    smoothstep(
      0.10,
      0.82,
      progress
    );

  const reflectedLight =
    ctx.createRadialGradient(
      moonX +
      lightDirX *
      radius *
      0.86,
      moonY +
      lightDirY *
      radius *
      0.86,
      radius * 0.02,
      moonX +
      lightDirX *
      radius *
      0.72,
      moonY +
      lightDirY *
      radius *
      0.72,
      radius * 0.60
    );

  reflectedLight.addColorStop(
    0,
    `rgba(
      255,
      236,
      212,
      ${0.22 * daylight}
    )`
  );

  reflectedLight.addColorStop(
    0.30,
    `rgba(
      196,
      30,
      58,
      ${0.07 * (1 - daylight * 0.35)}
    )`
  );

  reflectedLight.addColorStop(
    1,
    "rgba(255,236,212,0)"
  );

  ctx.fillStyle =
    reflectedLight;

  ctx.fillRect(
    moonX - radius,
    moonY - radius,
    radius * 2,
    radius * 2
  );


  const shade =
    ctx.createRadialGradient(
      moonX + radius * 0.12,
      moonY + radius * 0.12,
      radius * 0.08,
      moonX + radius * 0.14,
      moonY + radius * 0.14,
      radius * 1.18
    );

  shade.addColorStop(
    0,
    "rgba(0,0,0,0)"
  );

  shade.addColorStop(
    0.62,
    "rgba(0,0,0,0.16)"
  );

  shade.addColorStop(
    1,
    "rgba(0,0,0,0.44)"
  );

  ctx.fillStyle =
    shade;

  ctx.fillRect(
    moonX - radius,
    moonY - radius,
    radius * 2,
    radius * 2
  );

  ctx.restore();


  // Immediate near-white eclipse rim fades as separation grows.
  const overlapGlow =
    1 -
    smoothstep(
      0.08,
      0.34,
      progress
    );

  if (
    overlapGlow > 0.001
  ) {
    ctx.save();

    ctx.globalCompositeOperation =
      "screen";

    ctx.beginPath();

    ctx.arc(
      moonX,
      moonY,
      radius * 1.006,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      `rgba(
        242,
        240,
        238,
        ${0.58 * overlapGlow}
      )`;

    ctx.lineWidth =
      1.7;

    ctx.stroke();

    ctx.restore();
  }
}


// ==========================================================
// FRAME
// ==========================================================

function drawFrame(
  time = 0
) {
  if (
    !running
  ) {
    return;
  }


  // Smooth scroll-driven animation.
  currentScrollProgress +=
    (
      targetScrollProgress -
      currentScrollProgress
    ) *
    0.055;


  // Smooth cursor parallax.
  if (
    !prefersReducedMotion
  ) {
    pointer.currentX +=
      (
        pointer.targetX -
        pointer.currentX
      ) *
      0.055;

    pointer.currentY +=
      (
        pointer.targetY -
        pointer.currentY
      ) *
      0.055;
  }


  eclipseContext.clearRect(
    0,
    0,
    viewportWidth,
    viewportHeight
  );


  const geometry =
    getCelestialGeometry();


  drawAtmosphere(
    geometry,
    currentScrollProgress
  );


  // Sun first, moon second.
  const sunPosition =
    drawSun(
      time,
      geometry,
      currentScrollProgress
    );


  drawMoon(
    geometry,
    sunPosition,
    currentScrollProgress
  );


  updateSiteLighting(
    currentScrollProgress
  );


  if (
    !prefersReducedMotion
  ) {
    animationId =
      requestAnimationFrame(
        drawFrame
      );
  }
}


// ==========================================================
// HERO / SECTION REVEALS
// ==========================================================

requestAnimationFrame(
  () => {
    document
      .querySelectorAll(
        ".reveal"
      )
      .forEach(
        element => {
          element
            .classList
            .add("visible");
        }
      );
  }
);


const sectionObserver =
  new IntersectionObserver(
    (
      entries,
      observer
    ) => {
      for (
        const entry
        of entries
      ) {
        if (
          !entry.isIntersecting
        ) {
          continue;
        }

        entry
          .target
          .classList
          .add("visible");

        observer.unobserve(
          entry.target
        );
      }
    },
    {
      threshold: 0.10
    }
  );


document
  .querySelectorAll(
    ".reveal-section"
  )
  .forEach(
    section => {
      sectionObserver.observe(
        section
      );
    }
  );


// ==========================================================
// EVENTS
// ==========================================================

window.addEventListener(
  "scroll",
  updateTargetScrollProgress,
  {
    passive: true
  }
);


window.addEventListener(
  "mousemove",
  event => {
    const nx =
      event.clientX /
      window.innerWidth;

    const ny =
      event.clientY /
      window.innerHeight;

    pointer.targetX =
      (
        nx - 0.5
      ) * 2;

    pointer.targetY =
      (
        ny - 0.5
      ) * 2;
  }
);


window.addEventListener(
  "mouseleave",
  () => {
    pointer.targetX = 0;
    pointer.targetY = 0;
  }
);


let resizeTimer = null;

window.addEventListener(
  "resize",
  () => {
    clearTimeout(
      resizeTimer
    );

    resizeTimer =
      setTimeout(
        () => {
          resizeCanvas();
          updateTargetScrollProgress();

          if (
            prefersReducedMotion
          ) {
            currentScrollProgress =
              targetScrollProgress;

            drawFrame(0);
          }
        },
        120
      );
  }
);


document.addEventListener(
  "visibilitychange",
  () => {
    if (
      document.hidden
    ) {
      running = false;
      cancelAnimationFrame(
        animationId
      );
    }
    else {
      running = true;

      if (
        !prefersReducedMotion
      ) {
        animationId =
          requestAnimationFrame(
            drawFrame
          );
      }
    }
  }
);


// ==========================================================
// INITIALIZE
// ==========================================================

resizeCanvas();
updateTargetScrollProgress();

if (
  prefersReducedMotion
) {
  currentScrollProgress =
    targetScrollProgress;

  // Show a polished mid-transition static state
  // rather than animating celestial bodies.
  currentScrollProgress =
    Math.max(
      currentScrollProgress,
      0.34
    );

  drawFrame(0);
}
else {
  animationId =
    requestAnimationFrame(
      drawFrame
    );
}
