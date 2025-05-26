import { supabase } from '../lib/supabase';

// Définition de l'interface pour les exercices de la banque
export interface BankExercise {
  id: string;
  nom: string;
  type: string;
  niveau: number;
  zones: string[];
  categorie?: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  variante?: string;
}

// Types d'exercices disponibles
export const exerciseTypes = [
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
  { value: 'squat', label: 'Squat' },
  { value: 'core', label: 'Core' },
  { value: 'Animal Flow', label: 'Animal Flow' },
  { value: 'respiration', label: 'Respiration' },
  { value: 'mobilite', label: 'Mobilité' }
];

// Service pour gérer la banque d'exercices
export const bankExercisesService = {
  // Récupérer tous les exercices de la banque
  getAll: async (): Promise<BankExercise[]> => {
    try {
      console.log("Tentative de récupération des exercices depuis la banque...");
      
      const { data, error } = await supabase
        .from('banque_exercices')
        .select('*');

      if (error) {
        console.error('Erreur lors de la récupération des exercices:', error);
        throw error;
      }
      
      // Convertir le nom en name pour la compatibilité avec l'interface existante
      const formattedData = data?.map(item => ({
        ...item,
        name: item.nom // Pour compatibilité avec les composants existants
      })) || [];
      
      console.log(`Récupération de ${formattedData.length} exercices depuis la banque`);
      return formattedData;
    } catch (error) {
      console.error('Erreur lors de la récupération des exercices de la banque:', error);
      return [];
    }
  },

  // Récupérer un exercice par ID
  getById: async (id: string): Promise<BankExercise | null> => {
    try {
      const { data, error } = await supabase
        .from('banque_exercices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          name: data.nom // Pour compatibilité
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'exercice ${id}:`, error);
      return null;
    }
  },

  // Créer un nouvel exercice dans la banque
  create: async (exercise: Omit<BankExercise, 'id'>): Promise<BankExercise | null> => {
    try {
      const { data, error } = await supabase
        .from('banque_exercices')
        .insert([{
          nom: exercise.nom,
          type: exercise.type,
          niveau: exercise.niveau,
          zones: exercise.zones || [],
          categorie: exercise.categorie,
          description: exercise.description,
          image_url: exercise.image_url,
          video_url: exercise.video_url,
          variante: exercise.variante
        }])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création de l\'exercice:', error);
        throw error;
      }
      
      if (data) {
        return {
          ...data,
          name: data.nom
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la création de l\'exercice:', error);
      throw error;
    }
  },

  // Mettre à jour un exercice
  update: async (id: string, exercise: Partial<BankExercise>): Promise<BankExercise | null> => {
    try {
      // Préparer les données pour la mise à jour
      const updateData: any = {};
      if (exercise.nom) updateData.nom = exercise.nom;
      if (exercise.type) updateData.type = exercise.type;
      if (exercise.categorie !== undefined) updateData.categorie = exercise.categorie;
      if (exercise.description !== undefined) updateData.description = exercise.description;
      if (exercise.image_url !== undefined) updateData.image_url = exercise.image_url;
      if (exercise.video_url !== undefined) updateData.video_url = exercise.video_url;
      if (exercise.variante !== undefined) updateData.variante = exercise.variante;
      
      const { data, error } = await supabase
        .from('banque_exercices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Erreur lors de la mise à jour de l'exercice ${id}:`, error);
        throw error;
      }
      
      if (data) {
        return {
          ...data,
          name: data.nom
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'exercice ${id}:`, error);
      throw error;
    }
  },

  // Supprimer un exercice
  delete: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('banque_exercices')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Erreur lors de la suppression de l'exercice ${id}:`, error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'exercice ${id}:`, error);
      return false;
    }
  },

  // Rechercher des exercices
  search: async (query: string): Promise<BankExercise[]> => {
    try {
      const { data, error } = await supabase
        .from('banque_exercices')
        .select('*')
        .ilike('nom', `%${query}%`);

      if (error) throw error;
      
      return data?.map(item => ({
        ...item,
        name: item.nom
      })) || [];
    } catch (error) {
      console.error('Erreur lors de la recherche d\'exercices:', error);
      return [];
    }
  },

  // Filtrer les exercices par type
  filterByType: async (type: string): Promise<BankExercise[]> => {
    try {
      const { data, error } = await supabase
        .from('banque_exercices')
        .select('*')
        .eq('type', type);

      if (error) throw error;
      
      return data?.map(item => ({
        ...item,
        name: item.nom
      })) || [];
    } catch (error) {
      console.error(`Erreur lors du filtrage des exercices par type ${type}:`, error);
      return [];
    }
  }
};

export default bankExercisesService; 