const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

db.plans = {
    free: {
      id: "free",
      name: "Free",
      price: 0,
      prompts: 30,
      featureLimits: { ppt: 3, mindmap: 5, matrix: 3, optimize: 3, masking: 5, interview: 3, workflow: 1, council: 1 },
      features: [
        "30 daily prompts limit",
        "All features unlocked (Trial)",
        "Data Masking (5/day)",
        "Interview Mode (3/day)",
        "Workflow Sequencer (1/day)",
        "Council Room (1/day)",
        "PPT Generator (3/day)",
        "Mind Maps (5/day)",
        "Matrix Simulation (3/day)",
        "Prompt Optimization (3/day)",
        "Advanced Coding (Architect)",
        "Voice Input",
        "File & Image Attachments",
        "Web Grounding Search",
        "Personality Modes"
      ]
    },
    standard: {
      id: "standard",
      name: "Basic",
      price: 99,
      duration: "1 Month",
      days: 30,
      prompts: 100,
      featureLimits: { ppt: 5, mindmap: 8, matrix: 5, optimize: 5, masking: 20, interview: 10, workflow: 0, council: 0 },
      features: [
        "100 daily prompts limit",
        "Standard processing priority",
        "Data Masking (20/day)",
        "Interview Mode (10/day)",
        "PPT Generator (5/day)",
        "Mind Maps (8/day)",
        "Matrix Simulation (5/day)",
        "Prompt Optimization (5/day)",
        "Voice Input",
        "Personality Modes",
        "Web Grounding Search",
        "Valid for 30 Days"
      ]
    },
    better: {
      id: "better",
      name: "Pro",
      price: 199,
      duration: "3 Months",
      days: 90,
      prompts: 150,
      featureLimits: { ppt: 7, mindmap: 10, matrix: 10, optimize: 10, masking: 50, interview: 30, workflow: 10, council: 0 },
      features: [
        "150 daily prompts limit",
        "Better processing priority",
        "Data Masking (50/day)",
        "Interview Mode (30/day)",
        "Workflow Sequencer (10/day)",
        "PPT Generator (7/day)",
        "Mind Maps (10/day)",
        "Matrix Simulation (10/day)",
        "Prompt Optimization (10/day)",
        "Voice Input",
        "Personality Modes",
        "Web Grounding Search",
        "File & Image Attachments",
        "Valid for 90 Days"
      ]
    },
    premium: {
      id: "premium",
      name: "Ultimate",
      price: 999,
      duration: "1 Year",
      days: 365,
      prompts: 200,
      featureLimits: { ppt: 10, mindmap: 15, matrix: -1, optimize: -1, masking: -1, interview: -1, workflow: -1, council: -1 },
      features: [
        "200 daily prompts limit",
        "Maximum processing priority",
        "Data Masking (Unlimited)",
        "Interview Mode (Unlimited)",
        "Workflow Sequencer (Unlimited)",
        "Council Room (Unlimited)",
        "PPT Generator (10/day)",
        "Mind Maps (15/day)",
        "Matrix Simulation (Unlimited)",
        "Prompt Optimization (Unlimited)",
        "Advanced Coding (Architect)",
        "Voice Input",
        "Personality Modes",
        "Web Grounding Search",
        "File & Image Attachments",
        "Live Diagrams & Mind Maps",
        "PPT Presentation Generator",
        "Valid for 365 Days"
      ]
    }
};

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('db.json updated successfully!');
