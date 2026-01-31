const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export type ChatMessage = { role: "user" | "assistant"; content: string };

function getSystemPrompt(topic?: string): string {
  const base =
    "You are a friendly tutor on Skill Share Circle. Answer concisely and help the user learn. ";
  if (topic) {
    return base + `The user is interested in learning about: ${topic}. Focus your answers on this topic when relevant.`;
  }
  return base;
}

async function callOpenAI(messages: ChatMessage[], topic?: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    return mockResponse(messages[messages.length - 1]?.content ?? "");
  }
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: getSystemPrompt(topic) },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 500,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } })?.error?.message ?? "AI request failed");
  }
  const data = (await res.json()) as { choices?: { 0?: { message?: { content?: string } } } };
  return data.choices?.[0]?.message?.content ?? "I couldn't generate a response.";
}

function mockResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes("hello") || lower.includes("hi")) {
    return "Hello! I'm your AI tutor on Skill Share Circle. What would you like to learn today?";
  }
  if (lower.includes("python") || lower.includes("code")) {
    return "I'd be happy to help with Python! A great way to start is with variables and loops. Try writing a simple for loop that prints numbers 1 to 5. If you share your code, I can give feedback.";
  }
  if (lower.includes("design") || lower.includes("ui") || lower.includes("ux")) {
    return "For UI/UX, focus on clarity and consistency: use a clear hierarchy, consistent spacing, and simple navigation. Would you like to dive into a specific area like layout or accessibility?";
  }
  return "I'm here to help you learn! Ask me anything about the topic you're studying—I'll keep answers clear and practical. (Add VITE_OPENAI_API_KEY to .env for full AI responses.)";
}

export async function sendAIMessage(messages: ChatMessage[], topic?: string): Promise<string> {
  return callOpenAI(messages, topic);
}
