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

router.post('/interview-questions', upload.single('resume'), async (req, res) => {
  try {
    const jobDesc = req.body.jobDescription;
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

    const prompt = `
You are an AI interview coach. Based on the following resume and job description, generate a list of personalized interview questions that focus on the applicant's skills and experience.

Resume:
${resumeText}

Job Description:
${jobDesc}

Please provide the questions as a numbered list.
`;

    console.log('Interview question prompt:', prompt);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiText = await response.text();

      console.log('Raw Gemini API response:', aiText);

      fs.unlinkSync(file.path); // clean up
      res.json({ interviewQuestions: aiText });
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
    console.error('Gemini AI interview question generation failed:', err);
    res.status(500).json({ error: 'Gemini AI interview question generation failed' });
  }
});

module.exports = router;
