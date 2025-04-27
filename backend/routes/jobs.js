const express = require('express');
const Job = require('../models/Job');
const auth = require('../middleware/auth');
const router = express.Router();

// Create Job Posting
router.post('/', auth, async (req, res) => {
    try {
        const job = new Job({
            ...req.body,
            createdBy: req.user.userId
        });
        await job.save();
        res.status(201).json(job);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all jobs for user
router.get('/', auth, async (req, res) => {
    try {
        const jobs = await Job.find({ createdBy: req.user.userId });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update job
router.patch('/:id', auth, async (req, res) => {
    try {
        const job = await Job.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user.userId },
            req.body,
            { new: true }
        );
        if (!job) return res.status(404).send();
        res.json(job);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete job
router.delete('/:id', auth, async (req, res) => {
    try {
        const job = await Job.findOneAndDelete({ 
            _id: req.params.id, 
            createdBy: req.user.userId 
        });
        if (!job) return res.status(404).send();
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
