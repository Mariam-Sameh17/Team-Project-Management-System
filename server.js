const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE
mongoose
  .connect(DB)
  .then(() => console.log('Connected to database'));

app.listen(3000, () => {
  console.log(`App running on port 3000`);
});
