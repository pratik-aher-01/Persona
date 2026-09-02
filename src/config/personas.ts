export type PersonaStatus = 'available' | 'coming-soon';

export interface PersonaConfig {
  id: string;
  name: string;
  mode: string;
  subtitle?: string;
  status: PersonaStatus;
  description: string;
  modelUrl?: string | null;
  bgUrl?: string | null;
  genderPreference?: 'male' | 'female';
}

export const PERSONAS: PersonaConfig[] = [
  {
    id: 'technical-interview',
    name: 'Technical Interviewer',
    mode: 'TECHNICAL INTERVIEW',
    subtitle: 'Alex • Code & System Design',
    status: 'available',
    description: 'Technical Interviewer Persona for coding & system design practice.',
    modelUrl: '/models/Alex0.1.vrm',
    bgUrl: '/background/alex.png',
    genderPreference: 'male',
  },
  {
    id: 'ken-01',
    name: 'Ken 0.1',
    mode: 'LANGUAGE COACH',
    subtitle: 'Ken • Fluency & Vocabulary',
    status: 'available',
    description: 'Conversational language practice and fluency coaching with Ken 0.1.',
    modelUrl: '/models/Ken0.1.vrm',
    bgUrl: '/background/ken.png',
    genderPreference: 'male',
  },
  {
    id: 'presentation-coach',
    name: 'Presentation Coach',
    mode: 'PRESENTATION COACH',
    subtitle: 'Steve • Public Speaking',
    status: 'available',
    description: 'Presentation coaching and delivery analysis with Steve.',
    modelUrl: '/models/steve0.1.vrm',
    bgUrl: '/background/Steve.png',
    genderPreference: 'male',
  },
  {
    id: 'debate-partner',
    name: 'Debate Partner',
    mode: 'DEBATE PARTNER',
    subtitle: 'Harry • Logic & Arguments',
    status: 'available',
    description: 'Structured debate and argumentation practice with Harry.',
    modelUrl: '/models/Harry0.1.vrm',
    bgUrl: '/background/Harry.png',
    genderPreference: 'male',
  },
  {
    id: 'roleplay',
    name: 'Roleplay',
    mode: 'ROLEPLAY',
    subtitle: 'Interactive Scenarios',
    status: 'coming-soon',
    description: 'Interactive scenario-based roleplaying exercises will be available soon.',
    modelUrl: null,
    bgUrl: null,
  },
  {
    id: 'ai-tutor',
    name: 'AI Tutor',
    mode: 'AI TUTOR',
    subtitle: 'Socratic Concept Learning',
    status: 'coming-soon',
    description: 'Socratic learning and concept explanation tutoring will be available soon.',
    modelUrl: null,
    bgUrl: null,
  },
];

export function getPersonaById(id: string): PersonaConfig {
  const found = PERSONAS.find((p) => p.id === id);
  return found || PERSONAS[0];
}
