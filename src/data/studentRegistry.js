// src/data/studentRegistry.js
// Maps a student's registration number -> programme + level.
// The actual course list for each student is derived from this mapping by
// looking the programme/level up in courseCatalog.js (see Auth onboarding).
//
// This is demo data for the fake-OAuth flow. Add more reg numbers here as needed.
export const studentRegistry = {
  "202500062": { name: "Daniel Bamidele", courseOS: "Computer Science", level: "100" },
};
