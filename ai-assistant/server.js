const http = require("http");

const PORT = 8001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://35.154.50.216:8000";

const menu = [
  { name: "Classic Cheese Pizza", price: 350, type: "veg", tags: ["pizza", "cheese", "family"] },
  { name: "Spicy Zinger Burger", price: 150, type: "non-veg", tags: ["burger", "spicy", "snack"] },
  { name: "Hyderabadi Chicken Biryani", price: 250, type: "non-veg", tags: ["biryani", "rice", "spicy", "family"] },
  { name: "Butter Chicken", price: 300, type: "non-veg", tags: ["curry", "north indian", "rich"] },
  { name: "Tandoori Roti & Paneer", price: 200, type: "veg", tags: ["paneer", "roti", "north indian"] },
  { name: "Dal Makhani", price: 180, type: "veg", tags: ["dal", "north indian", "comfort"] },
  { name: "Chole Bhature", price: 120, type: "veg", tags: ["north indian", "street food", "snack"] },
  { name: "Paneer Tikka", price: 220, type: "veg", tags: ["paneer", "starter", "grilled"] },
  { name: "Masala Dosa", price: 100, type: "veg", tags: ["south indian", "light", "breakfast"] },
  { name: "Veg Hakka Noodles", price: 140, type: "veg", tags: ["chinese", "noodles", "quick"] },
  { name: "Gobi Manchurian", price: 160, type: "veg", tags: ["chinese", "starter", "spicy"] },
  { name: "Spring Rolls", price: 110, type: "veg", tags: ["chinese", "starter", "snack"] },
  { name: "Chocolate Lava Cake", price: 120, type: "veg", tags: ["dessert", "sweet", "cake"] },
  { name: "Gulab Jamun", price: 60, type: "veg", tags: ["sweet", "dessert", "snack"] },
  { name: "Rasmalai", price: 80, type: "veg", tags: ["sweet", "dessert", "milk"] }
];

function recommend(message) {
  const text = message.toLowerCase();
  const budgetMatch =
    text.match(/under\s*₹?\s*(\d+)/) ||
    text.match(/budget\s*₹?\s*(\d+)/) ||
    text.match(/₹\s*(\d+)/) ||
    text.match(/(\d+)\s*(?:rs|rupees)\b/);

  const peopleMatch = text.match(
    /(\d+)\s*(?:people|persons?|guests|friends)/
  );

  const budget = budgetMatch ? Number(budgetMatch[1]) : null;
  const people = peopleMatch ? Math.min(peopleMatch[1] * 1, 20) : 1;
  const wantsNonVeg = /\bnon[- ]?veg\b|chicken|mutton|fish|meat|\begg\b/.test(text);
  const wantsVeg = /\bveg(?:etarian)?\b|veggie/.test(text) && !wantsNonVeg;
  const wantsVegan = /\bvegan\b/.test(text);
  const wantsSpicy = /spicy|hot|masala/.test(text);
  const wantsSnack = /snack|starter|light|quick|tiffin|breakfast/.test(text);
  const wantsDessert = /sweet|dessert|cake|gulab|rasmalai/.test(text);

  const keywords = ["pizza", "burger", "biryani", "noodles", "paneer"];
  const keyword = keywords.find(k => text.includes(k));

  let matches = menu.filter(item => {
    if (wantsVeg && item.type !== "veg") return false;
    if (wantsNonVeg && item.type !== "non-veg") return false;
    if (wantsVegan && ["Tandoori Roti & Paneer", "Dal Makhani"].includes(item.name)) return false;
    if (wantsSpicy && !item.tags.includes("spicy")) return false;
    if (wantsSnack && !item.tags.some(t =>
      ["snack", "starter", "light", "quick", "breakfast"].includes(t)
    )) return false;
    if (wantsDessert && !item.tags.some(t =>
      ["sweet", "dessert", "cake"].includes(t)
    )) return false;
    if (keyword && !item.tags.includes(keyword)) return false;
    return true;
  });

  if (!matches.length) {
    return {
      reply: "I couldn't find a menu match for all those preferences. Try a different food type or ask for a snack, dessert, vegetarian meal, or spicy dish.",
      recommendations: []
    };
  }

  // Keep the total within the requested budget when possible.
  const limit = budget || Infinity;
  const selected = [];
  let total = 0;

  matches.sort((a, b) => a.price - b.price);

  for (const item of matches) {
    if (selected.length >= 4) break;
    if (total + item.price <= limit) {
      selected.push({ quantity: 1, name: item.name });
      total += item.price;
    }
  }

  if (!selected.length) {
    const affordable = matches.find(item => item.price <= limit);
    if (!affordable) {
      return {
        reply: `I couldn't find a matching item within ₹${budget}. Try increasing your budget.`,
        recommendations: []
      };
    }
    selected.push({ quantity: 1, name: affordable.name });
    total = affordable.price;
  }

  return {
    reply: `Here are ${selected.length} menu picks based on your preferences. These are sample menu prices; availability may vary.`,
    recommendations: [{
      items: selected,
      total_price: total,
      ...(budget !== null ? { remaining_budget: budget - total } : {})
    }]
  };
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      message: "QuickBite recommendation API is running",
      endpoint: "POST /chat"
    }));
  }

  if (req.method !== "POST" || req.url !== "/chat") {
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Not found" }));
  }

  let body = "";
  req.on("data", chunk => {
    body += chunk;
    if (body.length > 10000) req.destroy();
  });

  req.on("end", () => {
    try {
      const data = JSON.parse(body || "{}");
      if (typeof data.message !== "string" || !data.message.trim()) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "A message is required" }));
      }

      const result = recommend(data.message.trim().slice(0, 500));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON request" }));
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`QuickBite recommendation API listening on port ${PORT}`);
});
