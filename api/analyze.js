export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { resume, jobDescription } = req.body || {};

    if (!resume || !jobDescription) {
      return res.status(400).json({
        error: "Resume and job description are required."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API key is not configured."
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this resume for the following job description. Return useful feedback including an ATS match score, strengths, weaknesses, and improvement suggestions.

RESUME:
${resume}

JOB DESCRIPTION:
${jobDescription}`
            }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Gemini API request failed."
      });
    }

    return res.status(200).json({
      result: data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    });
  } catch (error) {
    return res.status(500).json({
        error: `Server error: ${error.message}`,
    });
  }
}
