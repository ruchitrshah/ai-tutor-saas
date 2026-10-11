// How the tutor talks. Every line here follows the same rules, drawn from how
// Duolingo writes feedback and from tutoring research:
//
//  1. One person, talking. Use their name, "you", contractions, short sentences
//     that sound fine out loud. Never "Incorrect", never "Please".
//  2. Celebrate with energy, but praise the PROCESS ("you stuck with it", "you
//     spotted it yourself"), never the person ("you're so smart"). Process praise
//     builds the belief that effort works; trait praise makes people avoid
//     hard things.
//  3. A mistake is information. Normalise it ("this one trips lots of people"),
//     then point at WHERE it went sideways and ask a smaller question. Don't
//     apologise, don't lecture, don't reveal.
//  4. Questions beat statements. Most lines end in a question the student can
//     answer in a few words.
//  5. Read the room. First try → big. Got there after hints → "you did that".
//     Several wrong → slow down, lower the pressure. Streak → hype, but not every
//     time (praise that always fires stops meaning anything).
//  6. Vary. Each moment has several phrasings and never repeats the last one.
//  7. Plain text only, so it reads the same on screen and out loud. Wrap the one
//     phrase that matters in **double asterisks** to highlight it.
//
// Hinglish is roman-script, the way people actually text: mixed, warm, no
// textbook Hindi.

const lastPick = {};

// Pick a line from a pool without repeating the previous one.
export function pick(pool, key) {
  if (!pool || !pool.length) return '';
  if (pool.length === 1) return pool[0];
  let i = Math.floor(Math.random() * pool.length);
  if (i === lastPick[key]) i = (i + 1) % pool.length;
  lastPick[key] = i;
  return pool[i];
}

export const fill = (s, v) => (s || '').replace(/\{(\w+)\}/g, (_, k) => (v[k] != null ? v[k] : ''));

const EN = {
  greet: {
    mcqFirst: [
      "Hey {name}! Ready when you are. Take your time, and if you get stuck, just tell me where. I'll ask you a smaller question, not hand you the answer.",
      "Hi {name}! Let's do this together. Pick what feels right, and shout if you get stuck. I'm right here.",
    ],
    mcqNext: [
      "Okay, next one. You've got this.",
      "Alright, {name}, let's keep it going.",
      "New question. Same deal: trust your gut, and talk to me if it gets fuzzy.",
    ],
    speak: [
      "Hey {name}! Picture the board sitting right in front of you. Hit the button and say your opening, about **thirty seconds**. I'll listen, then ask you one thing.",
    ],
    write: [
      "Hey {name}! Write it the way you'd actually send it. Rough is fine. When you want a second pair of eyes, tap **Check My Draft** and I'll ask you something about it.",
    ],
    code: [
      "Hey {name}! Run the code first and see what it prints. Then tell me what looks off to you. I'll help you find it, not fix it for you.",
    ],
    locked: [
      "Checkpoint time, {name}. I'll stay quiet on this one so you can show what you know. After, we'll go over anything that felt shaky.",
    ],
  },

  correct: {
    first: [
      "Yes! Right on the first try. Nicely done, {name}.",
      "That's it! No hints needed. I'm impressed.",
      "Boom. Clean answer, {name}. Kudos!",
      "Exactly right, and you made it look easy.",
    ],
    streak: [
      "That's **{n} in a row**. You're on a roll, {name}!",
      "**{n} straight!** Whatever you're doing, keep doing it.",
    ],
    earned: [
      "There it is! And you got there yourself. I only asked the questions. That's the part that sticks.",
      "Yes, {name}! You stuck with it and worked it out. That's exactly how learning is supposed to feel.",
      "Love it. You went from stuck to sorted. That's a **real breakthrough**.",
      "You did that. Not me. You kept going and it clicked. Kudos to you.",
    ],
    // Asked after a clean first try (no struggle to refer to)...
    reflectFirst: [
      "Quick one before we move on: why does that one work?",
      "Tell me in a line: what made you so sure?",
    ],
    // ...and after a hard-won one.
    reflect: [
      "Quick one before we move on: what made it click?",
      "Out of curiosity, what made you pick it in the end?",
      "Tell me in a line: what finally clicked?",
    ],
    reflected: [
      "That's exactly the reasoning. Hold on to that one.",
      "Yes, that's it. If you can explain it, you really get it.",
      "Mm, nice. That's how you'd say it in the exam too. Move on whenever you're ready.",
    ],
  },

  wrong: {
    first: [
      "Hmm, not that one, {name}.",
      "Ooh, close, but not quite.",
      "Not quite. And that's okay, this one trips lots of people.",
      "Good try. Let's look at it from another side.",
    ],
    second: [
      "Still not it, but you're narrowing it down.",
      "Tricky one, right? Let's slow down together.",
      "Getting closer. That's two ruled out, so you know what it isn't.",
    ],
    many: [
      "Okay, this one's stubborn. No stress. Take a breath, we'll go step by step.",
      "Hey, it's fine, {name}. Hard ones are where you learn the most. Let's go slowly.",
    ],
  },

  hintIntro: [
    ['Here\'s a thought:', 'Try this:', 'Let me ask you something:'],
    ['Okay, narrowing it down:', 'Another way to see it:', 'Think about this:'],
    ["Last nudge from me:", "Here's my biggest clue:"],
  ],
  outOfHints: [
    "That's all my hints, {name}, and you've already come a long way. Pick the one you trust most, and tell me **why** you chose it.",
    "I've given you all I can without doing it for you. Go with your best read, and explain it to me in one line.",
  ],

  redirect: [
    "I could just tell you, but you'd forget it by Thursday. Let's try a smaller step instead.",
    "Ha, nice try! I want you to be able to do this alone on exam day.",
    "I'm not going to hand it over, {name}, but I promise you can get there.",
  ],

  intent: {
    explain: [
      "Sure! Say it in your own words: what is this question really asking you to find?",
      "Of course. Forget the options for a second. What is the question trying to get you to figure out?",
    ],
    why: [
      "Good thing to ask. Look at what the sentence is actually doing, then check each option against that. Which one doesn't fit, and why?",
      "Great question. The fastest way to see why is to test each option against the key word in the question. Where does it break?",
    ],
    lookfor: [
      "Start with the key word in the question. Then cross out anything that clearly doesn't fit. What's left?",
      "Two things: find the word in the question that matters most, then ask which option actually speaks to it.",
    ],
    understood: [
      "Love the confidence. Go for it. I'm right here either way.",
      "Great! Lock it in whenever you're ready.",
    ],
    thanks: ["Anytime, {name}!", "You're welcome! That's what I'm here for."],
    stuck: ["No worries. Let's start small."],
  },
  exampleFallback: ["Think of a simple everyday case of the idea in the question. How would it show up there?"],
  examples: {
    'Tenses & agreement': ['Try a different sentence: "She walks to work every day." Is that happening now, always, or already finished? Use the same test on your options.'],
    'Writing for the reader': ["Picture someone reading this between two meetings. What's the first thing they'd need to see to act on it?"],
    'Communication barriers': ["Think of a text that got misread. Did the message get lost on the way, or did the words mean different things to each person?"],
    Presentations: ["Imagine you're cut off after 30 seconds. Which version of your opening would still land?"],
    'Essay writing': ["A thesis works like a signpost on a road: it tells readers where the essay is heading. Which option does that job?"],
    'Reports and resumes': ["Think of a busy manager who only reads the top of the page. What would they need to find up there?"],
    Loops: ["Count on your fingers: a range that starts at 1 and stops before 4 gives you 1, 2, 3. What decides where it stops?"],
  },

  chips: {
    start: ['Explain the question'],
    afterHint: ["Why isn't that right?", 'Show me an example', 'I think I get it'],
    afterWhy: ['Show me an example', 'I think I get it'],
    afterExample: ['I think I get it'],
  },

  probe: {
    // A short reaction in front of the next question, matched to what the student just did.
    ack: {
      default: ['Mm, got it.', "Okay, I like where this is going.", 'Thanks, that helps.', 'Nice, I followed that.'],
      speak: ['Mm, got it.', "Okay, I like where that's going.", 'Thanks for saying it out loud.', 'Nice, I followed that.'],
      write: ['Okay, I read it.', 'Nice start.', 'Thanks, that gives me something to work with.'],
      code: ["Okay, I see what it printed.", "Good, that's a useful clue.", 'Right, now we can look closer.'],
    },
    done: "That's everything I wanted to ask. Nicely done, {name}. Finish up whenever you're ready.",
    needMore: "Write a bit more first. Even rough is fine, and then I'll ask you something about it.",
  },

  code: {
    ran: "Okay, I see what it printed. Now the fun part: why isn't it the number you expected?",
    fixed: "**There it is!** You spotted the off-by-one yourself, {name}. Kudos. That's a classic bug, and plenty of working developers still trip on it.",
  },

  finish: {
    recap: "Nice work, {name}. I noted where you needed a nudge and where you flew, so we'll come back to the shaky bits next time.",
  },
};

