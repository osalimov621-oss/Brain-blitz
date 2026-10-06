# BrainBlitz

Live quiz game: build a quiz, host it, play to the podium, get a host report. Plain HTML, CSS and JS. No build step.

```
index.html              the whole app (home, creator, My Quizzes, lobby, game, podium, report)
404.html                friendly not-found page that links back to the app
assets/css/styles.css   styles (dark + light themes)
assets/js/theme-init.js applies the saved theme before first paint
assets/js/join.js       home-page join flow
assets/js/app.js        editor, game, report, routing, menus
.github/workflows/pages.yml   GitHub Pages deploy
.nojekyll               tells Pages to serve files as-is
```

All links are relative, so it works at `https://<user>.github.io/<repo>/`. Screens have shareable URLs: `#/` (home), `#/editor`, `#/quizzes`, `#/lobby`.

## Run locally
```
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy to GitHub Pages
1. Create a GitHub repo and push these files to `main`.
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The workflow runs on every push. Your site appears at `https://<user>.github.io/<repo>/`.

(No Actions? Choose **Deploy from a branch → main → / (root)** instead. It works the same.)

Notes: quizzes are saved in memory only and players are simulated. The theme choice is remembered in `localStorage`.
