import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.replace(/['"]/g, '');
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
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API Error Detail:", JSON.stringify(errorData));
      throw new Error(`AI Engine Error: ${errorData.error?.message || response.statusText}. Please verify your GEMINI_API_KEY.`);
    }

    const data = (await response.json()) as any;
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error(`Gemini Error: No text in response. This often happens if the syllabus is too short or violates safety filters.`);
    }

    // Advanced JSON Extraction
    try {
      // 1. Try direct parse
      const parsed = JSON.parse(resultText);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      try {
        // 2. Try stripping markdown and cleaning
        const cleaned = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
        const start = cleaned.indexOf('[');
        const end = cleaned.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
          const parsed = JSON.parse(cleaned.substring(start, end + 1));
          return Array.isArray(parsed) ? parsed : [parsed];
        }
        throw new Error("No JSON array found in AI response");
      } catch (parseError) {
        console.error("Failed to parse Gemini output. Raw text:", resultText);
        throw new Error("AI returned data in an invalid format. Please try a clearer syllabus.");
      }
    }
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
