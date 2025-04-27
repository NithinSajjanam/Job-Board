const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
require('dotenv').config();

// Importing Routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const atsRoutes = require('./routes/ats');
const interviewPrepRoutes = require('./routes/interviewPrep');

// Middleware
app.use(cors());
app.use(express.json());


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/ats', atsRoutes);
app.use('/api/interview-prep', interviewPrepRoutes);

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error(err));

// Start Server
const PORT = process.env.PORT || 5000;

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));





