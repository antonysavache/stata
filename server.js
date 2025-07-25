const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 4200;

// Serve static files from the Angular app build directory
app.use(express.static(path.join(__dirname, 'dist/fake-stat')));

// For any other request, send back the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/fake-stat/index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
