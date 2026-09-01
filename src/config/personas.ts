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
}

export const PERSONAS: PersonaConfig[] = [
  {
    id: 'technical-interview',
    name: 'Technical Interviewer',
    mode: 'TECHNICAL INTERVIEW',
    status: 'available',
    description: 'Technical Interviewer Persona for coding & system design practice.',
    modelUrl: '/models/Alex0.1.vrm',
    bgUrl: '/background/alex.png',
  },
  {
    id: 'ken-01',
    name: 'Ken 0.1',
    subtitle: 'Language Coach',
    mode: 'LANGUAGE COACH',
    status: 'available',
    description: 'Conversational language practice and fluency coaching with Ken 0.1.',
    modelUrl: '/models/Ken0.1.vrm',
    bgUrl: '/background/ken.png',
  },
  {
    id: 'presentation-coach',
    name: 'Presentation Coach',
    mode: 'PRESENTATION COACH',
    status: 'coming-soon',
    description: 'Presentation coaching and delivery analysis will be available soon.',
    modelUrl: null,
    bgUrl: '/background/Steve.png',
  },
  {
    id: 'debate-partner',
    name: 'Debate Partner',
    mode: 'DEBATE PARTNER',
    status: 'coming-soon',
    description: 'Structured debate and argumentation practice will be available soon.',
    modelUrl: null,
    bgUrl: '/background/Harry.png',
  },
  {
    id: 'roleplay',
    name: 'Roleplay',
    mode: 'ROLEPLAY',
    status: 'coming-soon',
    description: 'Interactive scenario-based roleplaying exercises will be available soon.',
    modelUrl: null,
    bgUrl: null,
  },
  {
    id: 'ai-tutor',
    name: 'AI Tutor',
    mode: 'AI TUTOR',
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
