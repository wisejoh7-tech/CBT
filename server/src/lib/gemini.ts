import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.replace(/['"]/g, '');
const GEMINI_MODEL = "gemini-1.5-flash";

async function safeFetchJson<T = any>(res: Response): Promise<T | null> {
  try {
    const text = await res.text();
    if (!text || text.trim().length === 0) return null;
    return JSON.parse(text) as T;
  } catch (e) {
    console.error("Failed to parse Gemini response body as JSON:", e);
    return null;
  }
}

function safeParseTextJson<T = any>(text: string | null | undefined): T | null {
  if (!text || typeof text !== 'string' || text.trim().length === 0) return null;
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    try {
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const startObj = cleaned.indexOf('{');
      const endObj = cleaned.lastIndexOf('}');
      if (startObj !== -1 && endObj !== -1) {
        return JSON.parse(cleaned.substring(startObj, endObj + 1)) as T;
      }
      const startArr = cleaned.indexOf('[');
      const endArr = cleaned.lastIndexOf(']');
      if (startArr !== -1 && endArr !== -1) {
        return JSON.parse(cleaned.substring(startArr, endArr + 1)) as T;
      }
    } catch {
      console.error("Failed to parse extracted JSON block:", text);
    }
    return null;
  }
}

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

    const data = await safeFetchJson<{ candidates?: any[] }>(response);
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return safeParseTextJson(resultText);
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
      const data = await safeFetchJson<{ candidates?: any[] }>(response);
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
   } catch (error) {
      return null;
   }
}

export async function generateBulkQuestionsFromSyllabus(syllabus: string, count: number = 10) {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing");
    return null;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const prompt = `Generate exactly ${count} multiple choice questions based on this syllabus: "${syllabus}".
  Provide the output strictly as a JSON array of objects.
  Each object MUST have these exact keys: 'text' (the question), 'options' (array of 4 strings), 'correctOptionIndex' (integer 0-3), and 'topic' (a short category string).`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.7
    }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = (await safeFetchJson(response)) as { error?: { message?: string } } | null;
      console.error("Gemini API Error Detail:", JSON.stringify(errorData));
      throw new Error(`AI Engine Error: ${errorData?.error?.message || response.statusText}. Please verify your GEMINI_API_KEY.`);
    }

    const data = await safeFetchJson<{ candidates?: any[] }>(response);
    let resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error(`Gemini Error: No text in response. This often happens if the syllabus is too short or violates safety filters.`);
    }

    const parsed = safeParseTextJson(resultText);
    if (parsed) {
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    throw new Error("AI returned data in an invalid format. Please try a clearer syllabus.");
  } catch (error: any) {
    console.error("Bulk AI Generation Critical Failure:", error.message);
    throw error;
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
    const data = await safeFetchJson<{ candidates?: any[] }>(response);
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return safeParseTextJson(resultText);
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
    const data = await safeFetchJson<{ candidates?: any[] }>(response);
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return safeParseTextJson(resultText);
  } catch (error) {
    console.error("Study Guide Generation failed:", error);
    return null;
  }
}
