import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Dumbbell, ChevronDown, ChevronUp, X, Edit, ArrowRight } from 'lucide-react';
import Button from '../UI/Button';
import { supabase } from '../../lib/supabase';
import { programService } from '../../services/programService';
import ExerciseAddModal from './ExerciseAddModal';

interface ProgramDayManagerProps {
  programId: string;
  programDuration: number;
  onUpdated?: () => void;
}

interface JourData {
  id: string;
  numero_jour: number;
  programme_id: string;
}

interface ExerciseData {
  id: string;
  jour_id: string;
  nom: string;
  type: string;
  niveau: number;
  valeur_cible?: string;
  ordre?: number;
  image_url?: string;
  categorie?: string;
}

const ProgramDayManager: React.FC<ProgramDayManagerProps> = ({
  programId,
  programDuration,
  onUpdated
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [jours, setJours] = useState<JourData[]>([]);
  const [exercisesByJour, setExercisesByJour] = useState<{ [jourId: string]: ExerciseData[] }>({});
  const [expandedJours, setExpandedJours] = useState<Set<string>>(new Set());
  
  // Modal d'ajout d'exercice
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedJourId, setSelectedJourId] = useState<string | null>(null);

  // Charger les jours et leurs exercices
  useEffect(() => {
    loadProgramDays();
  }, [programId]);

  const loadProgramDays = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Récupérer tous les jours du programme
      const { data: joursData, error: joursError } = await supabase
        .from('jours')
        .select('id, numero_jour, programme_id')
        .eq('programme_id', programId)
        .order('numero_jour', { ascending: true });
      
      if (joursError) throw joursError;
      
      // Si aucun jour n'existe, créer les jours automatiquement
      if (!joursData || joursData.length === 0) {
        await createProgramDays();
        return; // loadProgramDays sera rappelé après la création
      }
      
      setJours(joursData);
      
      // Ouvrir le premier jour par défaut
      if (joursData.length > 0 && expandedJours.size === 0) {
        setExpandedJours(new Set([joursData[0].id]));
      }
      
      // 2. Pour chaque jour, récupérer les exercices
      const exercisesTemp: { [jourId: string]: ExerciseData[] } = {};
      
      for (const jour of joursData) {
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercices')
          .select('id, jour_id, nom, type, niveau, valeur_cible, ordre, image_url, categorie')
          .eq('jour_id', jour.id)
          .order('ordre', { ascending: true });
        
        if (exercisesError) {
          console.error(`Erreur lors de la récupération des exercices pour le jour ${jour.numero_jour}:`, exercisesError);
          continue;
        }
        
        exercisesTemp[jour.id] = exercisesData || [];
      }
      
      setExercisesByJour(exercisesTemp);
    } catch (err) {
      console.error('Erreur lors du chargement des jours du programme:', err);
      setError('Erreur lors du chargement des jours du programme');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Créer les jours pour le programme (initialisation)
  const createProgramDays = async () => {
    try {
      const daysToCreate = [];
      
      // Créer un jour pour chaque numéro de 1 à programDuration
      for (let i = 1; i <= programDuration; i++) {
        daysToCreate.push({
          programme_id: programId,
          numero_jour: i
        });
      }
      
      // Insérer tous les jours en une seule requête
      const { data, error } = await supabase
        .from('jours')
        .insert(daysToCreate)
        .select('id, numero_jour, programme_id');
      
      if (error) throw error;
      
      setSuccess('Jours du programme créés avec succès');
      setTimeout(() => setSuccess(null), 3000);
      
      // Recharger les jours
      loadProgramDays();
    } catch (err) {
      console.error('Erreur lors de la création des jours:', err);
      setError('Erreur lors de la création des jours');
    }
  };
  
  // Basculer l'état d'expansion d'un jour
  const toggleDayExpansion = (jourId: string) => {
    const newExpanded = new Set(expandedJours);
    
    if (newExpanded.has(jourId)) {
      newExpanded.delete(jourId);
    } else {
      newExpanded.add(jourId);
    }
    
    setExpandedJours(newExpanded);
  };
  
  // Développer tous les jours
  const expandAllDays = () => {
    const allIds = jours.map(jour => jour.id);
    setExpandedJours(new Set(allIds));
  };
  
  // Réduire tous les jours
  const collapseAllDays = () => {
    setExpandedJours(new Set());
  };
  
  // Ouvrir la modal d'ajout d'exercice pour un jour spécifique
  const openAddExerciseModal = (jourId: string) => {
    setSelectedJourId(jourId);
    setIsAddModalOpen(true);
  };
  
  // Callback après l'ajout d'un exercice
  const handleExerciseAdded = () => {
    loadProgramDays();
    if (onUpdated) onUpdated();
  };
  
  // Supprimer un exercice
  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet exercice ?')) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('exercices')
        .delete()
        .eq('id', exerciseId);
      
      if (error) throw error;
      
      setSuccess('Exercice supprimé avec succès');
      setTimeout(() => setSuccess(null), 3000);
      
      // Recharger les exercices
      loadProgramDays();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'exercice:', err);
      setError('Erreur lors de la suppression de l\'exercice');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Formater un nombre de jour avec padding
  const formatDayNumber = (day: number): string => {
    return day.toString().padStart(2, '0');
  };
  
  if (isLoading && jours.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{success}</div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">Gestion des jours et exercices</h2>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={expandAllDays}
            className="text-sm"
          >
            <ChevronDown className="w-4 h-4 mr-1" />
            Tout développer
          </Button>
          <Button
            variant="secondary"
            onClick={collapseAllDays}
            className="text-sm"
          >
            <ChevronUp className="w-4 h-4 mr-1" />
            Tout réduire
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {jours.map(jour => {
          const isExpanded = expandedJours.has(jour.id);
          const exercises = exercisesByJour[jour.id] || [];
          
          return (
            <div 
              key={jour.id} 
              className="border rounded-lg overflow-hidden"
            >
              <div 
                className={`flex justify-between items-center p-4 cursor-pointer ${
                  exercises.length ? 'bg-blue-50 hover:bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => toggleDayExpansion(jour.id)}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    exercises.length ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {formatDayNumber(jour.numero_jour)}
                  </div>
                  <div>
                    <h3 className="font-medium">Jour {jour.numero_jour}</h3>
                    <p className="text-sm text-gray-600">{exercises.length} exercice(s)</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Button
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddExerciseModal(jour.id);
                    }}
                    className="mr-2 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>
              
              {isExpanded && (
                <div className="border-t">
                  {exercises.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <Dumbbell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>Aucun exercice pour ce jour</p>
                      <Button
                        variant="primary"
                        onClick={() => openAddExerciseModal(jour.id)}
                        className="mt-2"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter un exercice
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {exercises.map(exercise => (
                        <div key={exercise.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between">
                            <div className="flex items-start">
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mr-3 text-xs flex-shrink-0">
                                {exercise.ordre || '•'}
                              </div>
                              <div>
                                <h4 className="font-medium">{exercise.nom}</h4>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {exercise.type}
                                  </span>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Niveau {exercise.niveau}
                                  </span>
                                  {exercise.categorie && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      {exercise.categorie}
                                    </span>
                                  )}
                                </div>
                                {exercise.valeur_cible && (
                                  <p className="text-sm text-gray-600 mt-2">
                                    <span className="font-medium">Objectif:</span> {exercise.valeur_cible}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDeleteExercise(exercise.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Supprimer"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          
                          {exercise.image_url && (
                            <div className="mt-3 ml-9">
                              <img
                                src={exercise.image_url}
                                alt={exercise.nom}
                                className="h-20 object-contain rounded-md"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Modal d'ajout d'exercice */}
      {isAddModalOpen && selectedJourId && (
        <ExerciseAddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          jourId={selectedJourId}
          onExerciseAdded={handleExerciseAdded}
        />
      )}
    </div>
  );
};

export default ProgramDayManager; 