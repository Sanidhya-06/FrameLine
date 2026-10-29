# FrameLine visual tokens

The four images in `docs/reference/` were inspected. The current Screen A authority is the provided wide cyberpunk newsroom artwork at `frontend/public/images/frameline-background.png`. It is used as-is as a centered, full-viewport cover image. The left and right monitor banks frame a dark, deliberately open center where all search UI sits. The other references show an illustrated alternate room, a warm translucent-card collection scene, and a blue network map; they do not replace the Screen A background asset.

## Screen A palette

| Token | Value | Use |
|---|---|---|
| Night navy | `#020817` | Page fallback behind the artwork |
| Deep blue | `#061a3d` | Search field tint |
| Electric blue | `#1689DB` | Brief-chip outlines and search glow |
| Neon cyan | `#22BAFF` | Wordmark accent and active navigation cue |
| Neon pink | `#EC32BD` | “framing”, Explore button, quick-brief numbers |
| Off-white | `#F7F2F3` | Main headline and primary text |
| White | `#FFFFFF` | Actions and high-contrast details |

Use the supplied image to provide the room’s color, pixel texture, contrast, and monitor details. Keep any overlay extremely subtle; the open center of the image is already dark enough for readable copy. Do not blur, recolor, recreate, crop into a substitute, or generate another background.

## Typography

- **Bodoni Moda** is the display serif for the FrameLine wordmark, navigation, and hero title. Use its italic optical style for the hot-pink “framing” emphasis.
- **Manrope** is used for descriptive copy, controls, and quick-brief labels.
- **DM Mono** remains available for the collection screen’s data/status labels.
- Desktop hero: `clamp(48px, 5.4vw, 78px)` with a tight line height near `.99`. Mobile hero: `clamp(32px, 9vw, 58px)`.

## Layout and controls

- Background: `center center / cover`, no repeat, fills the viewport.
- Desktop navigation: 76px high; wordmark left, five links centered, outlined Explore Now pill right.
- Hero: centered horizontally in the open center, beginning around 13–14vh below the top edge. At desktop, keep the hero around 760px wide; the search field and chips are capped at 700px.
- Search field: 64px high with a 15px radius, fine electric-blue outline, subtle blue glow, and pink Explore action.
- Quick briefs: compact outlined chips below a small uppercase label, with pink sequence numbers.
- Mobile navigation hides the center link row and retains the wordmark and Explore action. Headline, form, and brief chips scale and wrap within the viewport.
- Motion is limited to a short entrance transition. `prefers-reduced-motion` disables that transition and ambient animation.

## Tailwind configuration

The colors, Bodoni/Manrope/DM Mono font families, glow shadows, and spacing extensions are in `frontend/tailwind.config.js`. The reference artwork is a static asset served from `frontend/public/images/frameline-background.png`; its visual content is unchanged.
