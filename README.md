<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in browser: https://glittering-pudding-6755b7.netlify.app
## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `GEMINI_API_KEY` in Netlify environment variables for deployed Gemini replies.
   For local Netlify testing, put `GEMINI_API_KEY=...` in `.env.local` and run with Netlify Dev.
3. Run the app:
   `npm run dev`
