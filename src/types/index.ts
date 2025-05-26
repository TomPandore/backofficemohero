export interface Clan {
  id: string;
  name: string;
  color: string;
}

export interface Exercise {
  id: string;
  name: string;
  type: 'push' | 'pull' | 'squat' | 'core' | 'Animal Flow' | 'mobilite' | 'respiration';
  level: 1 | 2 | 3;
  zones: string[];
  variante?: string;
}

export type ProgramType = 'Découverte' | 'premium' | 'premium_clan';

export interface Phase {
  titre: string;
  sous_titre: string;
  texte: string;
}

// Type pour les exercices par jour
export interface DailyExercises {
  [day: number]: string[];
}

export interface Program {
  id: string;
  name: string;
  description: string;
  duration: number;
  type: ProgramType;
  clan_id: string | null;
  tags: string[];
  results: string[];
  summary: Phase[];
  image_url?: string;
  exercises?: DailyExercises;
  niveau_difficulte?: 'easy' | 'medium' | 'hard';
  actif: boolean;
}

export interface CreateProgramFormData extends Omit<Program, 'id'> {
  image_file?: File;
}

// Type pour représenter un jour spécifique avec sa liste d'exercices
export interface ProgramDay {
  day: number;
  exercises: string[];
}

// Type pour la liste des jours d'un programme
export interface ProgramCalendar {
  programId: string;
  days: ProgramDay[];
}

// Interface pour les exercices dans un programme
export interface ExerciseData {
  id: string;
  jour_id: string;
  nom: string;
  type: string;
  niveau: number;
  valeur_cible?: string;
  ordre?: number;
  image_url?: string;
  video_url?: string;
  categorie?: string;
  description?: string;
  variante?: string;
}