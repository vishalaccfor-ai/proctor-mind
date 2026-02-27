import { Exam } from "@/types/exam";

export const sampleExams: Exam[] = [
  {
    id: "exam-1",
    title: "General Aptitude Test",
    description: "A comprehensive test covering logical reasoning, quantitative aptitude, and verbal ability.",
    duration: 30,
    subjects: [
      { id: "sub-lr", name: "Logical Reasoning" },
      { id: "sub-qa", name: "Quantitative Aptitude" },
      { id: "sub-va", name: "Verbal Ability" },
    ],
    topics: [
      { id: "top-patterns", name: "Pattern Recognition", subjectId: "sub-lr" },
      { id: "top-syllogism", name: "Syllogism", subjectId: "sub-lr" },
      { id: "top-arithmetic", name: "Arithmetic", subjectId: "sub-qa" },
      { id: "top-algebra", name: "Algebra", subjectId: "sub-qa" },
      { id: "top-grammar", name: "Grammar", subjectId: "sub-va" },
      { id: "top-vocab", name: "Vocabulary", subjectId: "sub-va" },
    ],
    questions: [
      {
        id: "q1", text: "If all roses are flowers and some flowers fade quickly, which of the following is true?",
        options: [
          { id: "q1a", text: "All roses fade quickly" },
          { id: "q1b", text: "Some roses may fade quickly" },
          { id: "q1c", text: "No roses fade quickly" },
          { id: "q1d", text: "All flowers are roses" },
        ],
        correctOptionId: "q1b", difficulty: "easy", subjectId: "sub-lr", topicId: "top-syllogism",
      },
      {
        id: "q2", text: "What comes next in the series: 2, 6, 12, 20, 30, ?",
        options: [
          { id: "q2a", text: "40" }, { id: "q2b", text: "42" }, { id: "q2c", text: "38" }, { id: "q2d", text: "44" },
        ],
        correctOptionId: "q2b", difficulty: "medium", subjectId: "sub-lr", topicId: "top-patterns",
      },
      {
        id: "q3", text: "If a train travels 360 km in 4 hours, what is its speed in m/s?",
        options: [
          { id: "q3a", text: "25 m/s" }, { id: "q3b", text: "90 m/s" }, { id: "q3c", text: "20 m/s" }, { id: "q3d", text: "30 m/s" },
        ],
        correctOptionId: "q3a", difficulty: "easy", subjectId: "sub-qa", topicId: "top-arithmetic",
      },
      {
        id: "q4", text: "Solve: 3x + 7 = 22. Find x.",
        options: [
          { id: "q4a", text: "3" }, { id: "q4b", text: "5" }, { id: "q4c", text: "7" }, { id: "q4d", text: "4" },
        ],
        correctOptionId: "q4b", difficulty: "easy", subjectId: "sub-qa", topicId: "top-algebra",
      },
      {
        id: "q5", text: "Choose the correct sentence:",
        options: [
          { id: "q5a", text: "He don't know nothing." },
          { id: "q5b", text: "He doesn't know anything." },
          { id: "q5c", text: "He don't know anything." },
          { id: "q5d", text: "He doesn't knows nothing." },
        ],
        correctOptionId: "q5b", difficulty: "easy", subjectId: "sub-va", topicId: "top-grammar",
      },
      {
        id: "q6", text: "What is the synonym of 'Ubiquitous'?",
        options: [
          { id: "q6a", text: "Rare" }, { id: "q6b", text: "Everywhere" }, { id: "q6c", text: "Hidden" }, { id: "q6d", text: "Unique" },
        ],
        correctOptionId: "q6b", difficulty: "medium", subjectId: "sub-va", topicId: "top-vocab",
      },
      {
        id: "q7", text: "If the ratio of boys to girls is 3:5 and there are 40 students, how many boys are there?",
        options: [
          { id: "q7a", text: "15" }, { id: "q7b", text: "20" }, { id: "q7c", text: "25" }, { id: "q7d", text: "12" },
        ],
        correctOptionId: "q7a", difficulty: "medium", subjectId: "sub-qa", topicId: "top-arithmetic",
      },
      {
        id: "q8", text: "Find the odd one out: Apple, Mango, Potato, Banana",
        options: [
          { id: "q8a", text: "Apple" }, { id: "q8b", text: "Mango" }, { id: "q8c", text: "Potato" }, { id: "q8d", text: "Banana" },
        ],
        correctOptionId: "q8c", difficulty: "easy", subjectId: "sub-lr", topicId: "top-patterns",
      },
      {
        id: "q9", text: "What is the antonym of 'Benevolent'?",
        options: [
          { id: "q9a", text: "Kind" }, { id: "q9b", text: "Malevolent" }, { id: "q9c", text: "Generous" }, { id: "q9d", text: "Helpful" },
        ],
        correctOptionId: "q9b", difficulty: "medium", subjectId: "sub-va", topicId: "top-vocab",
      },
      {
        id: "q10", text: "If x^2 - 5x + 6 = 0, what are the roots?",
        options: [
          { id: "q10a", text: "1, 6" }, { id: "q10b", text: "2, 3" }, { id: "q10c", text: "-2, -3" }, { id: "q10d", text: "3, 4" },
        ],
        correctOptionId: "q10b", difficulty: "hard", subjectId: "sub-qa", topicId: "top-algebra",
      },
    ],
    markingScheme: { correct: 4, incorrect: -1, unattempted: 0 },
    shuffleQuestions: false,
    shuffleOptions: false,
    createdBy: "admin-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "exam-2",
    title: "General Knowledge Quiz",
    description: "Test your knowledge of world affairs, history, geography, and science.",
    duration: 20,
    subjects: [
      { id: "sub-hist", name: "History" },
      { id: "sub-geo", name: "Geography" },
      { id: "sub-sci", name: "Science" },
    ],
    topics: [
      { id: "top-world", name: "World History", subjectId: "sub-hist" },
      { id: "top-india", name: "Indian History", subjectId: "sub-hist" },
      { id: "top-countries", name: "Countries & Capitals", subjectId: "sub-geo" },
      { id: "top-physics", name: "Basic Physics", subjectId: "sub-sci" },
      { id: "top-biology", name: "Basic Biology", subjectId: "sub-sci" },
    ],
    questions: [
      {
        id: "gk1", text: "Who was the first President of the United States?",
        options: [
          { id: "gk1a", text: "Thomas Jefferson" }, { id: "gk1b", text: "George Washington" },
          { id: "gk1c", text: "Abraham Lincoln" }, { id: "gk1d", text: "John Adams" },
        ],
        correctOptionId: "gk1b", difficulty: "easy", subjectId: "sub-hist", topicId: "top-world",
      },
      {
        id: "gk2", text: "What is the capital of Australia?",
        options: [
          { id: "gk2a", text: "Sydney" }, { id: "gk2b", text: "Melbourne" },
          { id: "gk2c", text: "Canberra" }, { id: "gk2d", text: "Perth" },
        ],
        correctOptionId: "gk2c", difficulty: "medium", subjectId: "sub-geo", topicId: "top-countries",
      },
      {
        id: "gk3", text: "What is the SI unit of force?",
        options: [
          { id: "gk3a", text: "Joule" }, { id: "gk3b", text: "Newton" },
          { id: "gk3c", text: "Watt" }, { id: "gk3d", text: "Pascal" },
        ],
        correctOptionId: "gk3b", difficulty: "easy", subjectId: "sub-sci", topicId: "top-physics",
      },
      {
        id: "gk4", text: "Which organelle is known as the 'powerhouse of the cell'?",
        options: [
          { id: "gk4a", text: "Nucleus" }, { id: "gk4b", text: "Ribosome" },
          { id: "gk4c", text: "Mitochondria" }, { id: "gk4d", text: "Golgi body" },
        ],
        correctOptionId: "gk4c", difficulty: "easy", subjectId: "sub-sci", topicId: "top-biology",
      },
      {
        id: "gk5", text: "The Battle of Plassey was fought in which year?",
        options: [
          { id: "gk5a", text: "1757" }, { id: "gk5b", text: "1857" },
          { id: "gk5c", text: "1764" }, { id: "gk5d", text: "1947" },
        ],
        correctOptionId: "gk5a", difficulty: "medium", subjectId: "sub-hist", topicId: "top-india",
      },
      {
        id: "gk6", text: "Which is the largest ocean on Earth?",
        options: [
          { id: "gk6a", text: "Atlantic" }, { id: "gk6b", text: "Indian" },
          { id: "gk6c", text: "Pacific" }, { id: "gk6d", text: "Arctic" },
        ],
        correctOptionId: "gk6c", difficulty: "easy", subjectId: "sub-geo", topicId: "top-countries",
      },
      {
        id: "gk7", text: "What is the speed of light approximately?",
        options: [
          { id: "gk7a", text: "3 × 10^8 m/s" }, { id: "gk7b", text: "3 × 10^6 m/s" },
          { id: "gk7c", text: "3 × 10^10 m/s" }, { id: "gk7d", text: "3 × 10^5 m/s" },
        ],
        correctOptionId: "gk7a", difficulty: "medium", subjectId: "sub-sci", topicId: "top-physics",
      },
      {
        id: "gk8", text: "DNA stands for:",
        options: [
          { id: "gk8a", text: "Deoxyribonucleic Acid" }, { id: "gk8b", text: "Dinitrogen Acid" },
          { id: "gk8c", text: "Deoxyribose Nucleic Atom" }, { id: "gk8d", text: "Dynamic Nuclear Acid" },
        ],
        correctOptionId: "gk8a", difficulty: "easy", subjectId: "sub-sci", topicId: "top-biology",
      },
    ],
    markingScheme: { correct: 2, incorrect: 0, unattempted: 0 },
    shuffleQuestions: true,
    shuffleOptions: false,
    createdBy: "admin-1",
    createdAt: new Date().toISOString(),
  },
];
