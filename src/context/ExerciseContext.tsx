import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Exercise } from '../types';
import { exerciseService } from '../services/exerciseService';

interface ExerciseContextType {
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
  createExercise: (exercise: Omit<Exercise, 'id'>) => Promise<Exercise>;
  updateExercise: (id: string, exercise: Omit<Exercise, 'id'>) => Promise<Exercise>;
  deleteExercise: (id: string) => Promise<void>;
  getExercise: (id: string) => Exercise | undefined;
  getExercisesByIds: (ids: string[]) => Promise<Exercise[]>;
  searchExercises: (query: string) => Promise<Exercise[]>;
  refreshExercises: () => Promise<void>;
}

const ExerciseContext = createContext<ExerciseContextType | null>(null);

export const useExercises = () => {
  const context = useContext(ExerciseContext);
  if (!context) {
    throw new Error('useExercises doit être utilisé dans un ExerciseProvider');
  }
  return context;
};

interface ExerciseProviderProps {
  children: ReactNode;
}

export const ExerciseProvider: React.FC<ExerciseProviderProps> = ({ children }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger la liste des exercices
  const fetchExercises = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await exerciseService.getAll();
      setExercises(data);
    } catch (err) {
      console.error('Erreur lors du chargement des exercices:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Charger les exercices au montage du composant
  useEffect(() => {
    fetchExercises();
  }, []);

  // Créer un nouvel exercice
  const createExercise = async (exercise: Omit<Exercise, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      
      const newExercise = await exerciseService.create(exercise);
      
      // Mettre à jour la liste sans recharger tous les exercices
      setExercises(prev => [...prev, newExercise]);
      
      return newExercise;
    } catch (err) {
      console.error('Erreur lors de la création de l\'exercice:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un exercice existant
  const updateExercise = async (id: string, exercise: Omit<Exercise, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedExercise = await exerciseService.update(id, exercise);
      
      // Mettre à jour la liste sans recharger tous les exercices
      setExercises(prev => 
        prev.map(e => e.id === id ? updatedExercise : e)
      );
      
      return updatedExercise;
    } catch (err) {
      console.error(`Erreur lors de la mise à jour de l'exercice ${id}:`, err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un exercice
  const deleteExercise = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await exerciseService.delete(id);
      
      // Mettre à jour la liste sans recharger tous les exercices
      setExercises(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error(`Erreur lors de la suppression de l'exercice ${id}:`, err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Récupérer un exercice par son ID
  const getExercise = (id: string) => {
    return exercises.find(exercise => exercise.id === id);
  };
  
  // Récupérer plusieurs exercices par leurs IDs
  const getExercisesByIds = async (ids: string[]): Promise<Exercise[]> => {
    // D'abord, vérifier si tous les exercices sont déjà en cache
    const cachedExercises = exercises.filter(e => ids.includes(e.id));
    
    // Si on a tous les exercices, pas besoin d'appeler l'API
    if (cachedExercises.length === ids.length) {
      return cachedExercises;
    }
    
    // Sinon, on récupère tous les exercices demandés depuis l'API
    try {
      setLoading(true);
      return await exerciseService.getByIds(ids);
    } catch (err) {
      console.error('Erreur lors de la récupération des exercices par IDs:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Rechercher des exercices
  const searchExercises = async (query: string): Promise<Exercise[]> => {
    try {
      setLoading(true);
      setError(null);
      
      return await exerciseService.search(query);
    } catch (err) {
      console.error('Erreur lors de la recherche d\'exercices:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExerciseContext.Provider
      value={{
        exercises,
        loading,
        error,
        createExercise,
        updateExercise,
        deleteExercise,
        getExercise,
        getExercisesByIds,
        searchExercises,
        refreshExercises: fetchExercises
      }}
    >
      {children}
    </ExerciseContext.Provider>
  );
}; 