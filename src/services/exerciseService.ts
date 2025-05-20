import { supabase } from '../lib/supabase';
import { Exercise } from '../types';

// Mapper un objet de la base de données vers un objet du frontend
const mapDbExerciseToExercise = (dbExercise: any): Exercise => ({
  id: dbExercise.id,
  name: dbExercise.nom || '',
  type: dbExercise.type || 'push',
  level: dbExercise.niveau || 1,
  zones: Array.isArray(dbExercise.zones) ? dbExercise.zones : []
});

// Mapper un objet du frontend vers un objet pour la base de données
const mapExerciseToDbExercise = (exercise: Omit<Exercise, 'id'>) => ({
  nom: exercise.name,
  type: exercise.type,
  niveau: exercise.level,
  zones: Array.isArray(exercise.zones) ? exercise.zones : []
});

// Service pour les exercices
export const exerciseService = {
  // Récupérer tous les exercices
  getAll: async (): Promise<Exercise[]> => {
    try {
      const { data, error } = await supabase
        .from('exercices')
        .select('*')
        .order('nom', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(mapDbExerciseToExercise);
    } catch (error) {
      console.error('Erreur lors de la récupération des exercices:', error);
      throw error;
    }
  },

  // Récupérer un exercice par ID
  getById: async (id: string): Promise<Exercise | null> => {
    try {
      const { data, error } = await supabase
        .from('exercices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;
      
      return mapDbExerciseToExercise(data);
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'exercice ${id}:`, error);
      throw error;
    }
  },

  // Récupérer plusieurs exercices par leurs IDs
  getByIds: async (ids: string[]): Promise<Exercise[]> => {
    if (!ids.length) return [];
    
    try {
      const { data, error } = await supabase
        .from('exercices')
        .select('*')
        .in('id', ids);

      if (error) throw error;
      
      return (data || []).map(mapDbExerciseToExercise);
    } catch (error) {
      console.error('Erreur lors de la récupération des exercices par IDs:', error);
      throw error;
    }
  },

  // Créer un nouvel exercice
  create: async (exercise: Omit<Exercise, 'id'>): Promise<Exercise> => {
    try {
      const dbExercise = mapExerciseToDbExercise(exercise);
      
      const { data, error } = await supabase
        .from('exercices')
        .insert([dbExercise])
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Aucune donnée retournée après création');
      
      return mapDbExerciseToExercise(data);
    } catch (error) {
      console.error('Erreur lors de la création de l\'exercice:', error);
      throw error;
    }
  },

  // Mettre à jour un exercice
  update: async (id: string, exercise: Omit<Exercise, 'id'>): Promise<Exercise> => {
    try {
      const dbExercise = mapExerciseToDbExercise(exercise);
      
      const { data, error } = await supabase
        .from('exercices')
        .update(dbExercise)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Aucune donnée retournée après mise à jour');
      
      return mapDbExerciseToExercise(data);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'exercice ${id}:`, error);
      throw error;
    }
  },

  // Supprimer un exercice
  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('exercices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'exercice ${id}:`, error);
      throw error;
    }
  },
  
  // Rechercher des exercices par nom, type ou zone
  search: async (query: string): Promise<Exercise[]> => {
    try {
      const { data, error } = await supabase
        .from('exercices')
        .select('*')
        .or(`nom.ilike.%${query}%,type.ilike.%${query}%`)
        .order('nom', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(mapDbExerciseToExercise);
    } catch (error) {
      console.error(`Erreur lors de la recherche d'exercices:`, error);
      throw error;
    }
  }
};

export default exerciseService; 