import { ChatMessage } from "@/types";

const API_BASE = "https://kisan-sathi-dz6w.onrender.com";

export const analyzeCropDisease = async (imageBase64: string) => {
  const response = await fetch(`${API_BASE}/api/analyze-crop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64 }),
  });

  if (!response.ok) {
    throw new Error("Analysis failed");
  }

  return response.json();
};

export async function* getFarmingAdviceStream(messages: ChatMessage[]) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error("Failed to connect to AI engine");
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No reader available");

  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}

// Legacy non-stream version for compatibility if needed, but streaming is preferred
export const getFarmingAdvice = async (query: string) => {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: 'user', content: query }] }),
  });

  if (!response.ok) {
    throw new Error("Failed to connect to AI engine");
  }

  return response.text();
};
