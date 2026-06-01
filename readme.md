# CarFinder — CarDekho AI Assignment

A conversational car finder that helps a confused buyer go from "I don't know what to buy" to a confident shortlist in under a minute.

**Live URL:** https://carfinderwebapp.netlify.app/
**Backend API:** https://carfinder-ce86.onrender.com
**Screen Recording:** https://drive.google.com/file/d/1GKT01Iy1zrlyxz9bTbOou80QosjC52zX/view?usp=sharing

---

## What did you build and why? What did you deliberately cut?

Built a conversational car finder — user describes what they need in plain text, Gemini extracts their preferences, a scoring engine filters and ranks the dataset, and results come back with a personalised "why this car" explanation for each match. The core problem is decision paralysis so I focused entirely on the intake-to-shortlist flow.

Deliberately cut: user auth (irrelevant to the core problem), a live third-party car API (fragile, no Indian market data, adds a network dependency for zero extra value over a curated dataset), a full spec comparison table (that's the problem, not the solution), and a database (static cars.json never goes down during a demo and setup takes zero time).

---

## What's your tech stack and why?

| Layer    | Tech              | Why                                          |
| -------- | ----------------- | -------------------------------------------- |
| Frontend | React + Vite      | Fast setup, component-driven                 |
| Backend  | Node + Express    | Simple REST, easy to deploy                  |
| AI       | Gemini 1.5 Flash  | Free tier, fast, handles NLP extraction well |
| Data     | Static cars.json  | No DB setup, never fails during demo         |
| Images   | imagin.studio CDN | Free, no auth, dynamic by make/model/year    |
| Deploy   | Netlify + Render  | Both free, deploy in under 2 minutes         |

---

## What did you delegate to AI vs do manually? Where did tools help most? Where did they get in the way?

**Delegated to AI:** scaffolding, Tailwind layout markup, cars.json structure, Gemini API wiring, routing boilerplate, ResultCard component markup.

**Did manually:** scoring weights in scorer.js (AI's first pass had flat weights with no logic — rewrote it myself), chat state management in the frontend (needed exact control over the conversation flow), all deploy config and env var setup, CORS fix for Render + Netlify cross-origin calls.

**Helped most:** UI layer — output is easy to verify visually so I could accept or reject fast. Also great for boilerplate I'd have typed anyway.

**Got in the way:** Cursor kept adding features I didn't ask for (save shortlist button, a comparison table). Removed it every time. Also hallucinated a Gemini SDK method that doesn't exist — had to check the actual docs and fix manually.

---

## If you had another 4 hours, what would you add?

- Streaming Gemini responses so text appears word by word instead of all at once
- Side-by-side comparison view for shortlisted cars
- Persist conversation state in URL params so users can share their shortlist
- Better image fallback using Unsplash for brands imagin.studio doesn't cover
- Swap the rule-based scorer for embedding-based semantic matching

---

## Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/cardekho-assignment
cd cardekho-assignment

# Run both servers
npm install
npm run dev
```

Create `server/.env`:
