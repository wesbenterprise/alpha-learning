export const SUBJECTS = {
  math: {
    name: 'Math',
    emoji: '➗',
    units: [
      {
        title: 'Place Value & Decimals',
        concepts: [
          {
            id: 'math-pv-1',
            title: 'Read and compare decimals',
            explanation: 'Decimals show parts of a whole. The first place after the decimal is tenths, then hundredths.',
            questions: [
              { prompt: 'Which is greater: 0.45 or 0.405?', choices: ['0.45', '0.405', 'They are equal'], answer: '0.45' },
              { prompt: 'What digit is in the hundredths place in 3.728?', choices: ['7', '2', '8'], answer: '2' },
              { prompt: 'Write 0.6 as a fraction in simplest form.', choices: ['6/10', '3/5', '6/100'], answer: '3/5' }
            ]
          }
        ]
      },
      {
        title: 'Multi-digit Multiplication & Division',
        concepts: [
          {
            id: 'math-md-1',
            title: 'Multiply multi-digit numbers',
            explanation: 'Break multiplication into place-value chunks, then add partial products.',
            questions: [
              { prompt: '24 × 16 = ?', choices: ['364', '384', '394'], answer: '384' },
              { prompt: '32 × 7 = ?', choices: ['204', '224', '214'], answer: '224' },
              { prompt: '48 ÷ 6 = ?', choices: ['6', '8', '9'], answer: '8' }
            ]
          }
        ]
      },
      {
        title: 'Fractions (add, subtract, multiply, divide)',
        concepts: [
          {
            id: 'math-fr-1',
            title: 'Add and subtract fractions',
            explanation: 'Find a common denominator, then combine numerators.',
            questions: [
              { prompt: '1/4 + 2/4 = ?', choices: ['3/4', '3/8', '1/2'], answer: '3/4' },
              { prompt: '3/5 - 1/5 = ?', choices: ['2/5', '2/10', '1/5'], answer: '2/5' },
              { prompt: '1/2 + 1/4 = ?', choices: ['2/6', '3/4', '1/3'], answer: '3/4' }
            ]
          }
        ]
      },
      { title: 'Volume & Measurement', concepts: [] },
      { title: 'Coordinate Planes', concepts: [] },
      { title: 'Order of Operations', concepts: [] },
      { title: 'Word Problems & Problem Solving', concepts: [] }
    ]
  },
  ela: {
    name: 'ELA / Reading',
    emoji: '📚',
    units: [
      {
        title: 'Reading Comprehension (fiction & nonfiction)',
        concepts: [
          {
            id: 'ela-rc-1',
            title: 'Find main idea and details',
            explanation: 'The main idea is the most important point the author wants you to know.',
            questions: [
              { prompt: 'Main idea is best described as...', choices: ['A tiny detail', 'The overall point', 'A character name'], answer: 'The overall point' },
              { prompt: 'Supporting details should...', choices: ['Repeat random facts', 'Explain the main idea', 'Introduce a new story'], answer: 'Explain the main idea' },
              { prompt: 'In nonfiction, headings often help identify...', choices: ['The setting', 'Main ideas', 'Only opinions'], answer: 'Main ideas' }
            ]
          }
        ]
      },
      { title: 'Vocabulary in Context', concepts: [] },
      { title: 'Writing Structure (paragraphs, essays)', concepts: [] },
      { title: 'Grammar & Mechanics', concepts: [] },
      { title: 'Literary Analysis (theme, character, plot)', concepts: [] },
      { title: 'Research & Information Literacy', concepts: [] }
    ]
  },
  science: {
    name: 'Science',
    emoji: '🔬',
    units: [
      {
        title: 'Matter & Its Interactions',
        concepts: [
          {
            id: 'sci-mat-1',
            title: 'Physical vs. chemical changes',
            explanation: 'Physical changes affect form. Chemical changes create new substances.',
            questions: [
              { prompt: 'Melting ice is a...', choices: ['Physical change', 'Chemical change', 'Neither'], answer: 'Physical change' },
              { prompt: 'Rusting iron is a...', choices: ['Physical change', 'Chemical change', 'State change'], answer: 'Chemical change' },
              { prompt: 'Tearing paper is a...', choices: ['Chemical change', 'Physical change', 'Reaction'], answer: 'Physical change' }
            ]
          }
        ]
      },
      { title: 'Ecosystems & Energy Flow', concepts: [] },
      { title: "Earth's Systems (weather, water cycle)", concepts: [] },
      { title: 'Space & Astronomy', concepts: [] },
      { title: 'Engineering Design Process', concepts: [] }
    ]
  },
  social: {
    name: 'Social Studies',
    emoji: '🗺️',
    units: [
      {
        title: 'Early American History (Colonial → Revolution)',
        concepts: [
          {
            id: 'soc-eh-1',
            title: 'Causes of the American Revolution',
            explanation: 'Colonists wanted fair representation and disagreed with several taxes and laws.',
            questions: [
              { prompt: '"No taxation without representation" means...', choices: ['No taxes ever', 'Taxes should include a voice in government', 'Only tea should be taxed'], answer: 'Taxes should include a voice in government' },
              { prompt: 'The Boston Tea Party was a protest against...', choices: ['School rules', 'British taxes', 'Farming laws'], answer: 'British taxes' },
              { prompt: 'The colonies declared independence in...', choices: ['1492', '1776', '1812'], answer: '1776' }
            ]
          }
        ]
      },
      { title: 'US Government & Civics', concepts: [] },
      { title: 'Geography & Map Skills', concepts: [] },
      { title: 'Economics Basics', concepts: [] },
      { title: 'Current Events & Critical Thinking', concepts: [] }
    ]
  }
};

export const LEVELS = [
  { name: 'Explorer', min: 0 },
  { name: 'Trailblazer', min: 15 },
  { name: 'Strategist', min: 35 },
  { name: 'Scholar', min: 55 },
  { name: 'Mastermind', min: 75 },
  { name: 'Alpha Achiever', min: 90 }
];

export const BADGE_RULES = [
  { id: 'first-session', title: 'First Session', requirement: 'Complete your first 30', matcher: (state) => state.sessionLogs.length >= 1 },
  { id: 'streak-5', title: '5-Day Flame', requirement: 'Reach a 5 day streak 🔥', matcher: (state) => state.streak >= 5 },
  { id: 'math-90', title: 'Math Mastery', requirement: 'Math at 90%+', matcher: (state) => (state.subjects.math?.mastery || 0) >= 90 },
  { id: 'weekly-hero', title: 'Week Winner', requirement: 'Hit 5/5 days this week', matcher: (state) => state.weeklyCompleted >= 5 }
];
