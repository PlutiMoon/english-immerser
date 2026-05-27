// ============================================================
// Writing Prompts — 66 English prompts across 3 sentence slots
//
// Slot 0 (fact/event):   what happened today — describe a concrete thing
// Slot 1 (feeling):      how it made you feel — emotions, sensations
// Slot 2 (thought):      what you think about it — opinions, imagination, growth
// ============================================================

export type PromptSlot = 0 | 1 | 2;

const PROMPTS_BY_SLOT: Record<PromptSlot, string[]> = {
  // Sentence 1 — facts, events, observations
  0: [
    "What was the most unexpected moment of your day?",
    "What part of today would you relive if you could?",
    "What did you notice today that you usually overlook?",
    "What decision did you make today that you're proud of?",
    "What was the hardest thing you did today?",
    "What conversation stuck with you the most today?",
    "If today were a chapter in a book, what would its title be?",
    "What is one thing you wish you had done differently today?",
    "What is the earliest happy memory you can recall?",
    "Describe a place from your childhood that no longer exists or has changed.",
    "What is a song that instantly takes you back to a specific moment?",
    "What was your favorite game or activity as a child?",
    "Describe a meal you'll never forget.",
    "What is a smell that brings back strong memories for you?",
    "Describe your favorite room using all five senses.",
    "Describe the weather right now in as much detail as you can.",
    "What does your neighborhood look like at night?",
    "Describe a sound that you find deeply comforting.",
    "Describe your favorite season without naming it.",
    "What did you eat today, and how did it taste?",
  ],

  // Sentence 2 — feelings, emotions, sensations
  1: [
    "When did you feel most at peace this week?",
    "What is something that made you genuinely laugh recently?",
    "What has been weighing on your mind lately?",
    "When was the last time you felt truly proud of yourself?",
    "What emotion do you find hardest to express, and why?",
    "Describe a moment when you felt completely content.",
    "Who is someone that made your life better without realizing it?",
    "What is something you take for granted that you're actually grateful for?",
    "What is a small daily pleasure that makes your life better?",
    "What challenge are you grateful for having faced?",
    "Name three things that went right this week.",
    "Who taught you something valuable, and what was it?",
    "Describe someone you admire from a distance.",
    "What quality do you value most in a friend?",
    "Think of a stranger who left an impression on you. What happened?",
    "What is a lesson you learned from someone you no longer talk to?",
    "Describe your favorite person without saying their name.",
    "What is the best piece of advice anyone ever gave you?",
    "What does silence sound like to you?",
    "What moment today made you smile, even just a little?",
  ],

  // Sentence 3 — thoughts, opinions, imagination, growth
  2: [
    "Do you think social media brings people closer or pushes them apart?",
    "What is a popular opinion you disagree with?",
    "What do you think schools should teach but don't?",
    "Is it more important to be kind or to be honest?",
    "What technology do you think will change the world most in the next 10 years?",
    "Do you believe luck or hard work matters more for success?",
    "What is one rule or law you would change if you could?",
    "Is it better to have many acquaintances or a few close friends?",
    "If you could live in any era of history, which would you choose and why?",
    "If you could have dinner with any three people, living or dead, who would they be?",
    "If you woke up tomorrow with a superpower, what would you want it to be?",
    "If you could instantly master any skill, what would it be?",
    "If you could visit any fictional world, where would you go?",
    "If animals could talk, which species would have the most interesting things to say?",
    "If you could design your perfect day from start to finish, what would it look like?",
    "If your life were a movie, what genre would it be right now?",
    "What skill would you most like to master in the next year?",
    "What is one habit you want to build, and why?",
    "Where do you hope to be five years from today?",
    "What is something you've been putting off that you should start?",
    "What would you do if you knew you couldn't fail?",
    "What does your ideal morning routine look like?",
    "What mistake taught you something important?",
    "What belief did you once hold strongly that you've since changed your mind about?",
    "What is something you're trying to improve about yourself right now?",
    "What have you learned about yourself in the past year?",
    "What is something difficult that you're glad you went through?",
    "What do you know today that you wish you'd known five years ago?",
  ],
};

function hashDate(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Deterministic daily prompt for a given sentence slot. */
export function dailyPromptForSlot(slot: PromptSlot, dateStr?: string): string {
  const date = dateStr ?? new Date().toISOString().slice(0, 10);
  const prompts = PROMPTS_BY_SLOT[slot];
  // Different prime offsets per slot so each slot picks differently
  const offset = [3, 17, 31][slot];
  return prompts[(hashDate(date) + offset) % prompts.length];
}

/** Random prompt for a given sentence slot. */
export function randomPromptForSlot(slot: PromptSlot): string {
  const prompts = PROMPTS_BY_SLOT[slot];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

/** Random prompt from the full library — used by free-writing inspiration. */
export function randomPrompt(): string {
  const all = Object.values(PROMPTS_BY_SLOT).flat();
  return all[Math.floor(Math.random() * all.length)];
}

/** For backward compat / tests */
export const PROMPT_CATEGORIES = [
  { name: "Slot 0 — Facts", prompts: PROMPTS_BY_SLOT[0] },
  { name: "Slot 1 — Feelings", prompts: PROMPTS_BY_SLOT[1] },
  { name: "Slot 2 — Thoughts", prompts: PROMPTS_BY_SLOT[2] },
];
