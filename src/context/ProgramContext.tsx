import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Program, DailyExercises } from '../types';
import { programService } from '../services/programService';

interface ProgramContextType {
  programs: Program[];
  loading: boolean;
  error: string | null;
  createProgram: (program: Omit<Program, 'id'>) => Promise<Program>;
  updateProgram: (id: string, program: Omit<Program, 'id'>) => Promise<Program>;
  deleteProgram: (id: string) => Promise<void>;
  getProgram: (id: string) => Program | undefined;
  refreshPrograms: () => Promise<void>;
  addExerciseToDay: (programId: string, day: number, exerciseId: string) => Promise<void>;
  removeExerciseFromDay: (programId: string, day: number, exerciseId: string) => Promise<void>;
  updateProgramExercises: (programId: string, exercises: DailyExercises) => Promise<void>;
}

const ProgramContext = createContext<ProgramContextType | null>(null);

export const usePrograms = () => {
  const context = useContext(ProgramContext);
  if (!context) {
    throw new Error('usePrograms doit être utilisé dans un ProgramProvider');
  }
  return context;
};

interface ProgramProviderProps {
  children: ReactNode;
}

export const ProgramProvider: React.FC<ProgramProviderProps> = ({ children }) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger la liste des programmes
  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await programService.getAll();
      setPrograms(data);
    } catch (err) {
      console.error('Erreur lors du chargement des programmes:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Charger les programmes au montage du composant
  useEffect(() => {
    fetchPrograms();
  }, []);

  // Créer un nouveau programme
  const createProgram = async (program: Omit<Program, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      
      const newProgram = await programService.create(program);
      
      // Mettre à jour la liste sans recharger tous les programmes
      setPrograms(prev => [...prev, newProgram]);
      
      return newProgram;
    } catch (err) {
      console.error('Erreur lors de la création du programme:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un programme existant
  const updateProgram = async (id: string, program: Omit<Program, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedProgram = await programService.update(id, program);
      
      // Mettre à jour la liste sans recharger tous les programmes
      setPrograms(prev => 
        prev.map(p => p.id === id ? updatedProgram : p)
      );
      
      return updatedProgram;
    } catch (err) {
      console.error(`Erreur lors de la mise à jour du programme ${id}:`, err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un programme
  const deleteProgram = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await programService.delete(id);
      
      // Mettre à jour la liste sans recharger tous les programmes
      setPrograms(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(`Erreur lors de la suppression du programme ${id}:`, err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Récupérer un programme par son ID
  const getProgram = (id: string) => {
    return programs.find(program => program.id === id);
  };
  
  // Ajouter un exercice à un jour spécifique
  const addExerciseToDay = async (programId: string, day: number, exerciseId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await programService.addExerciseToDay(programId, day, exerciseId);
      
      // Recharger les programmes pour avoir les données à jour
      await fetchPrograms();
    } catch (err) {
      console.error(`Erreur lors de l'ajout de l'exercice au jour ${day} du programme ${programId}:`, err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Retirer un exercice d'un jour spécifique
  const removeExerciseFromDay = async (programId: string, day: number, exerciseId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await programService.removeExerciseFromDay(programId, day, exerciseId);
      
      // Recharger les programmes pour avoir les données à jour
      await fetchPrograms();
    } catch (err) {
      console.error(`Erreur lors de la suppression de l'exercice du jour ${day} du programme ${programId}:`, err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour uniquement les exercices d'un programme
  const updateProgramExercises = async (programId: string, exercises: DailyExercises) => {
    try {
      setLoading(true);
      setError(null);
      
      await programService.updateProgramExercises(programId, exercises);
      
      // Mettre à jour la liste sans recharger tous les programmes
      setPrograms(prev => 
        prev.map(p => {
          if (p.id === programId) {
            return { ...p, exercises };
          }
          return p;
        })
      );
    } catch (err) {
      console.error(`Erreur lors de la mise à jour des exercices du programme ${programId}:`, err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProgramContext.Provider
      value={{
        programs,
        loading,
        error,
        createProgram,
        updateProgram,
        deleteProgram,
        getProgram,
        refreshPrograms: fetchPrograms,
        addExerciseToDay,
        removeExerciseFromDay,
        updateProgramExercises
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
};