const HI = {
  greet: {
    mcqFirst: [
      "Hey {name}! Jab ready ho, shuru karo. Aaram se, aur agar atak jao to bas batao kahan. Main chhota sawal puchunga, answer nahi dunga.",
      "Hi {name}! Chalo saath mein karte hain. Jo sahi lage woh chuno, aur atko to bol dena. Main yahin hoon.",
    ],
    mcqNext: [
      "Chalo, agla sawal. Ho jayega.",
      "Achha {name}, aage badhte hain.",
      "Naya sawal. Same rule: apne gut pe bharosa karo, aur fuzzy lage to mujhse puchho.",
    ],
    speak: ["Hey {name}! Socho board tumhare saamne baithi hai. Button dabao aur apna opening bolo, lagbhag **tees second**. Main sununga, phir ek cheez puchunga."],
    write: ["Hey {name}! Waise likho jaise tum sach mein bhejte. Rough chalega. Doosri nazar chahiye to **Check My Draft** dabao."],
    code: ["Hey {name}! Pehle code run karo aur dekho kya print hota hai. Phir batao kya galat lag raha hai. Dhoondhne mein madad karunga, fix nahi."],
    locked: ["Checkpoint ka time, {name}. Is baar main chup rahunga taaki tum dikha sako tumhe kya aata hai. Baad mein jo shaky laga woh saath dekhenge."],
  },
  correct: {
    first: [
      "Haan! Pehli baar mein sahi. Bahut badhiya, {name}.",
      "Wahi hai! Hint ki zaroorat hi nahi padi. Impress ho gaya.",
      "Boom. Ekdum clean answer, {name}. Kudos!",
    ],
    streak: [
      "**{n} lagataar sahi!** Tum toh chal rahe ho, {name}!",
      "**{n} straight!** Jo kar rahe ho, karte raho.",
    ],
    earned: [
      "Ye lo! Aur tum khud pahunche. Maine bas sawal puche. Yahi cheez yaad rehti hai.",
      "Haan, {name}! Tum lage rahe aur khud nikaal liya. Seekhna aise hi hota hai.",
      "Maza aa gaya. Atke hue se sorted tak. Ye **sach mein breakthrough** hai.",
      "Tumne kiya ye. Maine nahi. Lage rahe aur click ho gaya. Kudos tumhe.",
    ],
    reflectFirst: [
      "Aage badhne se pehle ek cheez: ye wala kyun kaam karta hai?",
      "Ek line mein batao: tum itne sure kyun the?",
    ],
    reflect: [
      "Aage badhne se pehle: kya click hua?",
      "Bas jaanna chahta hoon, aakhir mein tumne ise kyun chuna?",
      "Ek line mein batao: finally kya click hua?",
    ],
    reflected: [
      "Bilkul yahi reasoning hai. Isse pakad ke rakho.",
      "Haan, yahi. Jo samjha sakta hai, usse sach mein aata hai.",
      "Mm, badhiya. Exam mein bhi aise hi bologe. Ready ho to aage badho.",
    ],
  },
  wrong: {
    first: [
      "Hmm, ye wala nahi, {name}.",
      "Arre, kareeb tha, par nahi.",
      "Poora sahi nahi. Koi baat nahi, ye sawal kaafi logon ko atkata hai.",
      "Achha try tha. Chalo ise doosri taraf se dekhte hain.",
    ],
    second: [
      "Abhi bhi nahi, par tum chhaant rahe ho.",
      "Tricky hai na? Chalo dheere dheere saath dekhte hain.",
      "Kareeb aa rahe ho. Do options hat gaye, ab pata hai kya nahi hai.",
    ],
    many: [
      "Okay, ye zidd pe hai. Tension nahi. Saans lo, ek ek step lete hain.",
      "Arre, theek hai {name}. Mushkil sawalon se hi sabse zyada seekhte hain. Aaram se chalte hain.",
    ],
  },
  hintIntro: [
    ['Ek baat socho:', 'Ye try karo:', 'Ek cheez puchun?'],
    ['Chalo, chhota karte hain:', 'Doosra angle:', 'Isse socho:'],
    ['Mera aakhri ishara:', 'Ye raha sabse bada clue:'],
  ],
  outOfHints: [
    "Mere paas itne hi hints hain, {name}, aur tum kaafi door aa chuke ho. Jo sabse sahi lage woh chuno, aur bata do **kyun** chuna.",
    "Jitna main bina kiye de sakta tha, de diya. Apni best samajh se chuno aur ek line mein samjhao.",
  ],
  redirect: [
    "Bata sakta hoon, par Thursday tak bhool jaoge. Chalo chhota step try karte hain.",
    "Haha, achhi koshish! Main chahta hoon tum exam mein akele kar sako.",
    "Main answer nahi dunga, {name}, par promise hai tum pahunch jaoge.",
  ],
  intent: {
    explain: [
      "Zaroor! Apne shabdon mein bolo: ye sawal asal mein kya dhoondhne ko keh raha hai?",
      "Bilkul. Options ko ek second ke liye bhool jao. Sawal kya figure out karwana chahta hai?",
    ],
    why: [
      "Achha sawal. Dekho sentence asal mein kya kar raha hai, phir har option ko usse milao. Kaunsa fit nahi hota, aur kyun?",
      "Badhiya sawal. Sabse tez tareeka: har option ko sawal ke key word se test karo. Kahan tootta hai?",
    ],
    lookfor: [
      "Sawal ka key word dhoondho. Phir jo clearly fit nahi hota use kaat do. Kya bacha?",
      "Do cheezein: sawal ka sabse zaroori word dhoondho, phir dekho kaunsa option usse baat karta hai.",
    ],
    understood: ["Confidence pasand aaya. Chalo chuno. Main yahin hoon.", "Badhiya! Jab ready ho lock kar do."],
    thanks: ["Kabhi bhi, {name}!", "Welcome! Isiliye toh hoon main."],
    stuck: ["Koi baat nahi. Chhote se shuru karte hain."],
  },
  exampleFallback: ["Sawal ke idea ka koi simple roz ka example socho. Wahan woh kaise dikhega?"],
  examples: {},
  chips: {
    start: ['Sawal samjhao'],
    afterHint: ['Ye galat kyun hai?', 'Ek example dikhao', 'Mujhe samajh aa gaya'],
    afterWhy: ['Ek example dikhao', 'Mujhe samajh aa gaya'],
    afterExample: ['Mujhe samajh aa gaya'],
  },
  probe: {
    ack: {
      default: ['Mm, samajh gaya.', 'Achha, mujhe ye direction pasand aayi.', 'Shukriya, isse madad mili.', 'Badhiya, maine samjha.'],
      speak: ['Mm, samajh gaya.', 'Achha, ye direction pasand aayi.', 'Zor se bolne ka shukriya.', 'Badhiya, maine suna.'],
      write: ['Okay, maine padh liya.', 'Achhi shuruaat.', 'Shukriya, ab kuch hai jispe baat kar sakte hain.'],
      code: ['Okay, dekh liya kya print hua.', 'Achha, ye ek kaam ka clue hai.', 'Theek hai, ab gaur se dekhte hain.'],
    },
    done: "Jo main puchna chahta tha, ho gaya. Sach mein, bahut badhiya {name}. Ready ho to finish karo.",
    needMore: "Pehle thoda aur likho. Rough bhi chalega, phir main kuch puchunga.",
  },
  code: {
    ran: "Okay, dekh liya kya print hua. Ab asli sawal: jo number tum chahte the woh kyun nahi aaya?",
    fixed: "**Ye lo!** Off-by-one tumne khud pakda, {name}. Kudos. Ye classic bug hai, aur kaam karne wale developers bhi yahan atakte hain.",
  },
  finish: {
    recap: "Badhiya kaam, {name}. Maine note kiya kahan nudge chahiye tha aur kahan tum ud gaye, to shaky wale next time wapas aayenge.",
  },
};

const BY = { en: EN, hi: HI };
export const copy = (lang) => BY[lang] || EN;
