import { GoogleGenAI, Type } from "@google/genai";
import { Exam, Submission, GradingResult, QuestionType } from "../types";

/**
 * LADTEM COMMISSION - Neural Grading Service
 * Uses Gemini-3-Pro for complex academic evaluation.
 */
const getAIClient = () => {
  // Directly using process.env.API_KEY string for initialization as per guidelines
  return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
};

export const gradeSubmission = async (exam: Exam, submission: Submission): Promise<Partial<GradingResult>> => {
  const ai = getAIClient();
  // Using gemini-3-pro-preview for advanced academic reasoning and grading
  const model = 'gemini-3-pro-preview';
  
  const systemInstruction = `You are a senior academic examiner for the Ladtem Commission. 
  Your task is to evaluate student responses based strictly on the provided rubric. 
  
  GRADING LOGIC PRIORITIES:
  1. RUBRIC: If rubric criteria are detailed, use them as the primary evaluation source.
  2. DEFAULT CORRECTNESS: If no detailed rubric is provided, grade based on the number of correct components/answers.
  
  TYPES OF QUESTIONS:
  1. ESSAY: Evaluate depth, critical thinking, and accuracy.
  2. MCQ: pre-defined correct answer. Exact match = Full points. Mismatch = 0 points.
  3. VOICE: Evaluate transcript/audio for clarity, pronunciation, and content accuracy.
  
  Return a JSON result with questionGrades and a finalGrade (0-100).`;

  const promptParts: any[] = [
    { text: `Exam Details: Title: ${exam.title}` },
    { text: `Rubric: ${exam.rubric.length > 0 ? exam.rubric.map(r => `- ${r.name} (Max ${r.maxPoints} pts): ${r.description}`).join('\n') : 'No specific criteria - Use default correctness logic.'}` }
  ];

  const submissionPrompt = submission.answers.map(a => {
    const q = exam.questions.find(q => q.id === a.questionId);
    const isMcq = q?.type === QuestionType.MCQ;
    const correctOption = isMcq ? q?.options?.find(o => o.isCorrect)?.text : 'N/A';
    
    let content = `Question Type: ${q?.type}\nQuestion: ${q?.text}\nStudent Answer Text: ${a.text}`;
    if (isMcq) content += `\nCorrect Answer: ${correctOption}`;
    if (q?.type === QuestionType.VOICE && a.audioData) {
      content += `\n[VOICE DATA ATTACHED]`;
    }
    return content + '\n---';
  }).join('\n');

  promptParts.push({ text: `Questions & Student Answers:\n${submissionPrompt}` });

  submission.answers.forEach(a => {
    if (a.audioData) {
      const base64Data = a.audioData.split(',')[1] || a.audioData;
      promptParts.push({
        inlineData: {
          mimeType: 'audio/webm',
          data: base64Data
        }
      });
    }
  });

  const response = await ai.models.generateContent({
    model,
    contents: { parts: promptParts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questionGrades: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionId: { type: Type.STRING },
                totalScore: { type: Type.NUMBER },
                uncertaintyFlag: { type: Type.BOOLEAN },
                overallFeedback: { type: Type.STRING },
                criteriaGrades: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      criterionId: { type: Type.STRING },
                      score: { type: Type.NUMBER },
                      justification: { type: Type.STRING }
                    },
                    required: ["criterionId", "score", "justification"]
                  }
                }
              },
              required: ["questionId", "totalScore", "uncertaintyFlag", "criteriaGrades"]
            }
          },
          finalGrade: { type: Type.NUMBER }
        },
        required: ["questionGrades", "finalGrade"]
      }
    }
  });

  // Extract string output directly using the .text property as per GenerateContentResponse guidelines
  const rawText = response.text || '{}';
  const resultData = JSON.parse(rawText);

  return {
    ...resultData,
    gradingSource: 'AI'
  };
};