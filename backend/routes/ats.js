import express from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import 'dotenv/config';
import pdfjs from 'pdfjs-dist/legacy/build/pdf.js';

pdfjs.GlobalWorkerOptions.workerSrc = path.join(
  process.cwd(),
  'node_modules/pdfjs-dist/build/pdf.worker.js'
);

// --- Configuration ---
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

if (!process.env.GEMINI_API_KEY) {
  console.error('FATAL ERROR: GEMINI_API_KEY is not set in the environment variables.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Optional Safety Settings (currently commented out)
/*
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];
*/

// --- Helper Function ---
const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Error deleting file ${filePath}:`, err);
    });
  }
};

// --- Main AI Analysis Route ---
router.post('/analyze-ai', upload.single('resume'), async (req, res) => {
  const tempFilePath = req.file?.path;

  try {
    const jobDesc = req.body.jobDescription;
    const analysisType = req.body.analysisType || 'resumeAnalysis';

    if (!jobDesc) {
      cleanupFile(tempFilePath);
      return res.status(400).json({ error: 'Job description is required.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required.' });
    }

    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase();
    const fileBuffer = fs.readFileSync(file.path);
    let resumeText = '';

    // --- Resume Text Extraction ---
    if (ext === '.pdf') {
      const pdfData = new Uint8Array(fileBuffer);
      const pdf = await pdfjs.getDocument({ data: pdfData }).promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str || '').join(' ');
        fullText += pageText + '\n';
      }
      resumeText = fullText;
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      resumeText = result.value;
    } else {
      cleanupFile(tempFilePath);
      return res.status(400).json({ error: 'Unsupported file type. Please upload PDF or DOCX.' });
    }

    if (!resumeText.trim()) {
      cleanupFile(tempFilePath);
      return res.status(400).json({ error: 'Could not extract text from the resume.' });
    }

    // --- Prompt Generation ---
    let prompt = '';
    if (analysisType === 'interviewQuestions') {
      prompt = `
Generate a list of 5-7 personalized interview questions based on the following resume and job description. Focus on verifying the candidate's skills and experience mentioned in the resume as they relate to the job requirements. Output ONLY the numbered list of questions.

Resume Text:
---
${resumeText}
---

Job Description:
---
${jobDesc}
---

Questions:
`;
    } else {
      prompt = `
Analyze the following resume against the job description. Provide:
1. Match Percentage (e.g., "Match Percentage: 85%").
2. Key Strengths: A bulleted list of the candidate's relevant skills/experiences found in the resume that match the job description.
3. Missing Keywords/Skills: A bulleted list of important keywords or skills mentioned in the job description that are NOT clearly present in the resume.
4. Brief Summary: A short (1-2 sentence) summary of the candidate's fit for the role.

Resume Text:
---
${resumeText}
---

Job Description:
---
${jobDesc}
---

Analysis:
`;
    }

    // --- Gemini API Call ---
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      // safetySettings, // Uncomment if needed
    });

    const apiResult = await model.generateContent(prompt);
    const response = apiResult.response;

    let aiText = '';
    if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      aiText = response.candidates[0].content.parts[0].text;
    } else if (response?.candidates?.[0]?.finishReason !== 'STOP') {
      aiText = `AI generation finished unexpectedly. Reason: ${response.candidates[0].finishReason}`;
      console.warn(`Gemini generation finish reason: ${response.candidates[0].finishReason}`);
    } else {
      aiText = "Error: Could not retrieve analysis from AI.";
      console.error('Gemini API returned an unexpected structure:', JSON.stringify(response));
    }

    cleanupFile(tempFilePath);

    res.json(analysisType === 'interviewQuestions'
      ? { interviewQuestions: aiText }
      : { result: aiText });

  } catch (err) {
    console.error('Error during analysis:', err);
    cleanupFile(tempFilePath);
    const isNetworkError = err.message?.includes('axios') || err.message?.includes('fetch');
    res.status(isNetworkError ? 502 : 500).json({
      error: isNetworkError ? 'AI service communication failed' : 'AI analysis failed',
      details: err.message,
    });
  }
});

export default router;
