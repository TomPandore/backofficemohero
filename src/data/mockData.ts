import { Clan, Exercise, Program } from '../types';

export const clans: Clan[] = [
  { id: 'onotka', name: 'Onotka', color: '#3B82F6' },
  { id: 'ekloa', name: 'Ekloa', color: '#10B981' },
  { id: 'okwaho', name: 'Okwáho', color: '#F59E0B' }
];

export const exercises: Exercise[] = [
  { id: '1', name: 'Pompes', type: 'push', level: 1, zones: ['poitrine', 'épaules', 'triceps'] },
  { id: '2', name: 'Tractions', type: 'pull', level: 2, zones: ['dos', 'biceps'] },
  { id: '3', name: 'Squats', type: 'squat', level: 1, zones: ['jambes', 'fessiers'] },
  { id: '4', name: 'Gainage', type: 'core', level: 1, zones: ['abdominaux'] },
  { id: '5', name: 'Beast Position', type: 'animal_flow', level: 2, zones: ['corps entier'] },
  { id: '6', name: 'Rotation thoracique', type: 'mobilité', level: 1, zones: ['dos', 'épaules'] },
  { id: '7', name: 'Respiration carrée', type: 'respiration', level: 1, zones: ['poumons'] },
  { id: '8', name: 'Dips', type: 'push', level: 2, zones: ['poitrine', 'triceps'] },
  { id: '9', name: 'Crab Walk', type: 'animal_flow', level: 2, zones: ['corps entier'] },
  { id: '10', name: 'Ouverture hanches', type: 'mobilité', level: 1, zones: ['hanches'] }
];

export const initialPrograms: Program[] = [
  {
    id: '1',
    name: 'Programme débutant Onotka',
    description: 'Un programme parfait pour débuter avec des exercices simples mais efficaces.',
    duration: 28,
    objective: 'Renforcement général',
    clan_id: 'onotka',
    exercises: ['1', '3', '4', '7']
  },
  {
    id: '2',
    name: 'Force Ekloa avancée',
    description: 'Programme avancé pour développer la force et la mobilité.',
    duration: 42,
    objective: 'Force et mobilité',
    clan_id: 'ekloa',
    exercises: ['2', '5', '6', '8']
  },
  {
    id: '3',
    name: 'Agilité Okwáho',
    description: 'Développez votre agilité et votre fluidité de mouvement.',
    duration: 30,
    objective: 'Agilité et mouvement',
    clan_id: 'okwaho',
    exercises: ['5', '9', '10', '3']
  }
];