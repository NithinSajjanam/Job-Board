import express from 'express';
import multer from 'multer';
import path from 'path';
// import fs from 'fs'; // No longer needed if using async only
import { readFile, unlink } from 'fs/promises'; // Use async file operations
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'; // Ensure path is correct
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// --- Google AI Client Initialization ---
// NOTE: Assumes dotenv.config() was run in the main server file BEFORE this file was imported.
if (!process.env.GOOGLE_API_KEY) {
    // This check prevents the AI client from being created without a key.
    console.error("❌ Configuration Error: GOOGLE_API_KEY environment variable not set when initializing interviewRoutes.js.");
    // Throwing here will likely stop the server startup process if this module is imported directly
    throw new Error("GOOGLE_API_KEY environment variable not set.");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Optional: Configure generation settings and safety filters
const generationConfig = {
    // temperature: 0.7,
    // maxOutputTokens: 1024,
};
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Use the recommended 'gemini-pro' model
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash-latest',
    // generationConfig, // Uncomment to use specific config
    // safetySettings    // Uncomment to use safety settings
});

// --- Router Setup ---
const router = express.Router();

// --- Multer Setup for File Uploads ---
// Store uploads in a temporary directory. Consider limits/storage engines for production.
const upload = multer({ dest: 'uploads/' });

// --- Helper Function to Clean and Parse AI JSON Response ---
function cleanAndParseJson(rawResponse) {
    console.log("Attempting to clean and parse raw AI response."); // Log entry
    let cleaned = rawResponse.trim();

    // Remove Markdown code fences (```json ... ``` or ``` ... ```)
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7).trim(); // Remove ```json and trim potential newline
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3).trim(); // Remove ``` and trim potential newline
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3).trim(); // Remove trailing ```
    }

    // Sometimes the model might add extraneous text *before* the JSON starts
    // Try finding the first '{' or '['
    const firstBracket = cleaned.indexOf('[');
    const firstBrace = cleaned.indexOf('{');
    let startIndex = -1;

    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
        startIndex = firstBracket;
    } else if (firstBrace !== -1) {
        startIndex = firstBrace;
    }

    if (startIndex > 0) {
         console.warn(`Potential extraneous text found before JSON start. Trimming ${startIndex} characters.`);
         cleaned = cleaned.substring(startIndex);
    } else if (startIndex === -1) {
         // If no '{' or '[' found at all, it's definitely not JSON
         throw new Error("Response does not appear to contain JSON data (missing starting '[' or '{').");
    }


    try {
        return JSON.parse(cleaned);
    } catch (parseError) {
        console.error("JSON Parsing failed after cleaning.");
        // Throw a new error to be caught by the main handler, including the original error reason
        throw new Error(`Failed to parse cleaned AI response as JSON: ${parseError.message}`);
    }
}

