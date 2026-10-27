
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { resume, jobDescription } = req.body || {};

    if (
      typeof resume !== "string" ||
      typeof jobDescription !== "string" ||
      !resume.trim() ||
      !jobDescription.trim()
    ) {
      return res.status(400).json({
        error: "Resume and job description are required."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in Vercel."
      });
    }

    const prompt = `
You are an expert resume and ATS career coach.

Analyze the resume against the job description.
Return only a valid JSON object with these fields:
{
  "ats_score": 75,
  "summary": "A specific overall assessment",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "missing_keywords": ["Keyword 1", "Keyword 2"],
  "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"]
}

Use an integer ats_score between 0 and 100.
Use actual skills and requirements from the supplied text.
Do not invent qualifications or experience.

RESUME:
${resume}

JOB DESCRIPTION:
${jobDescription}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data.error);
      return res.status(response.status).json({
        error: data.error?.message || "Gemini API request failed."
      });
    }

    const result =
      data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!result) {
      return res.status(502).json({
        error: "Gemini returned an empty response."
      });
    }

    return res.status(200).json({ result });
  } catch (error) {
    console.error("Analysis error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error."
    });
  }
}

