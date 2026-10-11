const menu = [
  { name: 'Classic Cheese Pizza', price: 350, type: 'veg', tags: ['pizza', 'cheese', 'fast food', 'family'] },
  { name: 'Spicy Zinger Burger', price: 150, type: 'non-veg', tags: ['burger', 'fast food', 'spicy'] },
  { name: 'Hyderabadi Chicken Biryani', price: 250, type: 'non-veg', tags: ['biryani', 'rice', 'spicy', 'family'] },
  { name: 'Butter Chicken', price: 300, type: 'non-veg', tags: ['curry', 'north indian', 'rich'] },
  { name: 'Tandoori Roti & Paneer', price: 200, type: 'veg', tags: ['paneer', 'roti', 'north indian', 'healthy'] },
  { name: 'Dal Makhani', price: 180, type: 'veg', tags: ['dal', 'north indian', 'comfort'] },
  { name: 'Chole Bhature', price: 120, type: 'veg', tags: ['north indian', 'street food', 'snack'] },
  { name: 'Paneer Tikka', price: 220, type: 'veg', tags: ['paneer', 'starter', 'grilled'] },
  { name: 'Masala Dosa', price: 100, type: 'veg', tags: ['south indian', 'light', 'breakfast'] },
  { name: 'Veg Hakka Noodles', price: 140, type: 'veg', tags: ['chinese', 'noodles', 'quick'] },
  { name: 'Gobi Manchurian', price: 160, type: 'veg', tags: ['chinese', 'starter', 'spicy'] },
  { name: 'Spring Rolls', price: 110, type: 'veg', tags: ['chinese', 'starter', 'snack'] },
  { name: 'Chocolate Lava Cake', price: 120, type: 'veg', tags: ['dessert', 'sweet', 'cake'] },
  { name: 'Gulab Jamun', price: 60, type: 'veg', tags: ['sweet', 'dessert', 'snack'] },
  { name: 'Rasmalai', price: 80, type: 'veg', tags: ['sweet', 'dessert', 'milk'] }
];

const chatWindow = document.getElementById('chatWindow');
const promptForm = document.getElementById('promptForm');
const userInput = document.getElementById('userInput');
const exampleChips = document.querySelectorAll('.prompt-chip');

function addMessage(text, sender = 'bot') {
  const message = document.createElement('div');
  message.className = `message ${sender}`;

  if (sender === 'bot') {
    message.innerHTML = `
      <div class="avatar">🤖</div>
      <div class="bubble">${text}</div>
    `;
  } else {
    message.innerHTML = `
      <div class="bubble">${text}</div>
    `;
  }

  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function normalizeNumber(value) {
  const match = String(value).match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function parseRequest(input) {
  const lower = input.toLowerCase();
  const budgetMatch = lower.match(/under\s*₹?\s*(\d+)/) || lower.match(/budget\s*₹?\s*(\d+)/) || lower.match(/\b(\d+)\s*(?:rs|rupees|₹)\b/);
  const peopleMatch = lower.match(/(\d+)\s*(?:people|person|persons|guests|friends)/);
  const vegMatch = /vegetarian|veg|veggie/i.test(lower);
  const nonVegMatch = /non-veg|nonveg|chicken|mutton|fish|egg|meat/i.test(lower);
  const veganMatch = /vegan/i.test(lower);
  const spicyMatch = /spicy|hot|masala/i.test(lower);
  const snackMatch = /snack|starter|light|quick|tiffin/i.test(lower);
  const dessertMatch = /sweet|dessert|cake|gulab|rasmalai/i.test(lower);

  const budget = budgetMatch ? Number(budgetMatch[1]) : null;
  const people = peopleMatch ? Number(peopleMatch[1]) : 1;

  return {
    budget,
    people,
    veg: vegMatch || (!nonVegMatch && !veganMatch),
    nonVeg: nonVegMatch,
    vegan: veganMatch,
    spicy: spicyMatch,
    snack: snackMatch,
    dessert: dessertMatch,
    text: lower
  };
}

function filterMenu(req) {
  const perPersonCap = req.budget ? Math.max(50, Math.floor(req.budget / Math.max(req.people, 1))) : Infinity;

  return menu.filter(item => {
    if (req.budget && item.price > perPersonCap * 1.5) return false;

    if (req.veg && item.type !== 'veg' && !req.nonVeg && !req.vegan) return false;
    if (req.nonVeg && item.type !== 'non-veg') return false;
    if (req.vegan && item.type !== 'veg') return false;

    if (req.spicy && !item.tags.some(tag => ['spicy', 'masala', 'hot'].includes(tag))) {
      const spicyOnly = ['Hyderabadi Chicken Biryani', 'Spicy Zinger Burger', 'Gobi Manchurian'];
      if (!spicyOnly.includes(item.name)) return false;
    }

    if (req.snack && !item.tags.some(tag => ['snack', 'starter', 'light', 'quick', 'breakfast'].includes(tag))) {
      return false;
    }

    if (req.dessert && !item.tags.some(tag => ['sweet', 'dessert', 'cake'].includes(tag))) {
      return false;
    }

    const queryText = req.text;
    if (queryText.includes('pizza') && !item.tags.includes('pizza')) return false;
    if (queryText.includes('burger') && !item.tags.includes('burger')) return false;
    if (queryText.includes('biryani') && !item.tags.includes('biryani')) return false;
    if (queryText.includes('noodles') && !item.tags.includes('noodles')) return false;
    if (queryText.includes('paneer') && !item.tags.includes('paneer')) return false;

    return true;
  });
}

function buildRecommendation(input) {
  const req = parseRequest(input);
  let matches = filterMenu(req);

  if (matches.length === 0) {
    matches = menu.slice().sort((a, b) => a.price - b.price).slice(0, 5);
  }

  matches = matches
    .slice()
    .sort((a, b) => Math.abs(a.price - (req.budget || a.price)) - Math.abs(b.price - (req.budget || b.price)))
    .slice(0, 4);

  const totalBudget = req.budget ? req.budget : matches.reduce((sum, item) => sum + item.price, 0);
  const estimate = matches.reduce((sum, item) => sum + item.price, 0);

  const recommendationText = `
    <h3>Recommended picks for you</h3>
    <ul class="reco-list">
      ${matches
        .map(
          (item) => `
            <li>
              <span class="label">${item.name}</span> — ₹${item.price}
              <div>Best for: ${item.tags.slice(0, 2).join(', ')}</div>
            </li>
          `
        )
        .join('')}
    </ul>
    <div style="margin-top: 12px;">
      <strong>Estimated total:</strong> ₹${estimate} for ${req.people} people
      ${req.budget ? `<br><strong>Budget check:</strong> ${estimate <= req.budget ? 'within your budget' : 'slightly above your budget'}` : ''}
    </div>
  `;

  const summaryLine = `I found options based on your request: ${input}.`;
  return `${summaryLine}<br><br>${recommendationText}`;
}

function handleSubmit(event) {
  event.preventDefault();
  const value = userInput.value.trim();
  if (!value) return;

  addMessage(value, 'user');
  userInput.value = '';

  const reply = buildRecommendation(value);
  setTimeout(() => addMessage(reply, 'bot'), 450);
}

promptForm.addEventListener('submit', handleSubmit);
exampleChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    userInput.value = chip.dataset.prompt;
    promptForm.requestSubmit();
  });
});

window.addEventListener('DOMContentLoaded', () => {
  addMessage('Hi! Tell me your budget, food preferences, and how many people you are ordering for. Example: Suggest a vegetarian meal under ₹250 for two people.', 'bot');
});