// --- Route Handler: POST /api/interview-questions ---
router.post('/interview-questions', upload.single('resume'), async (req, res, next) => { // Added next for potential global error handler
    let tempFilePath = null; // Keep track of file path for cleanup

    console.log("Received request for /interview-questions");

    try {
        if (!req.file) {
            console.log("Request rejected: No file uploaded.");
            return res.status(400).json({ error: 'No file uploaded. Please include a \'resume\' file in your request.' });
        }
        tempFilePath = req.file.path; // Assign path for cleanup

        const ext = path.extname(req.file.originalname).toLowerCase();
        let extractedText = '';

        console.log(`Processing file: ${req.file.originalname} (path: ${tempFilePath}, type: ${ext})`);

        // === File Text Extraction ===
        if (ext === '.pdf') {
            const fileBuffer = await readFile(tempFilePath);
            const pdfData = new Uint8Array(fileBuffer);

            // IMPORTANT NOTE for Node.js usage of pdfjs-dist:
            // Depending on your environment/bundler, you *might* need to explicitly set the worker source.
            // If you encounter errors related to 'WorkerMessageHandler', try uncommenting and adjusting the path:
            // import { fileURLToPath } from 'url';
            // const __filename = fileURLToPath(import.meta.url);
            // const __dirname = path.dirname(__filename);
            // pdfjsLib.GlobalWorkerOptions.workerSrc = path.resolve(__dirname, '../../node_modules/pdfjs-dist/build/pdf.worker.js');
            // Or copy pdf.worker.js to your public/dist folder and point there.

            const loadingTask = pdfjsLib.getDocument({ data: pdfData });
            const pdf = await loadingTask.promise;
            console.log(`PDF loaded with ${pdf.numPages} pages.`);

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                // Join items, ensuring spaces between words that might span items
                const pageText = content.items.map(item => item.str).join(' ');
                extractedText += pageText + '\n'; // Add newline between pages
            }
            console.log(`Extracted ${extractedText.length} characters from PDF.`);

        } else if (ext === '.txt') {
            extractedText = await readFile(tempFilePath, 'utf8');
            console.log(`Extracted ${extractedText.length} characters from TXT.`);
        }
        // Add more 'else if' blocks here for other formats (e.g., .docx using mammoth.js)
        else {
            console.warn(`Unsupported file type attempted: ${ext}`);
            // Clean up the unsupported file before sending the response
            await unlink(tempFilePath);
            tempFilePath = null; // Prevent cleanup in finally block
            return res.status(400).json({ error: `Unsupported file type: '${ext}'. Please upload a PDF or TXT file.` });
        }

        extractedText = extractedText.trim();
        if (!extractedText) {
            console.warn('No text could be extracted from the file.');
            return res.status(400).json({ error: 'Could not extract any text content from the uploaded file.' });
        }

        // === Generate Content with Google AI ===
        const prompt = `
Based *strictly* on the resume content provided below, generate exactly 10 technical interview questions relevant to the skills and experience listed, along with ideal, concise answers for each. Focus on technical skills, tools, methodologies, and project experiences mentioned. Do not invent skills or experiences not present.

Resume Content:
---
${extractedText}
---

Format the output *only* as a valid JSON array of objects. Each object must have exactly two keys: "question" (string) and "answer" (string).

Example Format:
[
  {
    "question": "Can you elaborate on your experience with [Specific Skill/Tool from Resume, e.g., React] as mentioned in the [Project Name or Context from Resume]?",
    "answer": "In the [Project Name or Context], I utilized [Specific Skill/Tool] to [Action Verb, e.g., develop, implement, optimize] [Component/Feature]. For instance, I [Specific task or achievement related to the skill]."
  },
  {
    "question": "Describe a technical challenge you faced while working with [Technology from Resume, e.g., Node.js] and how you resolved it.",
    "answer": "A challenge involved [Brief description of problem]. I addressed it by [Your approach/solution, e.g., implementing caching, refactoring the code, using a specific algorithm], which resulted in [Positive outcome, e.g., improved performance by X%, reduced errors]."
  }
  // ... generate exactly 10 such objects total
]

Ensure the entire output is *only* the JSON array, starting with '[' and ending with ']'. Do not include any introductory text, explanations, apologies, or markdown formatting like \`\`\`json before or after the array.
`;

        console.log('Sending prompt to Google Generative AI...');
        const result = await model.generateContent(prompt);
        // Always access the response object first
        const response = await result.response;

        if (!response) {
            // This case might indicate an issue before content generation (e.g., safety block immediately)
             console.error('❌ No response object received from the Generative AI model.');
             // Check if there are prompt feedback details
             if (result.promptFeedback) {
                console.error('Prompt Feedback:', JSON.stringify(result.promptFeedback, null, 2));
                const blockReason = result.promptFeedback?.blockReason;
                const safetyRatings = result.promptFeedback?.safetyRatings;
                return res.status(400).json({
                    error: `Content generation blocked. Reason: ${blockReason || 'Unknown'}. Check safety settings or prompt content.`,
                    details: safetyRatings
                });
             }
            throw new Error('No response received from the Generative AI model.');
        }

        // Access the text content safely
        const rawTextResponse = response.text(); // Use the text() method
        console.log('Received raw response from AI.');
        // console.log('Raw AI Response Snippet:', rawTextResponse.substring(0, 200) + '...'); // Log snippet only for debugging

        let questionsAndAnswers;
        try {
            questionsAndAnswers = cleanAndParseJson(rawTextResponse);
            console.log('Successfully parsed AI response.');
        } catch (parseError) {
            console.error('❌ Failed to parse AI response as JSON:', parseError.message);
            console.error('Raw response that failed parsing:', rawTextResponse); // Log the problematic raw response
            // Send a specific error indicating the format issue
            return res.status(500).json({
                error: 'The AI response was not in the expected JSON format, even after cleaning. Please try again later or adjust the prompt.',
                details: parseError.message,
                // rawResponse: rawTextResponse // Optionally send raw response back ONLY for trusted debugging environments
            });
        }

        // === Validate Parsed Structure ===
        if (!Array.isArray(questionsAndAnswers) || questionsAndAnswers.length === 0 || questionsAndAnswers.some(item => typeof item !== 'object' || item === null || typeof item.question !== 'string' || typeof item.answer !== 'string')) {
            console.error('❌ Parsed AI response does not match expected structure (Array of {question: string, answer: string}).');
            console.error('Parsed data:', JSON.stringify(questionsAndAnswers, null, 2)); // Log the invalid structure
            return res.status(500).json({
                error: 'The AI response structure was invalid, even after parsing. Expected an array of objects with "question" and "answer" strings.',
                // parsedData: questionsAndAnswers // Optionally send for debugging
            });
        }

        console.log(`Successfully generated ${questionsAndAnswers.length} questions.`);
        res.status(200).json({ questionsAndAnswers }); // Send the final result

    } catch (error) {
        console.error('❌ Error processing /interview-questions:', error); // Log the full error server-side

        // Determine a user-friendly error message
        let errorMessage = 'An unexpected error occurred while generating interview questions.';
        let statusCode = 500;

        // Check for specific Google API errors (like API key invalid, quota exceeded, etc.)
        if (error.message && error.message.includes('API key not valid')) {
            errorMessage = "Google API Key configuration error. Please contact the administrator.";
            // Don't reveal details about the key itself
        } else if (error.message && error.message.includes('quota')) {
            errorMessage = "API usage quota exceeded. Please try again later.";
            statusCode = 429; // Too Many Requests
        } else if (error.message && error.message.includes('Content generation stopped')) {
             errorMessage = "Content generation was stopped, possibly due to safety settings or prompt issues.";
             statusCode = 400; // Bad Request might be appropriate
        } else if (error instanceof multer.MulterError) {
            errorMessage = `File upload error: ${error.message}`;
            statusCode = 400;
        }
        // Add more specific error checks if needed

        // Send the error response
        res.status(statusCode).json({ error: errorMessage });

        // Optionally pass to a global error handler if configured in server.js
        // next(error);

    } finally {
        // --- Cleanup Uploaded File ---
        if (tempFilePath) {
            try {
                await unlink(tempFilePath);
                console.log(`Deleted temporary file: ${tempFilePath}`);
            } catch (unlinkError) {
                // Log cleanup failure but don't overwrite the original error response
                console.error(`⚠️ Failed to delete temporary file ${tempFilePath}:`, unlinkError);
            }
        }
    }
});

// Export the router
export default router;