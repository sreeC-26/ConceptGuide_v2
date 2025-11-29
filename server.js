import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

import {
  calculateCommonConfusionTypes,
  calculateAverageMasteryByType,
  identifyWeakAreas,
  identifyStrongAreas,
  calculateTotalStudyTime,
  detectLearningTrends,
  extractConceptName,
} from './src/utils/analyzeHistory.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// CORS configuration - allow requests from localhost and Netlify
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Allow all Netlify domains
    if (origin.includes('.netlify.app') || origin.includes('netlify.app')) {
      return callback(null, true);
    }
    
    // Allow specific Netlify URL if set
    if (process.env.NETLIFY_URL && origin === process.env.NETLIFY_URL) {
      return callback(null, true);
    }
    
    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ensureGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
};

// Prompt 1: Generate Five Questions with 5-Level Diagnostic Structure
const GENERATE_QUESTIONS_PROMPT = `You are an expert educational assistant. Based on the selected confusing text and the full PDF context, generate exactly 5 diagnostic questions following this structure:

Selected Text: {selectedText}

Full PDF Content: {fullPdfText}

Generate 5 questions, each targeting a specific diagnostic level:

Level 1 - Vocabulary/Definition: Check if confusion is just unfamiliar terminology. Ask them to explain the key concept in their own words. Keep it conversational and under 20 words.

Level 2 - Purpose/Motivation: Check if they understand WHY this concept exists. What problem does it solve? Why would we need this? Keep it conversational and under 20 words.

Level 3 - Foundation/Prerequisites: Identify missing building blocks. What other concepts do they need to know first? Keep it conversational and under 20 words.

Level 4 - Misconception Check: Find incorrect beliefs blocking understanding. How is this concept different from related concepts students often confuse? Keep it conversational and under 20 words.

Level 5 - Application/Real-world: Check if they can connect abstract to concrete. Give a novel scenario and ask how the concept applies. Keep it conversational and under 20 words.

For each question, also provide 3-5 expected keywords that indicate correct understanding.

Return a JSON array with this exact structure:
[
  {
    "level": 1,
    "type": "Vocabulary/Definition",
    "question": "Question text here (under 20 words, conversational, beginner-friendly)",
    "expectedKeywords": ["keyword1", "keyword2", "keyword3"]
  },
  {
    "level": 2,
    "type": "Purpose/Motivation",
    "question": "Question text here (under 20 words, conversational, beginner-friendly)",
    "expectedKeywords": ["keyword1", "keyword2", "keyword3"]
  },
  {
    "level": 3,
    "type": "Foundation/Prerequisites",
    "question": "Question text here (under 20 words, conversational, beginner-friendly)",
    "expectedKeywords": ["keyword1", "keyword2", "keyword3"]
  },
  {
    "level": 4,
    "type": "Misconception Check",
    "question": "Question text here (under 20 words, conversational, beginner-friendly)",
    "expectedKeywords": ["keyword1", "keyword2", "keyword3"]
  },
  {
    "level": 5,
    "type": "Application/Real-world",
    "question": "Question text here (under 20 words, conversational, beginner-friendly)",
    "expectedKeywords": ["keyword1", "keyword2", "keyword3"]
  }
]

Return ONLY the JSON array, no additional text or explanation.`;

// Endpoint 1: Generate Questions
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { selectedText } = req.body;

    if (!selectedText) {
      return res.status(400).json({ error: 'selectedText is required' });
    }

    const model = ensureGeminiClient();

    const prompt = GENERATE_QUESTIONS_PROMPT.replace('{selectedText}', selectedText || '');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let questions;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        questions = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('Error parsing questions:', parseError);
      console.error('Response text:', text);
      throw new Error('Failed to parse questions from AI response');
    }

    // Validate structure
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions format received');
    }

    // Ensure we have exactly 5 questions with proper structure
    const validatedQuestions = questions.slice(0, 5).map((q, questionIndex) => {
      if (q && typeof q === 'object' && q.question) {
        return {
          level: q.level || questionIndex + 1,
          type: q.type || ['Vocabulary', 'Purpose', 'Foundation', 'Misconception', 'Application'][questionIndex],
          question: q.question,
          expectedKeywords: q.expectedKeywords || [],
        };
      }

      return {
        level: questionIndex + 1,
        type: ['Vocabulary', 'Purpose', 'Foundation', 'Misconception', 'Application'][questionIndex],
        question:
          typeof q === 'string' ? q : `Question ${questionIndex + 1}: Can you explain this in your own words?`,
        expectedKeywords: [],
      };
    });

    while (validatedQuestions.length < 5) {
      const nextIndex = validatedQuestions.length;
      validatedQuestions.push({
        level: nextIndex + 1,
        type: ['Vocabulary', 'Purpose', 'Foundation', 'Misconception', 'Application'][nextIndex],
        question: `Question ${nextIndex + 1}: Can you explain this in your own words?`,
        expectedKeywords: [],
      });
    }

    res.json({ questions: validatedQuestions });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({
      error: 'Failed to generate questions',
      message: error.message,
    });
  }
});

