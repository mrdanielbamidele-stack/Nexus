// Written / AI-graded test banks, migrated from ges101-1.html and mth101-1.html.
// Keyed by clean slug (see testKey). Each question has a `type`:
//   'essay'  -> free text, graded by the LLM against `modelAnswer`
//   'number' -> numeric input, auto-graded against `answer` (± `tolerance`)
//   'mcq'    -> options + 0-based `answer`, auto-graded
// `sections[].pick` controls scoring: 'all' counts every question; a number N
// counts only the N best answers in that section ("answer ONE/N of these").

export const campaignEssays = {
  // ── GST 111 - Communication in English Language (MCQ + essay) ───────────────
  gst111: {
    code: 'GST 111',
    title: 'Communication in English Language',
    subject: 'communication in English language (GST 111 - Communication in English Language)',
    sections: [
      { id: 'A',  label: 'Section A – All 20 questions compulsory (1 mark each)', pick: 'all' },
      { id: 'B1', label: 'Section B – Question 1 is compulsory', pick: 'all' },
      { id: 'B2', label: 'Section B – Answer any TWO of Questions 2–4 (15 marks each)', pick: 2 },
    ],
    questions: [
      // ── Section A: 20 MCQs ─────────────────────────────────────────────────
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

      // ── Section B: Compulsory Question 1 ──────────────────────────────────
      {
        section: 'B1', type: 'essay', label: 'Question 1A', marks: 10,
        text: 'In approximately 200 words, write an essay on: My Experience in Topfaith University.',
        rubric: 'This is a personal, creative essay - there is no single correct answer. Grade based on these criteria: (1) Relevance: the essay should describe experiences, observations, or reflections about life at Topfaith University or university life in general. (2) Organisation: a clear introduction, body, and conclusion. (3) Word count: approximately 200 words. (4) Clarity and coherence: sentences should be readable and flow logically. (5) Personal reflection: the student shares genuine thoughts or feelings. GRADING GUIDE - be very generous: award 8–10/10 for any sincere, organised, on-topic essay; award 5–7/10 for essays that are relevant but poorly organised or very short; reserve 4/10 or below only for completely off-topic or blank attempts. Do NOT penalise grammar, spelling, or capitalisation errors.',
      },
      {
        section: 'B1', type: 'essay', label: 'Question 1B', marks: 10,
        text: 'Re-write and punctuate the passage below:\non Thursday, 27th april, 2023 the US embassy based in lagos released a security notice to americans in nigeria urging vigilance amidst the high level of crime and insecurity in nigeria. the alert Also highlighted how armed robbers are disturbing lagos, the countrys commercial capital Other countries like australia, canada and the Uk also released messages cautioning their citizens not just in lagos but also in cities like akwa ibom, kano, rivers and imo.',
        modelAnswer: 'On Thursday, 27th April, 2023, the US Embassy based in Lagos released a security notice to Americans in Nigeria, urging vigilance amidst the high level of crime and insecurity in Nigeria. The alert also highlighted how armed robbers are disturbing Lagos, the country\'s commercial capital. Other countries like Australia, Canada and the UK also released messages cautioning their citizens not just in Lagos but also in cities like Akwa Ibom, Kano, Rivers and Imo. Award marks for: correct capitalisation of proper nouns (Thursday, April, US Embassy, Lagos, Americans, Nigeria, Australia, Canada, UK, Akwa Ibom, Kano, Rivers, Imo); correct apostrophe in "country\'s"; correct full stops and commas in appropriate places; correct lowercasing of "also" (was wrongly capitalised). Be generous - award partial marks for each correct fix.',
      },

      // ── Section B: Answer any TWO of Questions 2–4 ────────────────────────
      {
        section: 'B2', type: 'essay', label: 'Question 2', marks: 15,
        text: '(a) Identify the parts of speech to which the underlined words belong:\n(i) <u>He</u> is my boss.\n(ii) Mr. Okon came <u>yesterday</u>.\n(iii) The <u>Chairman</u> has arrived.\n(iv) The Vice Chancellor will <u>address</u> all year one students today.\n(v) My parents will be <u>happy</u> to see you. (5 marks)\n\n(b) List and explain FIVE uses of English in Nigeria. (10 marks)',
        modelAnswer: '(a) Parts of speech:\n(i) "He" - Pronoun (personal pronoun, subject).\n(ii) "yesterday" - Adverb (modifies "came", indicating time).\n(iii) "Chairman" - Noun (proper noun, referring to a specific person).\n(iv) "address" - Verb (action word indicating what the Vice Chancellor will do).\n(v) "happy" - Adjective (describes the emotional state of the parents).\n\n(b) Five uses of English in Nigeria:\n(1) Official language - English is the language of government, legislation, the judiciary, and official correspondence.\n(2) Medium of instruction - English is the language of teaching from secondary to tertiary level.\n(3) Commerce and business - English facilitates trade and communication across Nigeria\'s diverse ethnic groups.\n(4) Mass media - Newspapers, television and radio stations use English to reach a national audience.\n(5) Lingua franca - English enables communication among Nigerians from different ethnic and linguistic backgrounds.\nAward marks for any five valid, well-explained uses.',
      },
      {
        section: 'B2', type: 'essay', label: 'Question 3', marks: 15,
        text: '(a) Explain the following reading-related terms: (i) Skimming (ii) Scanning (iii) Regression (iv) Vocalization (v) SQ3R. (10 marks)\n(b) With good illustrations, differentiate between note taking and note making. (5 marks)',
        modelAnswer: '(a) Reading terms:\n(i) Skimming - rapid reading to get the general idea or overview of a text without reading every word; the reader looks at headings, topic sentences, and the first and last paragraphs.\n(ii) Scanning - rapid reading to locate specific information, such as a name, date, or keyword, without reading the whole text.\n(iii) Regression - the habit of going back to re-read words or sentences already read; it slows reading speed and should be minimised.\n(iv) Vocalization - pronouncing words aloud or moving the lips while reading silently; it reduces reading speed.\n(v) SQ3R - a structured study method: Survey (skim for overview), Question (turn headings into questions), Read (read to answer those questions), Recite (recall key points without looking), Review (re-read and check understanding).\n\n(b) Note taking vs note making:\nNote taking is a passive, verbatim (or near-verbatim) recording of information during a lecture or from a text (e.g. writing down exactly what a lecturer says).\nNote making is an active process of reading, reflecting, synthesising, and creating original organised notes from multiple sources (e.g. combining two textbook chapters into a mind map with your own headings).\nThe key difference is that note making requires critical thinking whereas note taking is largely mechanical.',
      },
      {
        section: 'B2', type: 'essay', label: 'Question 4', marks: 15,
        text: '(a) Define a Paragraph. (3 marks)\n(b) Explain THREE qualities of a good paragraph. (6 marks)\n(c) Briefly explain: (i) Introductory paragraph (ii) Developmental paragraph (iii) Concluding paragraph. (6 marks)',
        modelAnswer: '(a) A paragraph is a unit of written composition consisting of one or more sentences that develop a single main idea. It is usually separated from other paragraphs by indentation or a blank line.\n\n(b) Three qualities of a good paragraph:\n(1) Unity - every sentence in the paragraph must relate directly to the single main idea expressed in the topic sentence; irrelevant sentences break unity.\n(2) Coherence - the sentences must flow logically and smoothly from one to the next, usually achieved through transitional words (however, furthermore, in addition) and consistent use of pronouns and tenses.\n(3) Adequate development - the main idea must be sufficiently explained, supported with evidence, examples, or explanation, so the reader fully understands the point.\n\n(c) Three types of paragraph:\n(i) Introductory paragraph - the opening paragraph of an essay; it introduces the topic, provides background context, captures the reader\'s attention, and usually ends with a thesis statement that previews the essay\'s argument.\n(ii) Developmental (body) paragraph - the middle paragraphs of an essay; each develops one supporting point through evidence, examples, and analysis that support the thesis.\n(iii) Concluding paragraph - the final paragraph; it summarises the main points discussed, restates the thesis in different words, and provides a sense of closure without introducing new ideas.',
      },
    ],
  },

  // ── CSC 112 - Web Technologies I (Q1 compulsory + any 2 of Q2–Q5) ───────────
  csc112: {
    code: 'CSC 112',
    title: 'Web Technologies I',
    subject: 'web technologies (CSC 112 - Web Technologies I)',
    sections: [
      { id: 'A', label: 'Section A – Question 1 is compulsory', pick: 'all' },
      { id: 'B', label: 'Section B – Answer any TWO (2) questions', pick: 2 },
    ],
    questions: [
      {
        section: 'A', type: 'essay', label: 'Question 1', marks: 23.5,
        text: '(a) Write the HTML code for: (i) an OK button (ii) a name field (iii) a password field (iv) a dropdown list. (8 marks)\n(b) Define, by example, the complete structure of an HTML document. (8 marks)\n(c) Given a = 4 and b = 4, state the output of: (i) a != b (ii) a % b (iii) (a < b) ? a : b (iv) a < a && a == a. (7½ marks)',
        modelAnswer: '(a)(i) <button>Ok</button> (ii) <input type="text" /> (iii) <input type="password" /> (iv) <select><option>…</option></select>. (b) <!DOCTYPE HTML><html><head><title>…</title></head><body>…</body></html>. (c)(i) a != b → False (ii) a % b → 0 (iii) (a < b) ? a : b → b (4<4 is false, so returns b) (iv) a < a && a == a → False (a < a is false, so the AND short-circuits to false).',
      },
      {
        section: 'B', type: 'essay', label: 'Question 2', marks: 23.5,
        text: '(a) Write a CSS class to style: (i) a green-coloured label text (ii) a circular profile-picture avatar (iii) a box with a red-coloured shadow (iv) a button that grows on mouse-over. (8 marks)\n(b) Using a flexbox approach, write CSS to perfectly centralise an image in an oval-shaped div. (8 marks)\n(c) Programmatically show the relationship between style.css, actions.js and page.html. (7½ marks)',
        modelAnswer: '(a) .label{color:green;} .avatar{border-radius:50%;} .box{box-shadow:0 0 10px 20px red;} .button:hover{transform:scale(1.1,1.1);}. (b) .center{display:flex;justify-content:center;align-items:center;} with the div also having border-radius:50% to make it oval. (c) page.html links the other two in its <head>: <link rel="stylesheet" href="style.css"/> and <script src="actions.js"></script>. Award marks for correct syntax and understanding of the relationship between the three files.',
      },
      {
        section: 'B', type: 'essay', label: 'Question 3', marks: 23.5,
        text: '(a) Define suitable CSS selectors for: (i) <div class="class"> (ii) <span id="identity"> (iii) <div> (iv) <span>. (8 marks)\n(b) Given a = 10 and b = 20, state the output of: (i) a += b (ii) a %= b (iii) a *= 2 (iv) (a--) + 1. (8 marks)\n(c) Using CSS, define a div of size 200px by 200px, then transform it so the width is twice as large without modifying the width property. (7½ marks)',
        modelAnswer: '(a)(i) .class{} (ii) #identity{} (iii) div{} (iv) span{}. (b)(i) a += b → 30 (ii) a %= b → 10 (iii) a *= 2 → 20 (iv) (a--) + 1 → 10 (post-decrement: a is used as 9 then decremented; 9+1=10). (c) div{ width:200px; height:200px; transform:scaleX(2); } - scaleX(2) doubles the rendered width without changing the width property itself.',
      },
      {
        section: 'B', type: 'essay', label: 'Question 4', marks: 23.5,
        text: '(a) Write a JavaScript function to change the value of a div with id="div" to "Topfaith University". (11½ marks)\n(b) Write a JavaScript function to find white eggs in a basket of multi-coloured eggs (eggs are stored as strings). (12 marks)',
        modelAnswer: '(a) function changeText(){ var component = document.getElementById("div"); component.innerHTML = "Topfaith University"; } - also accept textContent or innerText. (b) var foundAt = -1; for (var i = 0; i < eggs.length; i++){ if (eggs[i] === "white"){ foundAt = i; break; } } - award marks for any correct loop structure that compares each egg to "white" and records/returns its position.',
      },
      {
        section: 'B', type: 'essay', label: 'Question 5', marks: 23.5,
        text: 'Given the loop: for(var i = 0; i <= N; i++){ … }\n(a) In a table, answer: (i) how many times the loop body executes (ii) at what value of i the loop terminates (iii) what happens if i++ is replaced with i--. (12 marks)\n(b) Using HTML, design an OTP confirmation page comprising a page header, an OTP input field and a confirm button, all centralised. (11½ marks)',
        modelAnswer: '(a)(i) The body runs N+1 times (e.g. 11 times when N = 10). (ii) The loop terminates when i = N+1 (i = 11 when N = 10) because the condition i <= N becomes false. (iii) Replacing i++ with i-- makes i decrease from 0 to -1, -2 … so i <= N stays permanently true - this creates an infinite loop. (b) <html><head><title>OTP</title></head><body style="text-align:center"><h3>OTP Confirmation</h3><input type="text" placeholder="Enter OTP"/><br/><button>Confirm</button></body></html> - accept any valid centred layout (center tag, flexbox, or text-align).',
      },
    ],
  },

  // ── GES 101 - Law, Man and Society (all essay) ──────────────────────────────
  ges101: {
    code: 'TUM-GES 101',
    title: 'Law, Man and Society',
    subject: 'university law (GES 101 - Law, Man and Society)',
    sections: [
      { id: 'A', label: 'Section A - Compulsory (answer both parts)', pick: 'all' },
      { id: 'B', label: 'Section B - Answer ONE question only',        pick: 1 },
      { id: 'C', label: 'Section C - Answer ONE question only',        pick: 1 },
    ],
    questions: [
      {
        section: 'A', type: 'essay', label: 'Question 1A', marks: 20,
        scenario: 'President Abaji appointed Senator Danga as Minister of Transportation and the National Assembly delegated regulatory power over the maritime sector to the Minister.',
        text: 'State and explain FIVE reasons the National Assembly delegated law-making power to the Minister to make regulations for the maritime sector.',
        modelAnswer: 'Five reasons for delegated legislation:\n(1) Technical complexity - maritime regulations require specialist expertise the National Assembly lacks.\n(2) Volume of business - Parliament lacks time to pass detailed regulations for every sector.\n(3) Flexibility and speed - regulations need quick amendment without waiting for parliamentary sessions.\n(4) Emergency response - the executive can respond swiftly to port or vessel safety incidents.\n(5) Experimentation - delegated legislation allows testing of rules before formal enactment.\nEach reason should be explained with reference to the maritime sector.',
      },
      {
        section: 'A', type: 'essay', label: 'Question 1B', marks: 20,
        scenario: 'Continued from the scenario above regarding delegated legislation.',
        text: 'In what FIVE ways can the law-making power delegated to the Minister be controlled?',
        modelAnswer: 'Five controls on delegated legislation:\n(1) Parliamentary scrutiny - the National Assembly can require regulations to be laid before it and can annul them.\n(2) Judicial review - courts can invalidate ultra vires regulations.\n(3) Sunset clauses - the enabling Act specifies an expiry date for delegated power.\n(4) Public consultation - the Minister must consult stakeholders before making regulations.\n(5) Publication - regulations must be gazetted so citizens can challenge them.',
      },
      {
        section: 'B', type: 'essay', label: 'Question 2', marks: 30,
        text: 'Identify and discuss the THREE main functions of law in any society. For each function, provide at least one practical example from the Nigerian legal system.',
        modelAnswer: 'Three main functions of law:\n(1) Social control - law regulates behaviour and maintains order (e.g. the Criminal Code punishing theft).\n(2) Dispute resolution - law provides peaceful mechanisms to settle conflicts (e.g. courts adjudicating contract disputes).\n(3) Social change - law is an instrument to achieve policy goals (e.g. the Land Use Act 1978 redistributing land).\nEach function needs a clear Nigerian legal example.',
      },
      {
        section: 'B', type: 'essay', label: 'Question 3', marks: 30,
        text: 'State and discuss FIVE key differences between law and morality, and give examples where Nigerian law and Nigerian moral norms may conflict.',
        modelAnswer: 'Five differences between law and morality:\n(1) Enforceability - law is backed by state sanction; morality is not.\n(2) Source - law comes from legislature/courts; morality comes from religion and culture.\n(3) Universality - law applies uniformly; moral standards vary between communities.\n(4) Precision - law is written and precise; morality is vague.\n(5) Change - law changes by legislation; morality evolves slowly.\n\nNigerian conflict examples: polygamy is legally recognised but morally condemned in some communities; abortion is largely illegal but some view it as morally justified in extreme cases.',
      },
      {
        section: 'B', type: 'essay', label: 'Question 4', marks: 30,
        text: 'Explain the TWO reasons law interferes with the freedom of the individual, and discuss whether such interference is justifiable in a democratic society like Nigeria.',
        modelAnswer: 'Two reasons law interferes with individual freedom:\n(1) To protect the rights of others - one person\'s freedom must be limited where it would harm another (e.g. laws against assault).\n(2) To promote the public good - collective interests sometimes override individual liberty (e.g. taxation).\n\nJustifiability: in a democratic society interference is justified when proportionate, non-discriminatory, and authorised by law. The 1999 Constitution allows derogation from rights only under specified conditions.',
      },
      {
        section: 'C', type: 'essay', label: 'Question 5', marks: 30,
        text: 'Define the rule of law and explain its THREE core principles as articulated by A.V. Dicey. Discuss the extent to which the rule of law is upheld or undermined in Nigeria today.',
        modelAnswer: 'Dicey\'s three principles of the Rule of Law:\n(1) Supremacy of law - no punishment except for a clear breach of law before an ordinary court.\n(2) Equality before the law - every person equally subject to law regardless of rank.\n(3) Rights flow from judicial decisions - constitutional rights result from ordinary law and courts.\n\nNigerian application: upheld through an independent judiciary; undermined by executive disobedience of court orders and state power used against political opponents. Specific Nigerian examples required.',
      },
      {
        section: 'C', type: 'essay', label: 'Question 6', marks: 30,
        text: 'Explain separation of powers: (a) THREE arms of government and their functions; (b) TWO ways checks and balances operate; (c) assess effectiveness in Nigeria.',
        modelAnswer: '(a) Three arms of government:\nLegislature - makes laws.\nExecutive - implements laws.\nJudiciary - interprets laws.\n\n(b) Two checks and balances:\n(i) Presidential veto / legislative override.\n(ii) Judicial review striking down unconstitutional acts.\n\n(c) Effectiveness in Nigeria: formally separate per the 1999 Constitution, but in practice the executive often dominates via budget releases and executive orders; judicial independence is threatened by non-compliance with court orders.',
      },
      {
        section: 'C', type: 'essay', label: 'Question 7', marks: 30,
        text: 'Write an essay on the sources of Nigerian law: (a) FOUR major sources; (b) hierarchy among them; (c) why the 1999 Constitution is supreme.',
        modelAnswer: '(a) Four major sources of Nigerian law:\n(1) The Constitution.\n(2) Legislation - Acts of National and State Assemblies.\n(3) Customary law - indigenous rules recognised by courts.\n(4) Received English law - common law, equity, statutes of general application before 1 January 1900; plus judicial precedent.\n\n(b) Hierarchy: Constitution > Federal statutes > State laws > Customary/Islamic law.\n\n(c) The 1999 Constitution is supreme because s.1(1) and (3) declares it so; any inconsistent law is void to the extent of inconsistency.',
      },
    ],
  },

  // ── PHY 101 · General Physics 1 ─────────────────────────────────────────────
  phy101: {
    code: 'TUM-PHY 101',
    title: 'General Physics 1',
    subject: 'general physics (PHY 101 – General Physics 1)',
    sections: [
      { id: 'A', label: 'Section A – Core Theory (answer all)',          pick: 'all' },
      { id: 'B', label: 'Section B – Calculations (answer all)',         pick: 'all' },
      { id: 'C', label: 'Section C – Extended Theory (answer ONE only)', pick: 1    },
    ],
    questions: [
      // ── Section A: Core Theory (essay, compulsory) ───────────────────────────
      {
        section: 'A', type: 'essay', label: 'Question 1A', marks: 10,
        text: 'Define space. State its SI unit and give one practical example of a spatial measurement.',
        modelAnswer: 'Space is the boundless three-dimensional extent in which all objects exist and all events occur; it is the medium in which physical quantities such as distance and displacement are measured. Its SI unit is the metre (m). A practical example: the distance from Lagos to Abuja is approximately 710,000 m (710 km).',
      },
      {
        section: 'A', type: 'essay', label: 'Question 1B', marks: 10,
        text: 'What is kinetics? Define each of the following and state the SI unit of each: (i) velocity, (ii) displacement, (iii) acceleration.',
        modelAnswer: 'Kinetics is the branch of mechanics that studies the motion of objects and the forces that produce that motion. (i) Velocity – the rate of change of displacement with respect to time; a vector quantity; SI unit: m/s. (ii) Displacement – the straight-line distance from the initial position to the final position with direction stated; a vector; SI unit: m. (iii) Acceleration – the rate of change of velocity with respect to time; a vector; SI unit: m/s².',
      },
      {
        section: 'A', type: 'essay', label: 'Question 1C', marks: 10,
        text: 'What is a vector quantity? Clearly differentiate between distance and displacement. Give THREE examples of vector quantities and THREE examples of scalar quantities.',
        modelAnswer: 'A vector quantity has both magnitude and direction. Distance is a scalar – the total path length covered by a body regardless of direction (SI unit: m). Displacement is a vector – the straight-line separation from start point to end point, with direction specified (SI unit: m). Vector examples: force, velocity, acceleration. Scalar examples: speed, mass, temperature.',
      },
      {
        section: 'A', type: 'essay', label: 'Question 1D', marks: 10,
        text: "State Coulomb's Law in words. Write its mathematical formula and define every symbol. State the SI unit of electric charge.",
        modelAnswer: "Coulomb's Law: the electrostatic force between two stationary point charges is directly proportional to the product of the magnitudes of the charges and inversely proportional to the square of the distance between them, acting along the line joining them. Formula: F = kq₁q₂/r², where F = electrostatic force (N), k = Coulomb's constant = 9 × 10⁹ N·m²/C², q₁ and q₂ = magnitudes of the two charges (C), r = distance between the charges (m). SI unit of electric charge: Coulomb (C).",
      },

      // ── Section B: Calculations (mcq, compulsory) ────────────────────────────
      {
        section: 'B', type: 'mcq', label: 'Question 2 (i)', marks: 3,
        text: 'The equation s = vt + ½at² is:',
        options: [
          'Dimensionally inconsistent – the terms do not have matching dimensions',
          'Dimensionally consistent – all three terms have the dimension of length [L]',
          'Dimensionally consistent – all three terms have the dimension of time [T]',
          'Impossible to check dimensionally without numerical values',
        ],
        answer: 1,
        explanation: '[s] = m; [vt] = (m/s)(s) = m; [½at²] = (m/s²)(s²) = m. All three terms carry dimension [L], so the equation is dimensionally consistent.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 2 (ii)', marks: 3,
        text: 'A stone is dropped from rest off the top of a 45 m cliff. Taking g = 10 m/s², the speed of the stone just before it hits the ground is:',
        options: ['15 m/s', '20 m/s', '25 m/s', '30 m/s'],
        answer: 3,
        explanation: 'Using v² = u² + 2as: v² = 0 + 2(10)(45) = 900, so v = √900 = 30 m/s.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 2 (iii)', marks: 3,
        text: 'A car starts from rest and accelerates uniformly at 4 m/s² for 10 s. The total distance covered is:',
        options: ['40 m', '100 m', '200 m', '400 m'],
        answer: 2,
        explanation: 'Using s = ut + ½at²: s = 0(10) + ½(4)(10²) = ½ × 4 × 100 = 200 m.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 2 (iv)', marks: 3,
        text: 'Two point charges of 3 μC and 2 μC are placed 0.3 m apart in vacuum. Taking k = 9 × 10⁹ N·m²/C², the electrostatic force between them is:',
        options: ['0.2 N', '0.4 N', '0.6 N', '1.2 N'],
        answer: 2,
        explanation: 'F = kq₁q₂/r² = (9×10⁹ × 3×10⁻⁶ × 2×10⁻⁶) / (0.3)² = (54×10⁻³) / 0.09 = 0.6 N.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 2 (v)', marks: 3,
        text: 'Two forces of 3 N and 4 N act on a body at right angles to each other. The magnitude of their resultant is:',
        options: ['3.5 N', '5 N', '7 N', '12 N'],
        answer: 1,
        explanation: 'R = √(3² + 4²) = √(9 + 16) = √25 = 5 N.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 2 (vi)', marks: 3,
        text: 'A particle moves along the x-axis according to x = 3t² + 2t (metres and seconds). Its instantaneous velocity at t = 2 s is:',
        options: ['8 m/s', '10 m/s', '14 m/s', '16 m/s'],
        answer: 2,
        explanation: 'v = dx/dt = 6t + 2. At t = 2 s: v = 6(2) + 2 = 14 m/s.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 2 (vii)', marks: 3,
        text: 'A body covers a total displacement of 120 m in 8 s. Its average velocity is:',
        options: ['12 m/s', '15 m/s', '18 m/s', '960 m/s'],
        answer: 1,
        explanation: 'v_avg = displacement / time = 120 / 8 = 15 m/s.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 2 (viii)', marks: 3,
        text: 'On the surface of the Moon, gravitational acceleration is 1.6 m/s². A rock released from rest falls 20 m. The time taken is:',
        options: ['3 s', '4 s', '5 s', '6 s'],
        answer: 2,
        explanation: 's = ½gt² → 20 = ½(1.6)t² → t² = 20/0.8 = 25 → t = 5 s.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 2 (ix)', marks: 3,
        text: "According to Newton's Law of Universal Gravitation F = GMm/r², if the distance r between two masses is doubled (everything else staying the same), the gravitational force becomes:",
        options: ['4F', '2F', 'F/2', 'F/4'],
        answer: 3,
        explanation: 'F ∝ 1/r². Doubling r means r² becomes 4r², so the new force = F/4.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 2 (x)', marks: 3,
        text: "Which of the following is the correct statement of Newton's First Law of Motion?",
        options: [
          'A body accelerates in the direction of the net force acting on it',
          'For every action there is an equal and opposite reaction',
          'A body remains in its state of rest or uniform straight-line motion unless acted upon by a net external force',
          'The rate of change of momentum of a body is proportional to the applied force',
        ],
        answer: 2,
        explanation: "Newton's First Law (Law of Inertia): without a net external force, a body at rest stays at rest and a body in motion stays in uniform straight-line motion.",
      },

      // ── Section C: Extended Theory (essay, pick 1) ───────────────────────────
      {
        section: 'C', type: 'essay', label: 'Question 3', marks: 30,
        text: 'Derive the four equations of uniform acceleration from first principles using only the definitions of velocity and acceleration. State each equation clearly before deriving it. (Algebraic derivation only – no graphical derivation is required.)',
        modelAnswer: 'Starting definitions: acceleration a = (v – u)/t; average velocity = (u + v)/2 covering displacement s in time t.\n(1) v = u + at\nFrom a = (v – u)/t, rearranging directly gives v = u + at.\n(2) s = ut + ½at²\ns = average velocity × t = ((u + v)/2) × t. Substitute v = u + at: s = ((u + u + at)/2)t = (u + ½at)t = ut + ½at².\n(3) s = vt – ½at²\nSubstitute u = v – at into s = ut + ½at²: s = (v – at)t + ½at² = vt – at² + ½at² = vt – ½at².\n(4) v² = u² + 2as\nFrom equation (1): v – u = at. From s = ((u + v)/2)t → t = 2s/(u + v). Substitute: v – u = a × 2s/(u + v) → (v – u)(v + u) = 2as → v² – u² = 2as → v² = u² + 2as.',
      },
      {
        section: 'C', type: 'essay', label: 'Question 4', marks: 30,
        text: "State Newton's Law of Universal Gravitation. Using this law and the equation for centripetal force, derive Kepler's Third Law showing that T² = (4π²/GM)r³. Define every symbol you use.",
        modelAnswer: "Newton's Law of Universal Gravitation: every two masses M and m attract each other with a force F = GMm/r², where G = 6.67 × 10⁻¹¹ N·m²/kg² (universal gravitational constant), r = distance between the centres of the masses.\nDerivation:\nFor a body of mass m in a circular orbit of radius r around a body of mass M, the gravitational force provides the centripetal force:\nGMm/r² = mv²/r  →  v² = GM/r.\nFor a circular orbit of circumference 2πr completed in period T:\nv = 2πr/T  →  v² = 4π²r²/T².\nSetting the two expressions for v² equal:\n4π²r²/T² = GM/r\nRearranging: T² = 4π²r³/GM = (4π²/GM)r³.\nThis is Kepler's Third Law: the square of the orbital period is directly proportional to the cube of the orbital radius (T² ∝ r³).",
      },
      {
        section: 'C', type: 'essay', label: 'Question 5', marks: 30,
        text: "(a) State Newton's Second and Third Laws of Motion.\n(b) Write the mathematical expression for Newton's Second Law and define each symbol.\n(c) A body of mass 5 kg is acted on by two forces: F₁ = (3i + 4j) N and F₂ = (−1i + 2j) N. Find: (i) the resultant force vector; (ii) the magnitude of the resultant force; (iii) the acceleration of the body.",
        modelAnswer: "(a) Newton's Second Law: the net force acting on a body is equal to the rate of change of its momentum; for constant mass, F = ma. Newton's Third Law: for every action force there is an equal and opposite reaction force acting on the other body.\n(b) F = ma, where F = net applied force (N), m = mass (kg), a = acceleration (m/s²).\n(c)(i) F_net = F₁ + F₂ = (3 + (−1))i + (4 + 2)j = 2i + 6j N.\n(ii) |F_net| = √(2² + 6²) = √(4 + 36) = √40 = 2√10 ≈ 6.32 N.\n(iii) a = F_net / m = (2i + 6j) / 5 = 0.4i + 1.2j m/s²; |a| = √(0.4² + 1.2²) = √(0.16 + 1.44) = √1.6 ≈ 1.26 m/s².",
      },
    ],
  },


  // ── PHY 107 ·General Physics Practical 1(Practical) ─────────────────────────────
  phy107: {
    code: 'TUM-PHY 107',
    title: 'General Physics Practical 1',
    subject: 'physics laboratory practical (PHY 107 – General Lab Physics 1)',
    sections: [
      { id: 'A', label: 'Section A – Linearisation & Analysis (answer ONE only)', pick: 1    },
      { id: 'B', label: 'Section B – Statistical Calculations (answer all)',       pick: 'all' },
      { id: 'C', label: 'Section C – Graph Identification (answer all)',            pick: 'all' },
    ],
    questions: [
      // ── Section A: Linearisation (essay, pick 1) ─────────────────────────────
      {
        section: 'A', type: 'essay', label: 'Question 1', marks: 30,
        scenario: 'A student investigates how the period T of oscillation of a mass M hanging on a spring depends on M. The spring has spring constant k and effective mass M₀. The governing equation is T = 2π√((M + M₀) / k).',
        text: '(a) Linearise the equation T = 2π√((M + M₀)/k) into the form y = mx + c. Clearly identify y, x, the slope m, and the intercept c.\n(b) Explain how you would determine the values of k and M₀ from the graph.\n(c) Explain the physical significance of M₀.',
        modelAnswer: '(a) Square both sides: T² = 4π²(M + M₀)/k = (4π²/k)M + (4π²M₀/k).\nComparing with y = mx + c: y = T², x = M, slope m = 4π²/k, intercept c = 4π²M₀/k.\n(b) From the slope m: k = 4π²/m. From the intercept c: M₀ = ck/(4π²) = c/m (since m = 4π²/k → k/4π² = 1/m).\n(c) M₀ is the effective mass of the spring – it accounts for the fact that the spring itself oscillates and therefore contributes to the total inertia of the system. It is approximately equal to one-third of the spring\'s own mass (M₀ ≈ m_spring/3). An ideal (massless) spring would give M₀ = 0.',
      },
      {
        section: 'A', type: 'essay', label: 'Question 2', marks: 30,
        scenario: 'A student investigates how the period T of a simple pendulum depends on its length L. The governing equation is T = 2π√(L/g), where g is the acceleration due to gravity.',
        text: '(a) Linearise the equation T = 2π√(L/g) into the form y = mx + c. State what is plotted on each axis and what the slope represents.\n(b) Explain how the value of g is obtained from the graph.\n(c) State TWO experimental precautions the student must observe during the experiment.',
        modelAnswer: '(a) Square both sides: T² = (4π²/g)L. Comparing with y = mx + c: y = T², x = L, slope m = 4π²/g, intercept c = 0 (a straight line through the origin).\n(b) Measure the gradient m of the T² against L graph. Then g = 4π²/m.\n(c) Precautions: (1) Ensure the pendulum swings in a single vertical plane – release it gently without pushing it sideways, otherwise the bob traces an ellipse and the period formula no longer applies. (2) Time at least 20 complete oscillations and divide by 20 to find T, rather than timing a single swing, so that the percentage error in the measurement of T is minimised.',
      },

      // ── Section B: Statistical Calculations (mcq, compulsory) ────────────────
      {
        section: 'B', type: 'mcq', label: 'Question 3 (i)', marks: 4,
        scenario: 'A student records the following four times for 10 oscillations of a mass–spring system: 10.2 s, 10.6 s, 10.4 s, 10.8 s.',
        text: 'The mean of the four readings is:',
        options: ['10.3 s', '10.4 s', '10.5 s', '10.6 s'],
        answer: 2,
        explanation: 'Mean = (10.2 + 10.6 + 10.4 + 10.8) / 4 = 42.0 / 4 = 10.5 s.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 3 (ii)', marks: 4,
        scenario: 'Using the same four readings: 10.2 s, 10.6 s, 10.4 s, 10.8 s.',
        text: 'The range of the four readings is:',
        options: ['0.4 s', '0.5 s', '0.6 s', '0.8 s'],
        answer: 2,
        explanation: 'Range = largest – smallest = 10.8 – 10.2 = 0.6 s.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 3 (iii)', marks: 4,
        scenario: 'Using the same four readings: 10.2 s, 10.6 s, 10.4 s, 10.8 s (range = 0.6 s, n = 4).',
        text: 'Using the formula SE = range / (2√n), the standard error of the mean is:',
        options: ['0.08 s', '0.10 s', '0.15 s', '0.20 s'],
        answer: 2,
        explanation: 'SE = 0.6 / (2 × √4) = 0.6 / (2 × 2) = 0.6 / 4 = 0.15 s.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 3 (iv)', marks: 4,
        text: 'When the equation T = 2π√(M/k) is squared and rearranged, the correct linear form is:',
        options: [
          'T = (2π/√k) √M',
          'T² = (4π²/k) M',
          'T = 4π²M / k',
          'T² = kM / 4π²',
        ],
        answer: 1,
        explanation: 'Squaring: T² = 4π²(M/k) = (4π²/k) M. This is y = mx + c form with y = T², x = M, and slope = 4π²/k.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 3 (v)', marks: 4,
        text: 'A T² against M graph produces a straight line with gradient 0.4 s²/kg. Taking π² ≈ 10, the spring constant k is:',
        options: ['10 N/m', '100 N/m', '250 N/m', '400 N/m'],
        answer: 1,
        explanation: 'Slope m = 4π²/k → k = 4π²/m = (4 × 10) / 0.4 = 40 / 0.4 = 100 N/m.',
      },

      // ── Section C: Graph Identification (mcq, compulsory) ────────────────────
      {
        section: 'C', type: 'mcq', label: 'Question 4 (i)', marks: 2,
        text: 'The equation y = 5x + 3 produces which type of graph?',
        options: ['Parabola', 'Hyperbola', 'Straight line', 'Exponential curve'],
        answer: 2,
        explanation: 'y = 5x + 3 is in the form y = mx + c – a straight line with gradient 5 and y-intercept 3.',
      },
      {
        section: 'C', type: 'mcq', label: 'Question 4 (ii)', marks: 2,
        text: 'The equation y = 3x² – 2x + 1 produces which type of graph?',
        options: ['Straight line', 'Parabola', 'Hyperbola', 'Cubic curve'],
        answer: 1,
        explanation: 'The highest power of x is 2 (a quadratic), so the graph is a parabola (U-shaped curve).',
      },
      {
        section: 'C', type: 'mcq', label: 'Question 4 (iii)', marks: 2,
        text: 'The equation y = 8/x produces which type of graph?',
        options: ['Straight line', 'Parabola', 'Hyperbola', 'Exponential curve'],
        answer: 2,
        explanation: 'y = 8/x is equivalent to xy = 8 (constant product) – this is a rectangular hyperbola.',
      },
      {
        section: 'C', type: 'mcq', label: 'Question 4 (iv)', marks: 2,
        text: 'A student has the relationship y = ax² + bx (where a and b are constants). To obtain a straight-line graph the student should plot:',
        options: ['y against x', 'y against x²', 'y/x against x', '√y against x'],
        answer: 2,
        explanation: 'Dividing both sides by x: y/x = ax + b. Plotting y/x on the vertical axis against x on the horizontal axis gives a straight line with gradient a and intercept b.',
      },
      {
        section: 'C', type: 'mcq', label: 'Question 4 (v)', marks: 2,
        text: 'In an experiment a student plots T² against M and obtains a straight line that passes through the origin. This result confirms that:',
        options: ['T ∝ M', 'T² ∝ M²', 'T² ∝ M', 'T ∝ M²'],
        answer: 2,
        explanation: 'A straight line of T² against M passing through the origin means T² = constant × M, i.e. T² ∝ M.',
      },
    ],
  },


  // ── STA 111 · Descriptive Statistics ────────────────────────────────────────
  sta111: {
    code: 'TUM-STA 111',
    title: 'Descriptive Statistics',
    subject: 'descriptive statistics (STA 111 – Descriptive Statistics)',
    sections: [
      { id: 'A', label: 'Section A – Core Theory (answer all)',            pick: 'all' },
      { id: 'B', label: 'Section B – Calculations (answer all)',           pick: 'all' },
      { id: 'C', label: 'Section C – Extended Analysis (answer ONE only)', pick: 1    },
    ],
    questions: [
      // ── Section A: Core Theory (essay, compulsory) ───────────────────────────
      {
        section: 'A', type: 'essay', label: 'Question 1A', marks: 15,
        text: 'Define index numbers. State and briefly explain FOUR uses of index numbers in a modern economy.',
        modelAnswer: 'An index number is a statistical measure that shows the relative change in the value of a variable compared with a base period, usually expressed as a percentage with the base period set to 100.\n\nFour uses of index numbers:\n(1) Measuring price changes and inflation - the Consumer Price Index (CPI) tracks how the general level of prices changes over time.\n(2) Comparing economic performance - index numbers allow comparison of output, standards of living, or purchasing power across countries or time periods.\n(3) Measuring changes in industrial or agricultural production - production indices track output levels over time.\n(4) Guiding government policy decisions - governments use index numbers to adjust wages, pensions, social benefits, and tax thresholds in line with price changes.',
      },
      {
        section: 'A', type: 'essay', label: 'Question 1B', marks: 15,
        text: 'Define skewness. Describe the THREE types of frequency distribution with respect to skewness, and for each type state the relationship between the mean, median, and mode.',
        modelAnswer: 'Skewness is a measure of the degree of asymmetry in a frequency distribution - it indicates the extent to which data are concentrated more on one side of the centre than the other.\n\nThree types:\n(1) Symmetrical (Normal) distribution - perfectly balanced on both sides; mean = median = mode; the histogram is a bell shape.\n(2) Positively skewed distribution - the tail extends further to the right; mean > median > mode; scores are concentrated at the lower end with a few very high values pulling the mean up.\n(3) Negatively skewed distribution - the tail extends further to the left; mean < median < mode; scores are concentrated at the higher end with a few very low values pulling the mean down.',
      },
      {
        section: 'A', type: 'essay', label: 'Question 1C', marks: 10,
        text: 'Define kurtosis. State and describe its THREE types, and name the criterion used to distinguish them.',
        modelAnswer: 'Kurtosis is a measure of the degree of peakedness or flatness of a frequency distribution relative to the normal distribution. The criterion used to compare types is excess kurtosis (kurtosis − 3).\n\nThree types:\n(1) Mesokurtic - kurtosis equal to that of the normal distribution; excess kurtosis = 0; moderate peak and tails; the normal distribution is mesokurtic.\n(2) Leptokurtic - sharper, taller peak with heavier, longer tails; excess kurtosis > 0; values more concentrated around the mean but extreme outliers are more likely.\n(3) Platykurtic - flatter, broader peak with lighter, shorter tails; excess kurtosis < 0; values more spread out with fewer extreme outliers.',
      },

      // ── Section B: Calculations (mcq, compulsory) ────────────────────────────
      {
        section: 'B', type: 'mcq', label: 'Question 2 (i)', marks: 5,
        scenario: 'The table below shows prices and quantities of three food commodities in 2020 (base year) and 2023.\nCommodity | 2020 Price P₀ | 2020 Qty Q₀ | 2023 Price P₁\nRice      | ₦200          | 5 bags      | ₦280\nBeans     | ₦150          | 4 bags      | ₦210\nYam       | ₦100          | 6 pieces    | ₦140',
        text: 'The Laspeyres Price Index for 2023 (base year = 2020) is:',
        options: ['120', '130', '140', '160'],
        answer: 2,
        explanation: 'ΣP₁Q₀ = (280×5) + (210×4) + (140×6) = 1400 + 840 + 840 = 3080.\nΣP₀Q₀ = (200×5) + (150×4) + (100×6) = 1000 + 600 + 600 = 2200.\nLaspeyres Index = (ΣP₁Q₀ / ΣP₀Q₀) × 100 = (3080/2200) × 100 = 140.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 2 (ii)', marks: 5,
        scenario: 'The following table shows the distribution of scores for 40 students.\nScore (x) | 10 | 20 | 30 | 40 | 50\nFrequency |  6 |  9 | 12 |  9 |  4\nTake assumed mean A = 30.',
        text: 'Using the assumed mean method, the mean score is:',
        options: ['28', '29', '30', '31'],
        answer: 1,
        explanation: 'd = x – 30: values are −20, −10, 0, 10, 20.\nfd: (6×−20), (9×−10), (12×0), (9×10), (4×20) = −120, −90, 0, 90, 80.\nΣfd = −120 − 90 + 0 + 90 + 80 = −40. Σf = 40.\nMean = A + Σfd/Σf = 30 + (−40/40) = 30 − 1 = 29.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 2 (iii)', marks: 5,
        scenario: 'Using the same data (Score: 10, 20, 30, 40, 50; Frequency: 6, 9, 12, 9, 4; calculated mean = 29).',
        text: 'The standard deviation of the scores is:',
        options: ['10', '11', '12', '14'],
        answer: 2,
        explanation: 'd from mean (29): −19, −9, 1, 11, 21.\nd²: 361, 81, 1, 121, 441.\nfd²: (6×361), (9×81), (12×1), (9×121), (4×441) = 2166, 729, 12, 1089, 1764.\nΣfd² = 5760. Variance = Σfd²/Σf = 5760/40 = 144. SD = √144 = 12.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 2 (iv)', marks: 5,
        text: "For a frequency distribution with mean = 45, median = 42 and standard deviation = 9, Pearson's Coefficient of Skewness (k₁) is:",
        options: ['0.5', '1.0', '1.5', '3.0'],
        answer: 1,
        explanation: 'k₁ = 3(mean − median) / SD = 3(45 − 42) / 9 = (3 × 3) / 9 = 9/9 = 1.0. The positive value indicates a positively skewed distribution.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 2 (v)', marks: 5,
        scenario: 'A frequency table for the ages of 50 workers is given below.\nClass   | 10–19 | 20–29 | 30–39 | 40–49 | 50–59\nFreq(f) |   5   |  10   |  20   |  12   |   3\nCum. f  |   5   |  15   |  35   |  47   |  50',
        text: 'The median class is:',
        options: ['10–19', '20–29', '30–39', '40–49'],
        answer: 2,
        explanation: 'N = 50, so N/2 = 25. The cumulative frequency first reaches or exceeds 25 in the class 30–39 (cumulative f = 35). Therefore the median class is 30–39.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 2 (vi)', marks: 5,
        scenario: 'Using the same table (median class 30–39): L = 30, f = 20, cumulative frequency before the class CF = 15, class width h = 10, N = 50.',
        text: 'The estimated median is:',
        options: ['32', '33', '35', '37'],
        answer: 2,
        explanation: 'Median = L + ((N/2 − CF) / f) × h = 30 + ((25 − 15) / 20) × 10 = 30 + (10/20) × 10 = 30 + 5 = 35.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 2 (vii)', marks: 5,
        scenario: 'Using the same frequency table. Modal class = 30–39 (f₁ = 20); frequency before modal class f₀ = 10; frequency after modal class f₂ = 12; class width h = 10; lower class boundary L = 30.',
        text: 'The estimated mode is:',
        options: ['33.5', '35.6', '37.2', '38.0'],
        answer: 1,
        explanation: 'Mode = L + ((f₁ − f₀) / (2f₁ − f₀ − f₂)) × h = 30 + ((20 − 10) / (40 − 10 − 12)) × 10 = 30 + (10/18) × 10 = 30 + 5.56 ≈ 35.6.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 2 (viii)', marks: 3,
        text: 'Classifying students by gender (Male / Female) is an example of which scale of measurement?',
        options: ['Nominal', 'Ordinal', 'Interval', 'Ratio'],
        answer: 0,
        explanation: 'Nominal scale assigns labels or categories with no inherent order or numerical meaning. Gender categories (Male/Female) cannot be ranked or measured – they are simply labels.',
      },
      {
        section: 'B', type: 'mcq', label: 'Question 2 (ix)', marks: 3,
        text: 'Ranking students as 1st, 2nd, 3rd, and 4th in a class examination represents which scale of measurement?',
        options: ['Nominal', 'Ordinal', 'Interval', 'Ratio'],
        answer: 1,
        explanation: 'Ordinal scale implies a meaningful order or ranking, but the intervals between ranks are not necessarily equal – we know 1st is better than 2nd but not by exactly how much.',
      },

      // ── Section C: Extended Analysis (essay, pick 1) ─────────────────────────
      {
        section: 'C', type: 'essay', label: 'Question 3', marks: 30,
        scenario: 'A frequency table for the weights (kg) of 50 factory workers is given below.\nClass   | 10–19 | 20–29 | 30–39 | 40–49 | 50–59\nFreq(f) |   5   |  10   |  20   |  12   |   3',
        text: '(a) Construct a cumulative frequency table for the data.\n(b) State the median class, giving a reason.\n(c) Estimate the median weight.\n(d) Estimate the modal weight.\n(Note: Drawing the ogive is not required here – practise that separately on graph paper.)',
        modelAnswer: '(a) Cumulative frequency table:\nClass  | f  | Cumulative f\n10–19  |  5 |  5\n20–29  | 10 | 15\n30–39  | 20 | 35\n40–49  | 12 | 47\n50–59  |  3 | 50\n(b) N = 50, N/2 = 25. The cumulative frequency first equals or exceeds 25 in the class 30–39 (CF = 35). Median class = 30–39.\n(c) Median = L + ((N/2 − CF_before) / f) × h = 30 + ((25 − 15) / 20) × 10 = 30 + (10/20) × 10 = 30 + 5 = 35 kg.\n(d) Modal class = 30–39 (highest frequency = 20). f₀ = 10, f₁ = 20, f₂ = 12, L = 30, h = 10.\nMode = 30 + ((20 − 10) / (2×20 − 10 − 12)) × 10 = 30 + (10/18) × 10 = 30 + 5.56 ≈ 35.6 kg.',
      },
      {
        section: 'C', type: 'essay', label: 'Question 4', marks: 30,
        scenario: 'The following table shows the distribution of monthly earnings (₦ thousands) for 40 employees.\nEarning (x ₦000) | 10 | 20 | 30 | 40 | 50\nFrequency        |  6 |  9 | 12 |  9 |  4',
        text: "(a) Using an assumed mean of A = 30, calculate the mean monthly earning.\n(b) Calculate the standard deviation.\n(c) The median monthly earning is ₦30,000. Using Pearson's formula k₁ = 3(mean − median) / SD, calculate the coefficient of skewness and interpret the result fully.",
        modelAnswer: "(a) d = x – 30: −20, −10, 0, 10, 20. fd: −120, −90, 0, 90, 80. Σfd = −40. Σf = 40.\nMean = 30 + (−40/40) = 30 − 1 = 29 (i.e. ₦29,000).\n(b) d from mean (29): −19, −9, 1, 11, 21. d²: 361, 81, 1, 121, 441.\nfd²: 2166, 729, 12, 1089, 1764. Σfd² = 5760.\nVariance = 5760/40 = 144. SD = √144 = 12 (i.e. ₦12,000).\n(c) k₁ = 3(29 − 30) / 12 = 3(−1)/12 = −3/12 = −0.25.\nInterpretation: the coefficient is negative (−0.25), indicating a slightly negatively skewed distribution. The mean (₦29,000) lies slightly below the median (₦30,000), meaning a small number of employees earn significantly less than the majority, pulling the mean downward. The distribution has a slight left tail.",
      },
    ],
  },
}
