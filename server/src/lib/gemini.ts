import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-1.5-flash";

export async function analyzeProctoringSnapshot(base64Image: string) {
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not configured. Skipping analysis.");
    return null;
  }

  const base64Data = base64Image.split(",")[1] || base64Image;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    contents: [{
      parts: [
        { text: "Analyze this webcam snapshot from an exam taker. Check for: 1. Multiple people. 2. Mobile phones or restricted items. 3. Candidate looking away from screen excessively. Return JSON with 'suspicious' (boolean), 'reason' (string or null), and 'trustScoreAdjustment' (number, negative if suspicious)." },
        {
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Data
          }
        }
      ]
    }],
    generationConfig: {
      response_mime_type: "application/json",
    }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return resultText ? JSON.parse(resultText) : null;
  } catch (error) {
    console.error("Gemini Analysis failed:", error);
    return null;
  }
}

export async function generateQuestionExplanation(question: string, options: string[], correctIndex: number) {
   if (!GEMINI_API_KEY) return null;

   const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
   const payload = {
      contents: [{
         parts: [{ text: `Explain why option ${options[correctIndex]} is the correct answer for the question: "${question}". Options were: ${options.join(", ")}. Keep it brief and educational for a student.` }]
      }]
   };

   try {
      const response = await fetch(url, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload)
      });
      const data = (await response.json()) as any;
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
   } catch (error) {
      return null;
   }
}

export async function generateBulkQuestionsFromSyllabus(syllabus: string, count: number = 10) {
  if (!GEMINI_API_KEY) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const prompt = `Generate ${count} multiple choice questions based on this syllabus: "${syllabus}".
  Return a JSON array of objects, each with: 'text' (string), 'options' (array of 4 strings), 'correctOptionIndex' (0-3), and 'topic' (string).`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { response_mime_type: "application/json" }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json()) as any;
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return resultText ? JSON.parse(resultText) : null;
  } catch (error) {
    console.error("Bulk AI Generation failed:", error);
    return null;
  }
}

export async function verifyCandidateIdentity(liveSnapshot: string, registrationPhotoUrl: string) {
  if (!GEMINI_API_KEY) return null;

  const liveBase64 = liveSnapshot.split(",")[1] || liveSnapshot;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = "Compare these two images: 1. A live webcam snapshot. 2. A registration photo. Do they belong to the same person? Return JSON with 'match' (boolean) and 'confidence' (number 0-100).";

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: "image/jpeg", data: liveBase64 } },
      ]
    }],
    generationConfig: { response_mime_type: "application/json" }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json()) as any;
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return resultText ? JSON.parse(resultText) : null;
  } catch (error) {
    console.error("Face Match failed:", error);
    return null;
  }
}

export async function generatePersonalizedStudyGuide(performanceData: any) {
  if (!GEMINI_API_KEY) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const prompt = `Based on these exam results: ${JSON.stringify(performanceData)}, create a personalized study guide.
  Identify weak areas (low percentages) and recommend specific topics to focus on. Keep it encouraging and actionable for a student.
  Return JSON with 'summary' (string), 'weakAreas' (array of strings), and 'recommendations' (array of strings).`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { response_mime_type: "application/json" }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json()) as any;
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return resultText ? JSON.parse(resultText) : null;
  } catch (error) {
    console.error("Study Guide Generation failed:", error);
    return null;
  }
}
