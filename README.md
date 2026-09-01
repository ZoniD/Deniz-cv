# Deniz Bardakci — Eclipse to Dawn

This version turns the eclipse into a scroll-driven celestial transition.

## Core idea

At the top of the website:

- full eclipse
- almost-black background
- deep crimson atmosphere
- heavy vignette

As you scroll:

- the sun gradually moves away from behind the moon
- a crescent appears
- more of the solar disc becomes visible
- the moon remains visible as a separate celestial body
- the site gradually becomes brighter
- crimson dominance reduces
- warm near-white ambient light appears

Near the lower sections:

- the eclipse is effectively over
- the sun and moon are clearly separated
- the site feels like dawn after an eclipse
- it is still a premium dark-themed website, not light mode

## Motion

Scroll controls the main animation using normalized scroll progress from `0` to `1`.

JavaScript controls:

- sun X/Y orbit
- sun/moon overlap
- solar corona
- atmospheric brightness
- crimson intensity
- vignette strength
- cloud visibility
- moon reflected light
- subtle cursor parallax

All animation is smoothed with interpolation inside `requestAnimationFrame`.

## Files

```text
deniz-cv-eclipse-dawn-scroll/
├── index.html
├── styles.css
├── script.js
└── README.md
```

## Run locally

### VS Code
Open `index.html` with Live Server.

### Python
```bash
python -m http.server 5500
```

Then visit:

```text
http://localhost:5500
```

## Replace

Replace the LinkedIn placeholder in `index.html` with the real URL.


## Content update
Detailed Workly and Slikskoven project descriptions plus competency-focused IT section added.
