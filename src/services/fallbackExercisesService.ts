import { BankExercise } from './bankExercisesService';

// Données statiques d'exercices pour le fallback
const staticExercises: BankExercise[] = [
  {
    id: 'fallback-1',
    name: 'Pompes',
    type: 'push',
    level: 1,
    zones: ['poitrine', 'épaules', 'triceps'],
    categorie: 'Force',
    description: 'Exercice classique de push-up',
    image_url: ''
  },
  {
    id: 'fallback-2',
    name: 'Tractions',
    type: 'pull',
    level: 2,
    zones: ['dos', 'biceps'],
    categorie: 'Force',
    description: 'Exercice de traction à la barre fixe',
    image_url: ''
  },
  {
    id: 'fallback-3',
    name: 'Squats',
    type: 'squat',
    level: 1,
    zones: ['cuisses', 'fessiers'],
    categorie: 'Force',
    description: 'Exercice de squat basique',
    image_url: ''
  },
  {
    id: 'fallback-4',
    name: 'Planche',
    type: 'core',
    level: 1,
    zones: ['abdominaux', 'lombaires'],
    categorie: 'Gainage',
    description: 'Exercice de gainage ventral',
    image_url: ''
  },
  {
    id: 'fallback-5',
    name: 'Burpees',
    type: 'push',
    level: 3,
    zones: ['full-body'],
    categorie: 'Cardio',
    description: 'Exercice complet combinant squat, pompe et saut',
    image_url: ''
  },
  {
    id: 'fallback-6',
    name: 'Mountain Climber',
    type: 'core',
    level: 2,
    zones: ['abdominaux', 'cardio'],
    categorie: 'Cardio',
    description: 'Gainage dynamique avec mouvement des jambes',
    image_url: ''
  },
  {
    id: 'fallback-7',
    name: 'Fentes',
    type: 'squat',
    level: 1,
    zones: ['cuisses', 'fessiers'],
    categorie: 'Force',
    description: 'Exercice de fente avant',
    image_url: ''
  },
  {
    id: 'fallback-8',
    name: 'Dips',
    type: 'push',
    level: 2,
    zones: ['triceps', 'épaules', 'pectoraux'],
    categorie: 'Force',
    description: 'Exercice de force pour le haut du corps',
    image_url: ''
  }
];

// Service fallback pour la banque d'exercices
export const fallbackExercisesService = {
  // Récupérer tous les exercices
  getAll: async (): Promise<BankExercise[]> => {
    console.log('Utilisation du service de fallback pour les exercices');
    return staticExercises;
  },

  // Récupérer un exercice par ID
  getById: async (id: string): Promise<BankExercise | null> => {
    const exercise = staticExercises.find(ex => ex.id === id);
    return exercise || null;
  },

  // Rechercher des exercices
  search: async (query: string): Promise<BankExercise[]> => {
    const lowerQuery = query.toLowerCase();
    return staticExercises.filter(ex => 
      ex.name.toLowerCase().includes(lowerQuery) || 
      (ex.description && ex.description.toLowerCase().includes(lowerQuery)) ||
      (ex.categorie && ex.categorie.toLowerCase().includes(lowerQuery))
    );
  },

  // Filtrer les exercices par type
  filterByType: async (type: string): Promise<BankExercise[]> => {
    if (type === 'all') return staticExercises;
    return staticExercises.filter(ex => ex.type === type);
  }
};

export default fallbackExercisesService; 