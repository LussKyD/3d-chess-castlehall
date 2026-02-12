# 3D Chess — Castle Hall (MVP)

A runnable starter project (Vite + React + react-three-fiber) for the 3D Chess — Castle Hall game.

## What you get
- A Vite React app with a 3D scene (board + kings & queens that watch the camera)
- Placeholder piece geometry and colors matching the requested palette (gold, black, purple, white)
- `public/assets/reference_images` contains the reference images you provided
- A placeholder chess engine in `src/engine/chessEngine.js` (no external dependency so the project runs out-of-the-box)

## How to run locally (after download)
1. Unzip the project
2. In the project folder run:

```bash
npm install
npm run dev
```

3. Open the dev server (usually http://localhost:5173)

## Seeing the latest changes (after a push)

If you don’t see new features (e.g. stair doors, door guards, camera not following the guard), make sure you’re running the latest code:

1. **Pull latest:**  
   `git pull origin main`
2. **Run a fresh dev build:**  
   `npm install` then `npm run dev`
3. **Hard refresh the app:**  
   In the browser: **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac), or clear cache and reload.
4. **If using GitHub Pages:**  
   Check the repo **Actions** tab that the last workflow run succeeded; then open the site in a private/incognito window or hard refresh to avoid cache.

## Notes & next steps
- This MVP intentionally avoids requiring chess.js so you can run the scene immediately.
- When you want game rules, install `chess.js` and wire up `src/engine/chessEngine.js`.
- I copied your reference images into `public/assets/reference_images` as `ref1.jpg`, `ref2.jpg`, `ref3.jpg`.

## Testing
- The app is intentionally minimal to reduce friction: it should launch and show the board and two large king/queen statues that track camera movement.

---
Next Steps:
- add chess.js and click-to-move interaction,
- replace placeholder geometry with GLTF piece models,
- add lighting, pillars, banners, or environment HDRI,
- prepare a build and assets pipeline.


## GitHub Pages (automatic deploy via GitHub Actions)

This project includes a GitHub Actions workflow that will build the Vite app and publish the `dist/` to the `gh-pages` branch automatically when you push to `main`.


