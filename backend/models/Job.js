import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Applied', 'Interview', 'Rejected', 'Hired', 'Open'],
        default: 'Open'
    },
    applicationStatus: {
        type: String,
        enum: ['Not Applied', 'Applied', 'Interview Scheduled', 'Offer Received', 'Rejected'],
        default: 'Not Applied'
    }
}, { timestamps: true });

export default mongoose.model('Job', jobSchema);
