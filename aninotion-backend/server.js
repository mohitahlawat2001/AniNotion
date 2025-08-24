const express = require('express');
const logTestRouter = require("./routes/log-test");
const cronRouter = require("./routes/cron");
const requestLogger = require("./middleware/logging");
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/database');
const categoryRoutes = require('./routes/categories');
const postRoutes = require('./routes/posts');

const app = express();
app.use(requestLogger());
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ limit: '50mb',extended: true }));

// Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/posts', postRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'AniNotion API is running!' });
});

app.use("/", logTestRouter);
app.use("/cron", cronRouter);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});