const express = require("express");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { recommendCars } = require("../utils/scorer");

const router = express.Router();
const carsPath = path.join(__dirname, "../data/cars.json");

const EXTRACT_SYSTEM = `You are a car buying assistant. Extract filter preferences and return only valid JSON:
{
  "budget_lakh": number,
  "fuel_type": string or "any",
  "transmission": string or "any",
  "seats": number,
  "use_cases": string[],
  "body_type": string or "any",
  "ready_to_search": boolean
}
If not enough info, return: { "ready_to_search": false, "question": "follow-up..." }
Use use_cases from: city, highway, family, large_family, first_car, budget, premiuimfeel, eco_friendly, off_road, safety, low_running_cost.
Return JSON only, no markdown.`;

let carsCache = null;

function loadCars() {
    if (!carsCache) {
        carsCache = JSON.parse(fs.readFileSync(carsPath, "utf8"));
    }
    return carsCache;
}

function getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set");
    }
    return new GoogleGenerativeAI(apiKey);
}

// gemini-2.0-flash often has free-tier limit: 0 on new keys; use 2.5 instead
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function getModel(systemInstruction) {
    const opts = { model: GEMINI_MODEL };
    if (systemInstruction) opts.systemInstruction = systemInstruction;
    return getGenAI().getGenerativeModel(opts);
}

function parseJsonFromText(text) {
    const trimmed = text.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const raw = fenced ? fenced[1].trim() : trimmed;
    return JSON.parse(raw);
}

function formatHistory(history) {
    if (!Array.isArray(history) || history.length === 0) return "";
    return history
        .map((m) => {
            const role = m.role || "user";
            const content = m.content ?? m.message ?? "";
            return `${role}: ${content}`;
        })
        .join("\n");
}

function buildNeedsSummary(params) {
    const parts = [];
    if (params.budget_lakh) parts.push(`budget around ₹${params.budget_lakh} lakh`);
    if (params.fuel_type && params.fuel_type !== "any") parts.push(`${params.fuel_type} fuel`);
    if (params.transmission && params.transmission !== "any") {
        parts.push(`${params.transmission} transmission`);
    }
    if (params.seats) parts.push(`${params.seats}+ seats`);
    if (params.body_type && params.body_type !== "any") parts.push(`${params.body_type} body`);
    if (params.use_cases?.length) parts.push(`priorities: ${params.use_cases.join(", ")}`);
    return parts.join("; ") || "general car purchase needs";
}

function toSearchAnswers(params) {
    return {
        budget_lakh: params.budget_lakh,
        fuel_type: params.fuel_type || "any",
        transmission: params.transmission || "any",
        seats: params.seats ?? params.seat ?? 5,
        use_cases: params.use_cases || [],
        body_type: params.body_type || "any",
    };
}

function geminiFailureResponse() {
    return {
        type: "question",
        question:
            "Something went wrong — could you rephrase what you are looking for?",
    };
}

function isGeminiError(err) {
    return (
        err?.name === "GoogleGenerativeAIFetchError" ||
        String(err?.message || "").includes("GoogleGenerativeAI") ||
        err?.status === 429 ||
        err?.status === 503
    );
}

router.post("/", async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        if (!message || typeof message !== "string") {
            return res.status(400).json({ error: "message string is required" });
        }

        const model = getModel(EXTRACT_SYSTEM);
        const historyBlock = formatHistory(history);
        const extractPrompt = historyBlock
            ? `${historyBlock}\nuser: ${message}\n\nExtract preferences from the full conversation above and the latest message.`
            : `user: ${message}`;

        let extracted;
        try {
            const extractResult = await model.generateContent(extractPrompt);
            extracted = parseJsonFromText(extractResult.response.text());
        } catch (err) {
            console.error("Gemini extract failed:", err);
            if (isGeminiError(err) || err instanceof SyntaxError) {
                return res.json(geminiFailureResponse());
            }
            throw err;
        }

        if (!extracted.ready_to_search) {
            return res.json({
                type: "question",
                question:
                    extracted.question ||
                    "Could you share your budget (in lakh), fuel preference, and how you plan to use the car?",
            });
        }

        const answers = toSearchAnswers(extracted);
        const cars = loadCars();
        const results = recommendCars(answers, cars);
        const needsSummary = buildNeedsSummary(extracted);

        const carSummaries = results.map((c) => ({
            id: c.id,
            make: c.make,
            model: c.model,
            variant: c.variant,
            price_lakh: c.price_lakh,
            fuel_type: c.fuel_type,
            body_type: c.body_type,
            safety_rating: c.safety_rating,
            score: c.score,
        }));

        const whyModel = getModel();
        const whyPrompt = `User wants: ${needsSummary}

For each car below, write one sentence explaining why it suits this buyer.
Return only a JSON array: [{"id": string, "why_recommended": string}]

Cars:
${JSON.stringify(carSummaries, null, 2)}`;

        let whyById = {};
        try {
            const whyResult = await whyModel.generateContent(whyPrompt);
            const whyList = parseJsonFromText(whyResult.response.text());
            whyById = Object.fromEntries(
                whyList.map((w) => [w.id, w.why_recommended])
            );
        } catch (err) {
            console.error("Gemini why_recommended failed:", err);
            if (isGeminiError(err) || err instanceof SyntaxError) {
                return res.json(geminiFailureResponse());
            }
            throw err;
        }

        const enriched = results.map((car) => ({
            ...car,
            why_recommended: whyById[car.id] || null,
        }));

        const summary = `Found ${enriched.length} match${enriched.length === 1 ? "" : "es"} for ${needsSummary}.`;

        res.json({
            type: "results",
            results: enriched,
            summary,
        });
    } catch (err) {
        console.error("POST /api/chat:", err);
        if (isGeminiError(err)) {
            return res.json(geminiFailureResponse());
        }
        const status = err.message?.includes("GEMINI_API_KEY") ? 503 : 500;
        res.status(status).json({
            error: err.message?.includes("GEMINI_API_KEY")
                ? "Chat service not configured"
                : "Failed to process chat message",
        });
    }
});

module.exports = router;
