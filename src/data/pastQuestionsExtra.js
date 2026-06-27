// ┌──────────────────────────────────────────────────────────────────────────┐
// │  HAND-EDITED past questions - add new years / courses HERE.                │
// │                                                                            │
// │  This file is MERGED on top of the auto-generated pastQuestions.js, so     │
// │  anything you add here is safe even if the generator is re-run.            │
// │                                                                            │
// │  Course key  = the code lowercased, no spaces, "TUM-" prefix dropped       │
// │                ("COS 101" -> "cos101", "TUM-CSC 112" -> "csc112").         │
// │  Year key    = 8 digits, e.g. "20232024" (shows as "2023/2024").           │
// │                                                                            │
// │  After adding an entry, drop the matching PDF in:                          │
// │      public/pastquestions/<FILE>.pdf                                       │
// │  so the "Download the PDF" option resolves.                                │
// │                                                                            │
// │  Theory quizzes are AI-graded against each question's modelAnswer          │
// │  (from the official marking guides). `sections[].pick`: 'all' counts every │
// │  question, a number N counts the best N. Set `mathjax: true` on a quiz to  │
// │  render $...$ LaTeX in the question text (used for the science papers).    │
// └──────────────────────────────────────────────────────────────────────────┘

export const pastQuestionsExtra = {
  // ── CSC 112 - Web Technologies I (Q1 compulsory + any 2 of Q2–Q5) ──────────
  csc112: {
    code: 'CSC 112',
    title: 'Web Technologies I',
    subject: 'web technologies (CSC 112)',
    years: {
      '20232024': {
        session: '',
        type: 'theory',
        pdfUrl: '/pastquestions/CSC112-20232024.pdf',
        durationMins: 120,
        sections: [
          { id: 'A', label: 'Section A - Question 1 is compulsory', pick: 'all' },
          { id: 'B', label: 'Section B - Answer any TWO (2) questions', pick: 2 },
        ],
        questions: [
          {
            section: 'A', type: 'essay', label: 'Question 1', marks: 23.5,
            text: '(a) Write the HTML code for: (i) an OK button (ii) a name field (iii) a password field (iv) a dropdown list. (8 marks)\n(b) Define, by example, the complete structure of an HTML document. (8 marks)\n(c) Given a = 4 and b = 4, state the output of: (i) a != b (ii) a % b (iii) (a < b) ? a : b (iv) a < a && a == a. (7½ marks)',
            modelAnswer: '(a)(i) <button>Ok</button> (ii) <input type="text" /> (iii) <input type="password" /> (iv) <select><option>…</option></select>. (b) <!DOCTYPE HTML><html><head><title>…</title></head><body>…</body></html>. (c)(i) a != b → False (ii) a % b → 0 (iii) (a < b) ? a : b → b (4<4 is false, so it returns b) (iv) a < a && a == a → False.',
          },
          {
            section: 'B', type: 'essay', label: 'Question 2', marks: 23.5,
            text: '(a) Write a CSS class to style: (i) a green-coloured label text (ii) a circular profile-picture avatar (iii) a box with a red-coloured shadow (iv) a button that grows on mouse-over. (8 marks)\n(b) Using a flexbox approach, write CSS to perfectly centralise an image in an oval-shaped div. (8 marks)\n(c) Programmatically show the relationship between style.css, actions.js and page.html. (7½ marks)',
            modelAnswer: '(a) .label{color:green;}  .avatar{border-radius:50%;}  .box{box-shadow:0 0 10px 20px red;}  .button:hover{transform:scale(1.1,1.1);}. (b) .center{display:flex;justify-content:center;align-items:center;} and .div{border-radius:50%;}. (c) page.html links the other two in its <head>: <link rel="stylesheet" href="style.css"/> and <script src="actions.js"></script>.',
          },
          {
            section: 'B', type: 'essay', label: 'Question 3', marks: 23.5,
            text: '(a) Define suitable CSS selectors for: (i) <div class="class"> (ii) <span id="identity"> (iii) <div> (iv) <span>. (8 marks)\n(b) Given a = 10 and b = 20, state the output of: (i) a += b (ii) a %= b (iii) a *= 2 (iv) (a--) + 1. (8 marks)\n(c) Using CSS, define a div of size 200px by 200px, then transform it so the width is twice as large without modifying the width property. (7½ marks)',
            modelAnswer: '(a) (i) .class{} (ii) #identity{} (iii) div{} (iv) span{}. (b) (i) a += b → 30 (ii) a %= b → 10 (iii) a *= 2 → 20 (iv) (a--) + 1 → 10. (c) div{ width:200px; height:200px; transform:scaleX(2); }.',
          },
          {
            section: 'B', type: 'essay', label: 'Question 4', marks: 23.5,
            text: '(a) Write a JavaScript function to change the value of a div with id="div" to "Topfaith University". (11½ marks)\n(b) Write a JavaScript function to find white eggs in a basket of multi-coloured eggs (eggs are stored as strings). (12 marks)',
            modelAnswer: '(a) function changeText(){ var component = document.getElementById("div"); component.innerHTML = "Topfaith University"; }. (b) var foundAt = -1; for (var i = 0; i < eggs.length; i++){ if (eggs[i] == "white"){ foundAt = i; return; } }.',
          },
          {
            section: 'B', type: 'essay', label: 'Question 5', marks: 23.5,
            text: 'Given the loop: for(var i = 0; i <= N; i++){ … }\n(a) In a table, answer: (i) how many times the loop body executes (ii) at what value of i the loop terminates (iii) what happens if i++ is replaced with i--. (12 marks)\n(b) Using HTML, design an OTP confirmation page comprising a page header, an OTP input field and a confirm button, all centralised. (11½ marks)',
            modelAnswer: '(a)(i) The body runs N+1 times (11 times when N = 10). (ii) The loop terminates at i = N+1 (i = 11 when N = 10). (iii) Replacing i++ with i-- makes i decrease forever, so the condition stays true - an infinite loop. (b) <html><head><title>…</title></head><body><center><h3>heading</h3><input type="text" /><button>Confirm</button></center></body></html>.',
          },
        ],
      },
    },
  },

  // ── PHY 107 - General Practical Physics I (answer ONE question only) ────────
  phy107: {
    code: 'PHY 107',
    title: 'General Practical Physics I',
    years: {
      '20232024': {
        session: '2023/2024',
        pdfUrl: '/pastquestions/PHY107-20232024.pdf',
      },
    },
  },

  // ── MTH 101 - Elementary Mathematics I (answer any THREE) ───────────────────
 
   mth101: {
    code: 'MTH 101',
    title: ' Elementary Mathematics I',
    years: {
      '20232024': {
        session: '2023/2024',
        pdfUrl: '/pastquestions/MTH101-20232024.pdf',
      },
    },
  },

  // ── STA 111 - Descriptive Statistics (answer any FOUR) ──────────────────────
  sta111: {
    code: 'STA 111',
    title: 'Descriptive Statistics',
    years: {
      '20232024': {
        session: '2023/2024',
        pdfUrl: '/pastquestions/STA111-20232024.pdf',
      },
    },
  },

  // ── PHY 101 - General Physics 1 (Q1 compulsory + any 2 of Q2–Q5) ────────────
  phy101: {
    code: 'PHY 101',
    title: 'General Physics I',
    years: {
      '20232024': {
        session: '2023/2024',
        pdfUrl: '/pastquestions/PHY101-20232024.pdf', 
      },
    },
  },

  // ── GST 111 - Communication in English Language (Section B essay questions) ──
  gst111: {
    code: 'GST 111',
    title: 'Communication in English Language',
    subject: 'communication in English language (GST 111 - Communication in English Language)',
    years: {
      '20232024': {
        session: '2023/2024',
        type: 'theory',
        pdfUrl: '/pastquestions/GST111-20232024.pdf',
        durationMins: 120,
        sections: [
          { id: 'A',  label: 'Section A – All 20 questions compulsory (1 mark each)', pick: 'all' },
          { id: 'B1', label: 'Section B – Question 1 is compulsory', pick: 'all' },
          { id: 'B2', label: 'Section B – Answer any TWO of Questions 2–4 (15 marks each)', pick: 2 },
        ],
        questions: [
          // ── Section A: MCQ ─────────────────────────────────────────────────
          {
            section: 'A', type: 'mcq', label: 'Question 1', marks: 1,
            text: '____________ is the process of making notes.',
            options: ['Note reading', 'Note taking', 'Note making', 'Note jotting'],
            answer: 2,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 2', marks: 1,
            text: 'Notes should be brief and precise.',
            options: ['True', 'False', 'Not sure', 'True but false'],
            answer: 0,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 3', marks: 1,
            text: '____________ is one of the communication skills.',
            options: ['Listening', 'Rapping', 'Thinking', 'Vision'],
            answer: 0,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 4', marks: 1,
            text: '____________ is an intellectual activity which entails the decoding or interpretation of the writer\'s message.',
            options: ['Singing', 'Talking', 'Reading', 'Writing'],
            answer: 2,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 5', marks: 1,
            text: '____________ contributes to building a student\'s vocabulary.',
            options: ['Chatting', 'Synonyms', 'Reading', 'Sameness'],
            answer: 2,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 6', marks: 1,
            text: 'One of the methods of reading is ____________.',
            options: ['Flipping', 'Scanning', 'Abnormal reading', 'Reading'],
            answer: 1,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 7', marks: 1,
            text: '____________ is a system of arbitrary vocal symbols by means of which a social group communicates.',
            options: ['Diction', 'Language', 'Paragraph', 'Word classes'],
            answer: 1,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 8', marks: 1,
            text: 'Is language an inseparable part of human society?',
            options: ['False', 'True', 'None of the above', 'Not sure'],
            answer: 1,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 9', marks: 1,
            text: 'We agreed ____________ our principal that there was no need for the demonstration.',
            options: ['In', 'With', 'To', 'From'],
            answer: 1,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 10', marks: 1,
            text: 'Language is ____________',
            options: ['Antisocial', 'Arbitrary', 'Static', 'Not creative'],
            answer: 1,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 11', marks: 1,
            text: '____________ is an essential part of communication.',
            options: ['Trading skill', 'Memorizing skill', 'Writing skill', 'Observing skill'],
            answer: 2,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 12', marks: 1,
            text: '____________ is the process whereby an audience pays attention to the use of language and voice.',
            options: ['Talking skill', 'Reading skill', 'Listening skill', 'Writing skill'],
            answer: 2,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 13', marks: 1,
            text: '____________ are often used to indicating grammatical relationship for the purpose of effective communication.',
            options: ['Letters', 'Alphabets', 'Punctuation', 'Diction'],
            answer: 2,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 14', marks: 1,
            text: '____________ expresses particular idea in a composition.',
            options: ['A passage', 'A paragraph', 'A gap', 'A word'],
            answer: 1,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 15', marks: 1,
            text: 'Is the block and indented paragraphs types of paragraphs?',
            options: ['False', 'True', 'Not sure', 'None of the above'],
            answer: 1,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 16', marks: 1,
            text: 'Friendly letters could be referred to as ___________',
            options: ['Formal', 'Semi formal', 'Informal', 'Official'],
            answer: 2,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 17', marks: 1,
            text: '____________ is one of the themes in Gloria Ernest-Samuel\'s Iheoma My Dear.',
            options: ['Infidelity', 'Greed', 'Religion', 'Beauty'],
            answer: 0,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 18', marks: 1,
            text: 'Gloria Ernest-Samuel\'s Iheoma My Dear is written in form of a ____________.',
            options: ['Poem', 'Letter', 'Essay', 'Article'],
            answer: 1,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 19', marks: 1,
            text: '____________ is the wife of Victor in The Mandate.',
            options: ['Laura', 'Chioma', 'Mary', 'Joy'],
            answer: 0,
          },
          {
            section: 'A', type: 'mcq', label: 'Question 20', marks: 1,
            text: '____________ is one of the themes in The Mandate.',
            options: ['Corruption', 'Religion', 'Cultism', 'Family'],
            answer: 0,
          },

          // ── Section B essays ───────────────────────────────────────────────
          {
            section: 'B1', type: 'essay', label: 'Question 1A', marks: 10,
            text: 'In approximately 200 words, write an essay on: My Experience in Topfaith University.',
            rubric: 'This is a personal, creative essay - there is no single correct answer. Grade based on these criteria: (1) Relevance: the essay should describe experiences, observations, or reflections about life at Topfaith University or university life in general. (2) Organisation: a clear introduction, body, and conclusion. (3) Word count: approximately 200 words. (4) Clarity and coherence: sentences should be readable and flow logically. (5) Personal reflection: the student shares genuine thoughts or feelings. GRADING GUIDE - be very generous: award 8–10/10 for any sincere, organised, on-topic essay; award 5–7/10 for essays that are relevant but poorly organised or very short; reserve 4/10 or below only for completely off-topic or blank attempts. Do NOT penalise grammar, spelling, or capitalisation errors.',
          },
          {
            section: 'B1', type: 'essay', label: 'Question 1B', marks: 10,
            text: 'Re-write and punctuate the passage below:\n on Thursday, 27th april, 2023 the US embassy based in lagos released a security notice to americans in nigeria urging vigilance amidst the high level of crime and insecurity in nigeria. the alert Also highlighted how armed robbers are disturbing lagos, the countrys commercial capital Other countries like australia, canada and the Uk also released messages cautioning their citizens not just in lagos but also in cities like akwa ibom, kano, rivers and imo.',
            modelAnswer: 'On Thursday, 27th April, 2023, the US Embassy based in Lagos released a security notice to Americans in Nigeria, urging vigilance amidst the high level of crime and insecurity in Nigeria. The alert also highlighted how armed robbers are disturbing Lagos, the country\'s commercial capital. Other countries like Australia, Canada and the UK also released messages cautioning their citizens not just in Lagos but also in cities like Akwa Ibom, Kano, Rivers and Imo. Award marks for: correct capitalisation of proper nouns (Thursday, April, US Embassy, Lagos, Americans, Nigeria, Australia, Canada, UK, Akwa Ibom, Kano, Rivers, Imo); correct apostrophe in "country\'s"; correct full stops and commas; correct lowercasing of "also". Be generous - award partial marks for each correct fix.',
          },
          {
            section: 'B2', type: 'essay', label: 'Question 2', marks: 15,
            text: '(a) Identify the parts of speech to which the underlined words belong:\n(i) <u>He</u> is my boss.\n(ii) Mr. Okon came <u>yesterday</u>.\n(iii) The <u>Chairman</u> has arrived.\n(iv) The Vice Chancellor will <u>address</u> all year one students today.\n(v) My parents will be <u>happy</u> to see you. (5 marks)\n\n(b) List and explain FIVE uses of English in Nigeria. (10 marks)',
            modelAnswer: '(a) Parts of speech:\n(i) "He" - Pronoun (personal pronoun, subject).\n(ii) "yesterday" - Adverb (modifies the verb "came", indicating time).\n(iii) "Chairman" - Noun (proper noun, referring to a specific person).\n(iv) "address" - Verb (action word).\n(v) "happy" - Adjective (describes the parents).\n\n(b) Five uses of English in Nigeria:\n(1) Official language - English is the language of government, legislation, the judiciary, and official correspondence.\n(2) Medium of instruction - English is the language of teaching from secondary to tertiary level.\n(3) Commerce and business - English facilitates trade across Nigeria\'s diverse ethnic groups.\n(4) Mass media - Newspapers, TV and radio use English to reach a national audience.\n(5) Lingua franca - English enables communication among Nigerians from different ethnic and linguistic backgrounds.\nAward marks for any five valid, well-explained uses.',
          },
          {
            section: 'B2', type: 'essay', label: 'Question 3', marks: 15,
            text: '(a) Explain the following reading-related terms: (i) Skimming (ii) Scanning (iii) Regression (iv) Vocalization (v) SQ3R. (10 marks)\n(b) With good illustrations, differentiate between note taking and note making. (5 marks)',
            modelAnswer: '(a) Reading terms:\n(i) Skimming - rapid reading to get the general idea or overview of a text without reading every word.\n(ii) Scanning - rapid reading to locate specific information such as a name, date, or keyword.\n(iii) Regression - going back to re-read words or sentences already read; it slows reading speed.\n(iv) Vocalization - pronouncing words aloud or moving lips while reading silently; reduces reading speed.\n(v) SQ3R - Survey, Question, Read, Recite, Review: a structured study method for deep comprehension.\n\n(b) Note taking vs note making:\nNote taking is a passive, verbatim (or near-verbatim) recording of information during a lecture or from a text.\nNote making is an active process of reading, reflecting, synthesising, and creating original organised notes from multiple sources.\nThe key difference is that note making requires critical thinking whereas note taking is largely mechanical.',
          },
          {
            section: 'B2', type: 'essay', label: 'Question 4', marks: 15,
            text: '(a) Define a Paragraph. (3 marks)\n(b) Explain THREE qualities of a good paragraph. (6 marks)\n(c) Briefly explain: (i) Introductory paragraph (ii) Developmental paragraph (iii) Concluding paragraph. (6 marks)',
            modelAnswer: '(a) A paragraph is a unit of written composition consisting of one or more sentences that develop a single main idea, usually separated from other paragraphs by indentation or a blank line.\n\n(b) Three qualities of a good paragraph:\n(1) Unity - every sentence must relate to the single main idea in the topic sentence.\n(2) Coherence - sentences must flow logically from one to the next, aided by transitional words.\n(3) Adequate development - the main idea must be sufficiently explained with evidence and examples.\n\n(c) Three types:\n(i) Introductory paragraph - opens the essay, provides background context, and usually ends with a thesis statement previewing the argument.\n(ii) Developmental (body) paragraph - develops one supporting point through evidence, examples, and analysis.\n(iii) Concluding paragraph - summarises the main points, restates the thesis in different words, and provides closure without new ideas.',
          },
        ],
      },
    },
  },
}