// Endpoint 2: Clean and Organize PDF Content
app.post('/api/clean-pdf-content', async (req, res) => {
  try {
    const { rawText } = req.body;

    if (!rawText) {
      return res.status(400).json({ error: 'rawText is required' });
    }

    const model = ensureGeminiClient();

    const prompt = `You are a document processing assistant. Clean and organize the following extracted PDF text.

Remove:
- Headers and footers (page numbers, dates, journal names repeated on every page)
- Email addresses and author affiliations if they appear multiple times
- Irrelevant metadata
- Excessive whitespace

Organize the content with:
- Clear headings (mark with ## Heading)
- Subheadings (mark with ### Subheading)
- Proper paragraph breaks
- Logical section divisions

Preserve:
- All actual content
- Important author information (once)
- Abstract, introduction, main content, conclusions
- Technical terms and concepts

Raw Text:
${rawText}

Return the cleaned and organized text with proper markdown formatting (## for headings, ### for subheadings). Do not add any explanation, just return the cleaned text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanedText = response.text();

    res.json({ cleanedText });
  } catch (error) {
    console.error('Error cleaning PDF content:', error);
    res.status(500).json({
      error: 'Failed to clean PDF content',
      message: error.message,
    });
  }
});

// Endpoint 3: Generate Learning Insights
app.post('/api/generate-insights', async (req, res) => {
  try {
    const { sessions } = req.body || {};

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return res.status(400).json({ error: 'sessions array is required' });
    }

    const sanitizedSessions = sessions.map((session = {}) => ({
      confusionType: session.confusionType ?? 'Unknown',
      masteryScore:
        session.masteryScore !== undefined && session.masteryScore !== null
          ? Number(session.masteryScore)
          : null,
      timeSpent: Number.isFinite(Number(session.timeSpent)) ? Number(session.timeSpent) : 0,
      timestamp: session.timestamp ?? null,
      fullSelectedText: session.fullSelectedText ?? '',
      selectedText: session.selectedText ?? '',
      pdfName: session.pdfName ?? '',
      conceptName: extractConceptName(session),
    }));

    const commonConfusion = calculateCommonConfusionTypes(sanitizedSessions);
    const averageMasteryByType = calculateAverageMasteryByType(sanitizedSessions);
    const weakAreas = identifyWeakAreas(sanitizedSessions);
    const strongAreas = identifyStrongAreas(sanitizedSessions);
    const totalStudyTime = calculateTotalStudyTime(sanitizedSessions);
    const learningTrends = detectLearningTrends(sanitizedSessions);
    const weeklyStudyTime = learningTrends.recentTotalTime ?? 0;

    const sessionSummaries = sanitizedSessions.map((session, index) => ({
      index: index + 1,
      conceptName: session.conceptName,
      confusionType: session.confusionType,
      masteryScore: session.masteryScore,
      timeSpent: session.timeSpent,
      timestamp: session.timestamp,
    }));

    const insightsContext = {
      commonConfusion,
      averageMasteryByType,
      weakAreas,
      strongAreas,
      totalStudyTime,
      weeklyStudyTime,
      learningTrends,
      sessionSummaries,
    };

    const prompt = `You are an encouraging learning coach helping a student reflect on their study history. Based on the analytics below, create between three and five short insights. Each insight should sound positive, supportive, and action-oriented. Reference specific metrics when helpful and celebrate progress. Keep each insight under two sentences.

Analytics Data:
${JSON.stringify(insightsContext, null, 2)}

Return ONLY a JSON array of strings, for example:
[
  "📊 Insight one...",
  "💡 Insight two..."
]
`;

    const model = ensureGeminiClient();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    const parseInsights = (rawText) => {
      if (!rawText) return null;
      const cleaned = rawText.replace(/```json|```/gi, '').trim();
      try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean).slice(0, 5);
        }
      } catch (error) {
        // Ignore JSON parse errors and try fallback parsing below
      }

      const lines = rawText
        .split(/\n+/)
        .map((line) => line.replace(/^[-*•\d.\s]+/, '').trim())
        .filter(Boolean);

      if (lines.length > 0) {
        return lines.slice(0, 5);
      }

      return null;
    };

    let insights = parseInsights(text);

    if (!insights || insights.length === 0) {
      const fallback = [];

      if (commonConfusion.type) {
        fallback.push(
          `📊 You're most frequently challenged by ${commonConfusion.type} concepts (${commonConfusion.percentage}% of recent sessions). A quick review of the basics can unlock faster progress.`,
        );
      }

      if (strongAreas.length > 0) {
        const topStrong = strongAreas[0];
        fallback.push(
          `💪 ${topStrong.concept} is a standout strength (≈${topStrong.mastery}% mastery). Keep building on this momentum to tackle adjacent topics.`,
        );
      }

      if (weakAreas.length > 0) {
        fallback.push(
          `🎯 Focus next on ${weakAreas
            .map((area) => area.concept)
            .slice(0, 3)
            .join(', ')} — a little more practice will boost confidence here.`,
        );
      }

      const formatStudyMinutes = (minutes) => {
        if (!minutes || minutes <= 0) return null;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        if (hours > 0) {
          return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
        }
        return `${Math.max(mins, 1)} minutes`;
      };

      const weeklyFormatted = formatStudyMinutes(weeklyStudyTime);
      const totalFormatted = formatStudyMinutes(totalStudyTime);

      if (weeklyFormatted) {
        fallback.push(
          `⏱️ You've invested ${weeklyFormatted} of focused study in the past week — that consistency is paying off.`,
        );
      } else if (totalFormatted) {
        fallback.push(
          `⏱️ You've logged ${totalFormatted} of focused study overall — every session builds momentum.`,
        );
      }

      if (learningTrends.trend === 'up') {
        fallback.push('🚀 Your mastery is trending upward this week. Keep riding that wave with another focused session!');
      } else if (learningTrends.trend === 'down') {
        fallback.push('✨ Mastery dipped slightly recently — revisiting earlier wins can help you bounce back quickly.');
      } else {
        fallback.push('🌈 Your learning pace is steady. A small stretch goal could help unlock the next breakthrough.');
      }

      insights = fallback.slice(0, 5);
    }

    res.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      error: 'Failed to generate insights',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Endpoint 4: Analyze and Generate Path (Person 2's combined endpoint)
app.post('/api/analyze-and-generate-path', async (req, res) => {
  try {
    const { selectedText, qaPairs } = req.body;

    console.log('[API] Received request:', {
      hasSelectedText: !!selectedText,
      qaPairsCount: qaPairs?.length,
      qaPairs,
    });

    if (!qaPairs || !Array.isArray(qaPairs) || qaPairs.length === 0) {
      console.error('[API] Missing or invalid qaPairs');
      return res.status(400).json({
        error: 'qaPairs array is required',
        details: 'Please provide an array of question-answer pairs',
      });
    }

    const model = ensureGeminiClient();

    // Step 1: Analyze responses
    const targetConcept = selectedText || 'the concept';
    const questionsAndResponses = qaPairs
      .map((qa, idx) => {
        const q = typeof qa.question === 'string' ? qa.question : qa.question?.question || '';
        const a = qa.answer || '';
        return `Q: "${q}" A: "${a}"`;
      })
      .join('\n\n');

    const analysisPrompt = `You are analyzing a student's understanding based on their answers to 5 diagnostic questions.

Concept: "${targetConcept}"

Questions and Responses:

${questionsAndResponses}

Analyze ALL responses comprehensively and return structured JSON:

{
  "overallAccuracy": 0.65,
  "overallConfidence": 0.55,
  "levelScores": [
    {
      "level": 1,
      "accuracy": 0.7,
      "confidence": 0.6,
      "keywordMatches": ["keyword1", "keyword2"],
      "missingKeywords": ["keyword3"],
      "reasoning": "Student provided basic definition but missed key aspect..."
    }
  ],
  "confusionType": "missing_foundation",
  "secondaryTypes": ["misconception"],
  "specificGaps": ["limits", "instantaneous vs average", "h→0 meaning"],
  "diagnosticSummary": "You understand that derivatives measure rate of change (good!), but you're missing foundational knowledge about limits. You also seem to confuse derivatives with slopes on straight lines, which are different concepts.",
  "prerequisiteConcepts": ["functions", "limits", "slope", "rate of change"]
}

Return only valid JSON, no additional text.`;

    console.log('[API] Calling Gemini for analysis...');
    const analysisResult = await model.generateContent(analysisPrompt);
    const analysisText = analysisResult.response.text();

    console.log('[API] Analysis response received, length:', analysisText.length);

    let analysisJson;
    try {
      const cleanedText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisJson = JSON.parse(cleanedText);
      console.log('[API] Analysis JSON parsed successfully');
    } catch (parseError) {
      console.error('[API] Failed to parse analysis JSON:', parseError);
      console.error('[API] Raw response:', analysisText.substring(0, 500));
      throw new Error('Failed to parse analysis response');
    }

    // Step 2: Generate Mind Map
    const mindMapGapsArray = analysisJson.specificGaps || [];
    const mindMapGapsFormatted =
      mindMapGapsArray.length > 0
        ? `[${mindMapGapsArray.map((gap) => `"${gap}"`).join(', ')}]`
        : '[]';

    const mindMapPrompt = `Generate Dependency Mind Map for a concept a student is struggling with.

Target Concept: "${targetConcept}"
Confusion Type: "${analysisJson.confusionType || 'unknown'}"
Student's Specific Gaps: ${mindMapGapsFormatted}
Student's Current Understanding: "${
      analysisJson.diagnosticSummary || 'Student needs help understanding the concept'
    }"

Generate a prerequisite dependency graph in JSON format with 5-8 nodes:

{
  "nodes": [
    {
      "id": "functions",
      "label": "Understanding Functions",
      "type": "math",
      "importance": 5,
      "depth": 0,
      "description": "A function takes an input, transforms it, and returns an output. Foundation of calculus.",
      "estimatedTime": 5
    }
  ],
  "edges": [
    {
      "source": "functions",
      "target": "limits",
      "strength": "critical",
      "reason": "You need to understand functions before you can understand what happens to them as inputs change"
    }
  ],
  "recommendedPath": ["functions", "limits", "derivatives"]
}

Return only valid JSON, no additional text.`;

    console.log('[API] Calling Gemini for mind map...');
    const mindMapResult = await model.generateContent(mindMapPrompt);
    const mindMapText = mindMapResult.response.text();

    console.log('[API] Mind map response received');

    let mindMapJson;
    try {
      const cleanedText = mindMapText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      mindMapJson = JSON.parse(cleanedText);
      if (!mindMapJson.recommendedPath) {
        mindMapJson.recommendedPath = [];
      }
      console.log('[API] Mind map JSON parsed successfully');
    } catch (parseError) {
      console.error('[API] Failed to parse mind map JSON:', parseError);
      console.error('[API] Raw response:', mindMapText.substring(0, 500));
      const concepts = analysisJson.prerequisiteConcepts || analysisJson.specificGaps || [];
      const nodes = concepts.slice(0, 6).map((conceptName, idx) => {
        const id = conceptName.toLowerCase().replace(/\s+/g, '_');
        return {
          id,
          label: conceptName,
          type: 'theory',
          importance: idx < 2 ? 5 : idx < 4 ? 4 : 3,
          depth: Math.min(idx, 3),
          description: `Foundation concept: ${conceptName}`,
          estimatedTime: 5 + idx * 2,
        };
      });
      const edges = nodes.slice(1).map((node, idx) => ({
        source: nodes[idx].id,
        target: node.id,
        strength: 'critical',
        reason: `${nodes[idx].label} is a prerequisite for ${node.label}`,
      }));
      mindMapJson = {
        nodes,
        edges,
        recommendedPath: nodes.slice(0, Math.min(5, nodes.length)).map((n) => n.id),
      };
    }

    // Step 3: Generate Repair Path
    const allNodes = mindMapJson?.nodes || [];
    const sortedNodes = [...allNodes].sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      return (b.importance || 0) - (a.importance || 0);
    });
    const allNodesArray =
      sortedNodes.length > 0
        ? sortedNodes.map((node) => node.label || node.id)
        : mindMapJson?.recommendedPath || analysisJson.prerequisiteConcepts || [];

    const specificGapsFormatted =
      (analysisJson.specificGaps || []).length > 0
        ? `[${analysisJson.specificGaps.map((gap) => `"${gap}"`).join(', ')}]`
        : '[]';

    const nodesInfo = sortedNodes
      .map(
        (node, idx) =>
          `${idx + 1}. "${node.label || node.id}" (Depth: ${node.depth}, Importance: ${node.importance || 0}/5) - ${
            node.description || 'No description'
          }`,
      )
      .join('\n');

    const summaryOfResponses = qaPairs
      .map((qa, idx) => {
        const q = typeof qa.question === 'string' ? qa.question : qa.question?.question || '';
        const a = qa.answer || '';
        return `Q${idx + 1}: ${q.substring(0, 100)}... A: ${a.substring(0, 150)}...`;
      })
      .join('\n');

    const repairPathPrompt = `Generate Repair Path Cards for a student to master a concept.

Target Concept: "${targetConcept}"
Confusion Type: "${analysisJson.confusionType || 'unknown'}"
Student's Gaps: ${specificGapsFormatted}
Student's Responses: ${summaryOfResponses}

All Concepts from Mind Map (ordered by depth, then importance):
${nodesInfo}

IMPORTANT: The mind map contains ${allNodesArray.length} concepts. You MUST create EXACTLY ${allNodesArray.length} learning cards - ONE for EACH concept in this order: ${allNodesArray.join(' → ')}.

Generate cards in JSON format with exactly ${allNodesArray.length} steps:

{
  "steps": [
    {
      "stepNumber": 1,
      "conceptName": "Understanding Functions",
      "timeEstimate": 8,
      "whyThisStep": "You mentioned 'function' in your response but didn't explain what it means mathematically. Let's start with this foundation.",
      "explanation": "A function is like a machine: you put something in, it does something to it, and gives you something back. In math, we write f(x) where x is the input and f(x) is the output.",
      "visualAid": "f(x) = x²\nInput: 3 → Process: 3² → Output: 9",
      "examples": [
        {
          "title": "Example 1: Simple Function",
          "content": "f(x) = 2x + 1. This function doubles your input and adds 1. So f(3) = 2(3) + 1 = 7."
        }
      ],
      "practiceProblem": {
        "question": "If g(x) = 3x - 2, what is g(4)?",
        "options": ["A) 10", "B) 12", "C) 14", "D) 16"],
        "correctAnswer": "A) 10",
        "explanation": "g(4) = 3(4) - 2 = 12 - 2 = 10"
      },
      "connectionToNext": "Now that you understand functions, we can talk about what happens to functions as their inputs get very close to a specific value—that's called a limit."
    }
  ]
}

Return only valid JSON, no additional text.`;

    console.log('[API] Calling Gemini for repair path...');
    const repairPathResult = await model.generateContent(repairPathPrompt);
    const repairPathText = repairPathResult.response.text();

    console.log('[API] Repair path response received');

    let repairPathJson;
    try {
      // Try multiple parsing strategies
      let cleanedText = repairPathText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to find JSON object in the text
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
      
      const parsed = JSON.parse(cleanedText);
      repairPathJson = Array.isArray(parsed.steps) ? parsed.steps : (Array.isArray(parsed) ? parsed : []);
      
      // Validate that we have proper step data with all required fields
      if (repairPathJson.length === 0) {
        throw new Error('No steps in repair path');
      }
      
      // Validate and ensure each step has all required fields
      repairPathJson = repairPathJson.map((step, idx) => {
        if (!step.conceptName || !step.explanation) {
          throw new Error(`Step ${idx + 1} missing required fields: conceptName or explanation`);
        }
        // Ensure practiceProblem has all fields
        if (step.practiceProblem) {
          if (!step.practiceProblem.question || !step.practiceProblem.options || !step.practiceProblem.correctAnswer) {
            console.warn(`[API] Step ${idx + 1} has incomplete practiceProblem, fixing...`);
            step.practiceProblem = {
              question: step.practiceProblem.question || `Practice question about ${step.conceptName}?`,
              options: step.practiceProblem.options || ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
              correctAnswer: step.practiceProblem.correctAnswer || 'A) Option 1',
              explanation: step.practiceProblem.explanation || `Solution explanation for ${step.conceptName}`,
            };
          }
        }
        return step;
      });
      
      console.log('[API] Repair path JSON parsed successfully, steps:', repairPathJson.length);
      console.log('[API] First step validation:', {
        hasConceptName: !!repairPathJson[0].conceptName,
        hasExplanation: !!repairPathJson[0].explanation,
        hasExamples: !!repairPathJson[0].examples,
        hasPracticeProblem: !!repairPathJson[0].practiceProblem,
        practiceProblemComplete: repairPathJson[0].practiceProblem ? 
          (!!repairPathJson[0].practiceProblem.question && !!repairPathJson[0].practiceProblem.options) : false
      });
    } catch (parseError) {
      console.error('[API] Failed to parse repair path JSON:', parseError);
      console.error('[API] Raw response (first 1000 chars):', repairPathText.substring(0, 1000));
      const fallbackNodes =
        sortedNodes.length > 0
          ? sortedNodes
          : (analysisJson.specificGaps || analysisJson.prerequisiteConcepts || []).map((gap, idx) => ({
              label: gap,
              depth: Math.min(Math.floor(idx / 2), 3),
              importance: 5 - idx,
            }));
      const pathLength = fallbackNodes.length || 3;
      repairPathJson = fallbackNodes.slice(0, pathLength).map((node, idx) => {
        const conceptName = node.label || node.id || node;
        return {
          stepNumber: idx + 1,
          conceptName,
          timeEstimate: node.estimatedTime || 8 + idx * 2,
          whyThisStep: `You need to understand ${conceptName} to build a solid foundation for the target concept.`,
          explanation: `This step focuses on understanding ${conceptName}. ${
            node.description || 'Review the fundamental concepts and practice applying them.'
          }`,
          examples: [
            {
              title: `Example 1: Basic ${conceptName}`,
              content: `A simple example to help you understand ${conceptName}.`,
            },
          ],
          practiceProblem: {
            question: `Practice question about ${conceptName}?`,
            options: ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
            correctAnswer: 'A) Option 1',
            explanation: `Solution explanation for ${conceptName}`,
          },
          connectionToNext:
            idx < pathLength - 1
              ? `Once you understand ${conceptName}, we'll move on to the next concept.`
              : 'Great job! You\'ve completed the learning path.',
        };
      });
    }

    const fullAnalysis = {
      overallAccuracy: analysisJson.overallAccuracy ?? 0.5,
      overallConfidence: analysisJson.overallConfidence ?? 0.5,
      levelScores: analysisJson.levelScores ?? [],
      confusionType: analysisJson.confusionType ?? 'unknown',
      secondaryTypes: analysisJson.secondaryTypes ?? [],
      diagnosticSummary: analysisJson.diagnosticSummary ?? '',
      specificGaps: analysisJson.specificGaps ?? [],
      prerequisiteConcepts: analysisJson.prerequisiteConcepts ?? [],
      mindMap: mindMapJson,
      repairPath: repairPathJson,
    };

    console.log('[API] Sending complete analysis response');
    res.status(200).json(fullAnalysis);
  } catch (error) {
    console.error('Analysis error:', error);

    let errorMessage = 'Failed to analyze session data';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';

    if (error instanceof Error) {
      if (error.message.includes('API_KEY') || error.message.includes('API key')) {
        errorMessage = 'Invalid or missing Gemini API key';
        errorDetails = 'Please check your GEMINI_API_KEY in .env file';
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        errorMessage = 'Gemini model not found';
        errorDetails = 'The model name may be incorrect. Using gemini-1.5-flash';
      }
    }

    res.status(500).json({
      error: errorMessage,
      details: errorDetails,
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
