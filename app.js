const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const connectRoutes = require('./routes/BaseRoute');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', connectRoutes);

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
