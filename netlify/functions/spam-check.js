exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { name, email, message } = JSON.parse(event.body);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system: `You are an AI content and spam filter for a professional data scientist's portfolio contact form. Your job is to analyze the name, email, and message and decide if the message should be allowed through.

Analyze across these dimensions:
1. SPAM PATTERNS: generic mass outreach, bot-generated text, copy-paste templates, unsolicited promotions, SEO link building requests, irrelevant advertisements
2. SUSPICIOUS SIGNALS: obviously fake names (like "aaa", "xxxxx", "test user"), placeholder emails (test@test.com, fake@fake.com, asdf@asdf.com, 123@123.com), incoherent or gibberish text
3. UNSAFE WORDING: threats, harassment, hate speech, abusive language, inappropriate requests
4. INTENT MISMATCH: messages completely unrelated to professional contact (e.g. trying to sell something unrelated, scam attempts)

ALWAYS ALLOW: genuine job opportunities, recruiter outreach, collaboration requests, project inquiries, feedback, questions about her work, networking messages, even short sincere ones like "Hi, I came across your portfolio and wanted to connect."

Be thoughtful and lenient. Only block clear and obvious violations. If you are unsure, let it through.

Respond ONLY with valid JSON. No extra text. No markdown. Format: {"pass": true} or {"pass": false, "reason": "one concise friendly sentence explaining why without using em dashes"}`,
        messages: [{
          role: 'user',
          content: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
        }]
      })
    });

    const data = await response.json();
    const rawText = data.content && data.content[0] && data.content[0].text
      ? data.content[0].text.trim()
      : '{"pass":true}';
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };

  } catch (err) {
    // On any error, let the message through
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pass: true })
    };
  }
};
