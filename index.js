const express = require('express');
const app = express();

// Example route
app.get('/api/hello', (req, res) => {
  res.json({ msg: 'Hello from backend!' });
});

// Pick port: use PORT env variable if set, otherwise default to 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
