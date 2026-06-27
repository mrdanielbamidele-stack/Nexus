// campaignWarnings.js
// Per-course pre-test warnings shown before the student begins.
// Key naming matches testKey() output (lowercase, no spaces/hyphens).
// Any course with no entry here (or null) skips the warning screen.

export const courseWarnings = {

  // ── PHY 101 · General Physics 1 ─────────────────────────────────────────────
  phy101: {
    courseTitle: 'PHY 101 - General Physics 1',
    tagline:
      'This test covers theory and calculations, but two exam skills need ' +
      'physical tools (graph paper, force diagrams) that cannot be replicated here.',

    canTest: [
      "Definitions – space, kinetics, velocity, force, Coulomb's law, work done, power",
      "Newton's Laws of Motion – statement, implications, and equilibrium conditions",
      "Kepler's Third Law – statement and full algebraic derivation (T² = 4π²r³/GM)",
      'Dimensional analysis – checking whether equations are consistent',
      'Equations of motion – statement of all four equations and their derivation steps',
      'Numerical calculations – velocity, displacement, charge, resultant force, particle position',
      'Vector addition – resultant vector in 3D (i, j, k) and its magnitude',
      "Coulomb's Law – charge calculations in vacuum and insulating liquid",
      'Free-fall and gravity – ball-drop problems, gravitational acceleration on the Moon',
    ],

    cannotTest: [
      'Velocity-time graph sketching – graphs used to illustrate and derive the equations of motion',
      'Force diagram constructions – parallelogram rule and triangle rule drawings',
      'Reading slope, intercept, or resultant magnitude directly off a hand-drawn diagram',
    ],

    examTip:
      'Definitions and law statements are open-ended and AI-graded. ' +
      'Calculations appear as MCQ. ' +
      'Graph sketching and force diagrams appear in every PHY 101 exam – practise these on paper.',
  },

  // ── PHY 107 · General Physics Practical 1 ─────────────────────────────
  phy107: {
    courseTitle: 'PHY 107 - General Physics Practical 1',
    tagline:
      'PHY 107 is a practical exam where most marks come from graphs and tables. ' +
      'We have adapted everything we can into text-answer and MCQ format.',

    canTest: [
      'Linearising equations – algebraic steps to reach the form y = mx + c',
      'Identifying slope and intercept expressions from a linearised equation',
      'Physical significance of experimental constants (e.g. M₀ = effective mass of the spring)',
      'Statistical calculations – mean, range, and standard error of repeated readings',
      'Naming graph types from their equations – straight line, parabola, hyperbola',
      'Experimental precautions – written short-answer',
    ],

    cannotTest: [
      'Completing experimental data tables – step-by-step tabular input the platform cannot verify',
      'Plotting graphs – placing data points and drawing a best-fit line on graph paper',
      'Determining slope and intercept by reading off a plotted graph',
      'Sketching the shapes of curves on a labelled axis',
    ],

    examTip:
      'Graph-work and table completion carry the majority of PHY 107 marks and cannot be skipped ' +
      'in the real exam. Use the past questions to practise these on paper alongside this digital test.',
  },

  // ── STA 111 · Descriptive Statistics ────────────────────────────────────────
  sta111: {
    courseTitle: 'STA 111 - Descriptive Statistics',
    tagline:
      'Almost all of STA 111 can be fully assessed here – the only exceptions ' +
      'are questions that require drawing statistical charts.',

    canTest: [
      'Index numbers – definition, four uses, and Laspeyres Price Index calculation',
      'Setting up frequency tables with class boundaries and cumulative frequencies',
      'Mean and standard deviation using the assumed-mean method (coded data)',
      'Median and mode estimation from grouped data – including the modal class formula',
      'Identifying the median class and calculating the median',
      "Pearson Coefficient of Skewness (k₁) – full multi-step worked calculation",
      'Skewness – definition, and describing normal, positively skewed, and negatively skewed distributions',
      'Kurtosis – definition and types (platykurtic, mesokurtic, leptokurtic)',
      'Scales of measurement – nominal, ordinal, and interval scales',
    ],

    cannotTest: [
      'Drawing histograms – requires scaled rectangular bars plotted on graph paper',
      'Drawing ogives (cumulative frequency curves) – requires plotting and a smooth curve',
      'Reading the upper quartile (Q₃) or any other value directly off a drawn ogive',
    ],

    examTip:
      'Histogram and ogive questions appear in every STA 111 exam and carry significant marks – ' +
      'they cannot be skipped. Practise drawing them on graph paper using the STA 111 past questions.',
  },

  // ── MTH 101 · Elementary Mathematics 1 ─────────────────────────────────────
  // The real exam is full theory/derivation. Campaign uses MCQ only because
  // typing step-by-step working and maths symbols on a PC is impractical.
  mth101: {
    courseTitle: 'MTH 101 - Elementary Mathematics 1',
    tagline:
      'The real MTH 101 exam is written theory - full working, proofs, and derivations. ' +
      'This test uses objective (MCQ) only because typing maths symbols and showing ' +
      'every step on a phone or PC is not practical.',

    cannotTest: [
      'Written derivations - the exam requires every step shown clearly on paper',
      'Proofs and symbolic notation - ∫, Σ, lim, dx, √ are hard to type and verify digitally',
      'Full working for calculations - partial credit in the real exam depends on shown steps',
      'Open-ended theory questions - explaining concepts in your own written words',
    ],

    examTip:
      'MCQ here tests whether you know the right answer - not whether you can derive it. ' +
      'Always practise writing full solutions with working on paper to prepare for the real exam.',
  },
}
