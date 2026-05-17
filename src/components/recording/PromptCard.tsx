import { useState, useEffect } from "react";

const PROMPTS = [
  // 日常生活
  { text: "Describe your day in 3 sentences", hint: "What happened today?" },
  { text: "What made you smile today?", hint: "A moment, a person, or a thought" },
  { text: "Describe your breakfast / lunch / dinner", hint: "Taste, texture, how you felt" },
  { text: "What was the weather like today?", hint: "How did it affect your mood?" },
  { text: "Talk about someone you met today", hint: "Who, where, what did you talk about?" },
  { text: "Describe the room you're in right now", hint: "Colors, objects, sounds, feelings" },
  { text: "How are you feeling right now? Why?", hint: "Be honest — tired, excited, worried..." },
  { text: "What time did you wake up? Describe your morning", hint: "Every detail counts" },
  // 学习与成长
  { text: "What did you learn today?", hint: "A word, a fact, a skill — anything" },
  { text: "What's one thing you want to improve in English?", hint: "Speaking, listening, writing..." },
  { text: "Teach me something you know well", hint: "Explain it as if I'm a beginner" },
  { text: "What's the hardest part of learning English for you?", hint: "Talk about your struggles" },
  { text: "Give advice to your younger self", hint: "What would you say to 10-year-old you?" },
  // 工作与职业
  { text: "Explain your job to a 5-year-old", hint: "Simple words only — have fun with it" },
  { text: "What do you like most about your work?", hint: "And what's the hardest part?" },
  { text: "Describe a typical workday step by step", hint: "From waking up to going to bed" },
  { text: "If you could change careers tomorrow...", hint: "What would you do instead?" },
  // 想象与假设
  { text: "If you could travel anywhere right now...", hint: "Where, with whom, and what would you do?" },
  { text: "What superpower would you want and why?", hint: "How would you use it in daily life?" },
  { text: "If you won the lottery tomorrow...", hint: "What would change? What stays the same?" },
  { text: "Describe your perfect day", hint: "From sunrise to midnight" },
  { text: "If animals could talk, which one would you chat with?", hint: "What would you ask?" },
  { text: "You're the president for a day — what do you do?", hint: "Any laws or changes you'd make?" },
  // 回忆与反思
  { text: "Your favorite childhood memory", hint: "A moment you'll never forget" },
  { text: "What are you most proud of?", hint: "Big or small — anything counts" },
  { text: "The best decision you ever made", hint: "How did it change your life?" },
  { text: "A mistake that taught you something valuable", hint: "What happened? What did you learn?" },
  { text: "Retell a conversation you had recently", hint: "In English — try to remember the exact words" },
  // 喜好与观点
  { text: "Your favorite movie or TV show", hint: "What's it about? Why do you love it?" },
  { text: "A book that changed how you think", hint: "Or any book — just describe the story" },
  { text: "What kind of music do you like? Why?", hint: "How does it make you feel?" },
  { text: "What's your opinion on social media?", hint: "Good, bad, or somewhere in between?" },
  { text: "If you could only eat one food forever...", hint: "What would you choose and why?" },
  // 未来计划
  { text: "Talk about your plans for this weekend", hint: "Real or imaginary — be specific" },
  { text: "Where do you see yourself in 5 years?", hint: "Career, life, language skills..." },
  { text: "What's one new habit you want to build?", hint: "How would it change your life?" },
  { text: "Describe a place you want to visit someday", hint: "What attracts you to it?" },
];

// Use date string as seed so the daily prompt is stable within a day
function dailyIndex(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % PROMPTS.length;
}

export default function PromptCard() {
  const today = new Date().toISOString().slice(0, 10);
  const [index, setIndex] = useState(() => dailyIndex(today));
  const [extraUsed, setExtraUsed] = useState<number[]>([index]);

  // Reset when day changes
  useEffect(() => {
    const di = dailyIndex(today);
    setIndex(di);
    setExtraUsed([di]);
  }, [today]);

  const next = () => {
    const remaining = PROMPTS
      .map((_, i) => i)
      .filter((i) => !extraUsed.includes(i));

    if (remaining.length === 0) {
      // All prompts used — reset and start fresh
      const newIdx = Math.floor(Math.random() * PROMPTS.length);
      setIndex(newIdx);
      setExtraUsed([newIdx]);
      return;
    }

    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    setIndex(pick);
    setExtraUsed((prev) => [...prev, pick]);
  };

  const remaining = PROMPTS.length - extraUsed.length;
  const prompt = PROMPTS[index];

  return (
    <div className="rounded-xl bg-gradient-to-r from-warm-50 to-primary-50 border border-warm-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-warm-700">今日话题</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">剩余 {remaining} 个新话题</span>
          <button
            onClick={next}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            换一个 →
          </button>
        </div>
      </div>
      <p className="text-lg font-medium text-gray-800">{prompt.text}</p>
      {prompt.hint && (
        <p className="text-xs text-gray-400 mt-1">{prompt.hint}</p>
      )}
    </div>
  );
}
