require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY not set in environment');
  throw new Error('Server configuration error: missing GEMINI_API_KEY');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Unified analyze-ai endpoint with optional analysisType parameter
router.post('/analyze-ai', upload.single('resume'), async (req, res) => {
  try {
    const jobDesc = req.body.jobDescription;
    const analysisType = req.body.analysisType || 'resumeAnalysis'; // default to resumeAnalysis
    if (!jobDesc) {
      return res.status(400).json({ error: 'Job description is required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' });
    }

    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase();
    const fileBuffer = fs.readFileSync(file.path);
    let resumeText = '';

    if (ext === '.pdf') {
      const pdfData = await pdfParse(fileBuffer);
      resumeText = pdfData.text;
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      resumeText = result.value;
    } else {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Unsupported file type. Please upload PDF or DOCX.' });
    }

    let prompt = '';
    if (analysisType === 'interviewQuestions') {
      prompt = `
You are an AI interview coach. Based on the following resume and job description, generate a list of personalized interview questions that focus on the applicant's skills and experience.

Resume:
${resumeText}

Job Description:
${jobDesc}

Please provide the questions as a numbered list.
`;
    } else {
      // Default to resume analysis
      prompt = `
Compare the following resume and job description. 
Give a match percentage, strengths, and list missing skills/keywords.

Resume:
${resumeText}

Job Description:
${jobDesc}
`;
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiText = await response.text();

      fs.unlinkSync(file.path); // clean up

      if (analysisType === 'interviewQuestions') {
        res.json({ interviewQuestions: aiText });
      } else {
        res.json({ result: aiText });
      }
    } catch (apiErr) {
      console.error('Gemini API call failed:', apiErr);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Gemini API call failed' });
    }
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Gemini AI analysis failed:', err);
    res.status(500).json({ error: 'Gemini AI analysis failed' });
  }
});

router.get('/list-models', async (req, res) => {
  try {
    const models = await genAI.listModels();
    res.json(models);
  } catch (err) {
    console.error('Error listing models:', err);
    res.status(500).json({ error: 'Failed to list models' });
  }
});

module.exports = router;
