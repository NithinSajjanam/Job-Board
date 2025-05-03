import 'dotenv/config';

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
// Use the build intended for Node.js environments if possible, often just 'pdfjs-dist/build/pdf.js'
// Sticking with legacy for now as per your original code.
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import path from 'path';
import { fileURLToPath } from 'url'; // Needed for __dirname in ESM

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`[index.js @ TOP] GOOGLE_API_KEY Check (using path): ${process.env.GOOGLE_API_KEY ? 'LOADED!' : '!!! NOT FOUND !!!'}`);

// Initialize express app
const app = express();

// --- pdfjs-dist Worker Configuration ---
// For server-side usage like this, pdfjs-dist often *doesn't* strictly require
// setting GlobalWorkerOptions.workerSrc, as it might run synchronously or manage
// its own worker process differently than in a browser.
// However, if you encounter errors specifically asking for the worker, you might need it.
// pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(__dirname, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.js');
// ^^ Using an absolute path might be more reliable if needed.

// --- Static Serving ---
// This serves files directly from the node_modules directory.
// It's generally needed if a *client/browser* needs to fetch the worker script.
// If only the server-side '/api/parse-pdf' route uses pdfjs-dist, this *might*
// not be strictly necessary for the parsing itself, but doesn't hurt.
// It allows a browser (if you have a frontend served by this server) to potentially fetch '/pdf.worker.js'.
const pdfjsLegacyBuildPath = path.resolve(__dirname, 'node_modules', 'pdfjs-dist', 'legacy', 'build');
app.use(express.static(pdfjsLegacyBuildPath));
console.log(`Serving static files from: ${pdfjsLegacyBuildPath}`); // Log path for verification


// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json({ limit: '50mb' })); // Increase limit for potentially large base64 PDF data
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // For form data, also increase limit


// --- API Routes ---
// Ensure these files exist and correctly export Express routers
try {
    const authRoutes = (await import('./routes/auth.js')).default;
    const jobRoutes = (await import('./routes/jobs.js')).default;
    const atsRoutes = (await import('./routes/ats.js')).default;
    const interviewPrepRoutes = (await import('./routes/interviewPrep.js')).default;

    app.use('/api/auth', authRoutes);
    app.use('/api/jobs', jobRoutes);
    app.use('/api/ats', atsRoutes);
    app.use('/api/interview-prep', interviewPrepRoutes);
} catch (routeError) {
    console.error("❌ Failed to load routes:", routeError);
    // Optionally exit if routes are critical
    // process.exit(1);
}


// --- PDF Parsing Route ---
app.post('/api/parse-pdf', async (req, res) => {
    // Basic validation
    if (!req.body || typeof req.body.data !== 'string' || req.body.data.length === 0) {
        return res.status(400).json({ error: 'Missing or invalid PDF data in request body (expected non-empty base64 string in "data" field)' });
    }
    console.log('Received PDF parsing request...');

    try {
        // Decode Base64
        const pdfBuffer = Buffer.from(req.body.data, 'base64');
        console.log(`PDF buffer created, size: ${pdfBuffer.length} bytes`);

        // --- Using pdfjs-dist ---
        const pdfData = new Uint8Array(pdfBuffer); // pdfjs expects Uint8Array
        const loadingTask = pdfjsLib.getDocument({
             data: pdfData,
             // Optional: Provide a password if PDFs are encrypted
             // password: 'pdf_password',
        });
        const pdf = await loadingTask.promise;
        console.log(`PDF loaded successfully, pages: ${pdf.numPages}`);

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // Filter out potential null/undefined items and join
            const pageText = textContent.items.map(item => item?.str || '').join(' ');
            fullText += pageText + '\n'; // Use actual newline character
            // Optional: Clean up page resources if memory becomes an issue
            // page.cleanup();
        }
        // --- End using pdfjs-dist ---

        console.log('PDF text extracted successfully.');
        res.json({ text: fullText.trim() }); // Send extracted text

    } catch (error) {
        console.error('❌ PDF parse error:', error);
        let errorMessage = 'Failed to parse PDF.';
        if (error.name === 'PasswordException') {
            errorMessage = 'Incorrect password or password required for PDF.';
        } else if (error.name === 'InvalidPDFException') {
            errorMessage = 'Invalid or corrupted PDF file.';
        }
        res.status(500).json({ error: errorMessage, details: error.message });
    }
});


// --- Generic Not Found Handler (Place after all routes) ---
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});

// --- Global Error Handling Middleware (Place last) ---
app.use((err, req, res, next) => {
    console.error("❌ Unhandled Error:", err.stack || err);
    // Avoid sending detailed stack trace in production
    const statusCode = err.status || 500;
    const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err.message || 'Something went wrong!');
    res.status(statusCode).json({ error: message });
});


// --- MongoDB Connection ---
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
    console.error('❌ FATAL ERROR: MONGODB_URI is not defined in environment variables.');
    process.exit(1); // Exit if DB connection string is missing
}

mongoose.connect(mongoUri, {
    // Remove deprecated options if using Mongoose v6+
    // useNewUrlParser: true,  // Deprecated
    // useUnifiedTopology: true // Deprecated
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit if initial connection fails
});

// Handle connection errors after initial connection
mongoose.connection.on('error', err => {
  console.error('❌ MongoDB runtime error:', err);
});


// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Optional: Graceful shutdown handling
process.on('SIGINT', async () => {
    console.log('\n🔌 SIGINT received, shutting down gracefully...');
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed.');
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n🔌 SIGTERM received, shutting down gracefully...');
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed.');
    process.exit(0);
});