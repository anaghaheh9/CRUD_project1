const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// In-memory data store (resets whenever the server restarts)
let items = [
  { id: 1, name: 'Book', price: 250 },
  { id: 2, name: 'Pen', price: 25 },
];
let nextId = 3;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Validate and normalise a request body. Returns { data } or { errors }.
function validate(body = {}) {
  const errors = {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const price = typeof body.price === 'string' && body.price.trim() === '' ? NaN : Number(body.price);
  if (!name) errors.name = 'Enter an item name.';
  else if (name.length > 60) errors.name = 'Keep the name under 60 characters.';
  if (!Number.isFinite(price)) errors.price = 'Enter a price as a number.';
  else if (price < 0) errors.price = 'Price cannot be negative.';
  else if (price > 10000000) errors.price = 'Price is too high.';
  return Object.keys(errors).length
    ? { errors }
    : { data: { name, price: Math.round(price * 100) / 100 } };
}

const findIndex = (req) => items.findIndex((i) => i.id === Number(req.params.id));
const notFound = (res) => res.status(404).json({ error: 'Item not found. It may have been deleted already.' });

// READ all (optional ?search=)
app.get('/api/items', (req, res) => {
  const q = String(req.query.search || '').trim().toLowerCase();
  res.json(q ? items.filter((i) => i.name.toLowerCase().includes(q) || String(i.id).includes(q)) : items);
});

// READ one
app.get('/api/items/:id', (req, res) => {
  const idx = findIndex(req);
  idx === -1 ? notFound(res) : res.json(items[idx]);
});

// CREATE
app.post('/api/items', (req, res) => {
  const { data, errors } = validate(req.body);
  if (errors) return res.status(400).json({ error: 'Check the highlighted fields.', fields: errors });
  const item = { id: nextId++, ...data };
  items.push(item);
  res.status(201).json(item);
});

// UPDATE
app.put('/api/items/:id', (req, res) => {
  const idx = findIndex(req);
  if (idx === -1) return notFound(res);
  const { data, errors } = validate(req.body);
  if (errors) return res.status(400).json({ error: 'Check the highlighted fields.', fields: errors });
  items[idx] = { ...items[idx], ...data };
  res.json(items[idx]);
});

// DELETE
app.delete('/api/items/:id', (req, res) => {
  const idx = findIndex(req);
  if (idx === -1) return notFound(res);
  const [removed] = items.splice(idx, 1);
  res.json(removed);
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API route.' }));
app.use((err, req, res, next) => {
  const bad = err.type === 'entity.parse.failed';
  res.status(bad ? 400 : 500).json({ error: bad ? 'Request body is not valid JSON.' : 'Something went wrong on the server.' });
});

app.listen(PORT, () => console.log(`STOCKROOM running at http://localhost:${PORT}`));
