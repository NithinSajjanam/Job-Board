import express from 'express';
import Job from '../models/Job.js';
import auth from '../middleware/auth.js';

const router = express.Router();

function validateJobData(data) {
    const { title, company, location, status } = data;
    if (!title || typeof title !== 'string') return 'Title is required and must be a string';
    if (!company || typeof company !== 'string') return 'Company is required and must be a string';
    if (!location || typeof location !== 'string') return 'Location is required and must be a string';
    if (status && typeof status !== 'string') return 'Status must be a string if provided';
    return null;
}

// Create Job Posting
router.post('/', auth, async (req, res) => {
    const validationError = validateJobData(req.body);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }
    try {
        const job = new Job({
            ...req.body,
            createdBy: req.user.userId
        });
        await job.save();
        res.status(201).json(job);
    } catch (error) {
        console.error('Create job error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get all jobs for user
router.get('/', auth, async (req, res) => {
    try {
        const jobs = await Job.find({ createdBy: req.user.userId });
        res.json(jobs);
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update job
router.patch('/:id', auth, async (req, res) => {
    const validationError = validateJobData(req.body);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }
    try {
        const job = await Job.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user.userId },
            req.body,
            { new: true }
        );
        if (!job) return res.status(404).send();
        res.json(job);
    } catch (error) {
        console.error('Update job error:', error);
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
        console.error('Delete job error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
