export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const { prompt = '', moduleName = 'allfreecalculators.in', fields = {} } = body;
    const apiKey = context.env.GEMINI_API_KEY || context.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return Response.json({ ok: false, error: 'GEMINI_API_KEY environment variable missing in Cloudflare Pages settings.' }, { status: 500 });
    }
    const finalPrompt = `You are allfreecalculators.in production admin AI. Generate concise, safe, SEO-friendly JSON only.\nModule: ${moduleName}\nExisting fields: ${JSON.stringify(fields)}\nRequest: ${prompt || 'Generate title, description, metaTitle, metaDescription, formula, examples, faqs and validationRules.'}\nReturn valid JSON with keys: title, description, metaTitle, metaDescription, primaryKeyword, formula, examples, faqs, validationRules, notes.`;
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 1400 } })
    });
    const data = await res.json();
    if (!res.ok) return Response.json({ ok: false, error: data?.error?.message || 'Gemini request failed', raw: data }, { status: res.status });
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    let json = null;
    try { json = JSON.parse(text); } catch { json = { notes: text }; }
    return Response.json({ ok: true, text, json });
  } catch (err) {
    return Response.json({ ok: false, error: err.message || 'AI generation failed' }, { status: 500 });
  }
}
