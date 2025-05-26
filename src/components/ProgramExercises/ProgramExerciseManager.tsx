import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, ChevronUp, Dumbbell, Calendar, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { usePrograms } from '../../context/ProgramContext';
import Button from '../UI/Button';
import { Program, DailyExercises, ProgramDay, ExerciseData } from '../../types';
import ExerciseAddModal from './ExerciseAddModal';
import { supabase } from '../../lib/supabase';
import { programService } from '../../services/programService';
import { bankExercisesService, BankExercise } from '../../services/bankExercisesService';
import { exerciceService } from '../../services/exerciceService';

// Interface pour les jours
interface JourData {
  id: string;
  numero_jour: number;
  programme_id: string;
}

interface ProgramExerciseManagerProps {
  programId: string;
  programDuration?: number;
  showBankSelector?: boolean;
  onExercisesUpdated?: () => void;
}

const ProgramExerciseManager: React.FC<ProgramExerciseManagerProps> = ({
  programId,
  programDuration = 28,
  showBankSelector = false,
  onExercisesUpdated
}) => {
  const navigate = useNavigate();
  const { getProgram } = usePrograms();
  
  const [program, setProgram] = useState<Program | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const daysPerPage = 7; // Nombre de jours affichés par page
  
  // États pour les jours et exercices
  const [jours, setJours] = useState<JourData[]>([]);
  const [exercisesByJour, setExercisesByJour] = useState<Record<string, ExerciseData[]>>({});
  const [expandedJours, setExpandedJours] = useState<Set<string>>(new Set());
  
  // États pour la modal d'ajout d'exercice
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedJourId, setSelectedJourId] = useState<string | null>(null);
  
  // Chargement initial
  useEffect(() => {
    loadProgramData();
  }, [programId]);
  
  // Calculer les jours à afficher en fonction de la pagination
  const getCurrentPageJours = () => {
    const startIdx = (currentPage - 1) * daysPerPage;
    const endIdx = startIdx + daysPerPage;
    return jours.slice(startIdx, endIdx);
  };
  
  // Navigation entre les pages de jours
  const goToNextPage = () => {
    const maxPage = Math.ceil(jours.length / daysPerPage);
    if (currentPage < maxPage) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  // Aller directement à une page spécifique
  const goToPage = (page: number) => {
    const maxPage = Math.ceil(jours.length / daysPerPage);
    if (page >= 1 && page <= maxPage) {
      setCurrentPage(page);
    }
  };
  
  // Fonction pour charger les données du programme
  const loadProgramData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Chargement du programme:", programId);
      const programData = await getProgram(programId);
      if (programData) {
        setProgram(programData);
      } else {
        setError("Programme non trouvé");
      }
      
      // Charger les jours et exercices
      await loadProgramDays();
    } catch (err) {
      console.error('Erreur lors du chargement du programme:', err);
      setError('Erreur lors du chargement du programme');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour charger les jours et exercices
  const loadProgramDays = async () => {
    setIsLoading(true);
    
    try {
      console.log("Chargement des jours pour le programme:", programId);
      
      // 1. Récupérer les jours pour ce programme
      const { data: joursData, error: joursError } = await supabase
        .from('jours')
        .select('id, numero_jour, programme_id')
        .eq('programme_id', programId)
        .order('numero_jour', { ascending: true });
      
      if (joursError) {
        console.error("Erreur lors de la récupération des jours:", joursError);
        throw joursError;
      }
      
      console.log("Jours récupérés:", joursData);
      
      // Si aucun jour n'existe, les créer
      if (!joursData || joursData.length === 0) {
        console.log("Aucun jour trouvé, création des jours pour le programme");
        await createProgramDays();
        return;
      }
      
      // Vérifier si tous les jours du programme sont présents
      const joursExistants = new Set(joursData.map(jour => jour.numero_jour));
      const joursManquants = [];
      
      // Trouver les jours manquants
      for (let i = 1; i <= programDuration; i++) {
        if (!joursExistants.has(i)) {
          joursManquants.push({
            programme_id: programId,
            numero_jour: i
          });
        }
      }
      
      // Créer les jours manquants si nécessaire
      if (joursManquants.length > 0) {
        console.log("Création des jours manquants:", joursManquants);
        
        const { data: newJours, error: createError } = await supabase
          .from('jours')
          .insert(joursManquants)
          .select('id, numero_jour, programme_id');
          
        if (createError) {
          console.error("Erreur lors de la création des jours manquants:", createError);
        } else {
          console.log("Jours manquants créés:", newJours);
          
          // Fusionner avec les jours existants
          if (newJours) {
            joursData.push(...newJours);
            // Trier par numéro de jour
            joursData.sort((a, b) => a.numero_jour - b.numero_jour);
          }
        }
      }
      
      setJours(joursData);
      
      // 2. Récupérer les exercices pour ces jours
      const jourIds = joursData.map(jour => jour.id);
      console.log("IDs des jours à interroger:", jourIds);
      
      const { data: exercicesData, error: exercicesError } = await supabase
        .from('exercices')
        .select('*')
        .in('jour_id', jourIds)
        .order('ordre', { ascending: true });
      
      if (exercicesError) {
        console.error("Erreur lors de la récupération des exercices:", exercicesError);
        throw exercicesError;
      }
      
      console.log("Exercices récupérés:", exercicesData);
      
      // Organiser les exercices par jour
      const exerciseMap: Record<string, ExerciseData[]> = {};
      
      // Initialiser le tableau pour chaque jour
      for (const jour of joursData) {
        exerciseMap[jour.id] = [];
      }
      
      // Ajouter les exercices à leur jour correspondant
      if (exercicesData) {
        for (const exercice of exercicesData) {
          const jourId = exercice.jour_id;
          if (exerciseMap[jourId]) {
            exerciseMap[jourId].push(exercice);
          }
        }
      }
      
      console.log("Structure d'exercices par jour:", exerciseMap);
      setExercisesByJour(exerciseMap);
      
      // Ouvrir le premier jour par défaut si aucun jour n'est ouvert
      if (expandedJours.size === 0 && joursData.length > 0) {
        setExpandedJours(new Set([joursData[0].id]));
      }
      
      // Si la page courante dépasse le nombre de pages disponibles, la réinitialiser
      const maxPage = Math.ceil(joursData.length / daysPerPage);
      if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des jours et exercices:", err);
      setError("Erreur lors du chargement des jours et exercices");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Créer les jours pour le programme (initialisation)
  const createProgramDays = async () => {
    try {
      // Créer un jour pour chaque numéro de 1 à programDuration
      const daysToCreate = [];
      for (let i = 1; i <= programDuration; i++) {
        daysToCreate.push({
          programme_id: programId,
          numero_jour: i
        });
      }
      
      console.log(`Création de ${daysToCreate.length} jours pour le programme ${programId}`);
      
      // Insérer tous les jours en une seule requête
      const { data, error } = await supabase
        .from('jours')
        .insert(daysToCreate)
        .select('id, numero_jour, programme_id');
      
      if (error) {
        console.error("Erreur lors de la création des jours:", error);
        setError("Erreur lors de la création des jours");
        return;
      }
      
      console.log("Jours créés:", data);
      
      if (data) {
        setJours(data);
        
        // Initialiser le map d'exercices vide pour chaque jour
        const exerciseMap: Record<string, ExerciseData[]> = {};
        for (const jour of data) {
          exerciseMap[jour.id] = [];
        }
        setExercisesByJour(exerciseMap);
        
        // Ouvrir le premier jour par défaut
        if (data.length > 0) {
          setExpandedJours(new Set([data[0].id]));
        }
      }
      
      setSuccess("Jours du programme créés avec succès");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Erreur lors de la création des jours:", err);
      setError("Erreur lors de la création des jours");
    } finally {
      setIsLoading(false);
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
  
  // Fonction pour naviguer directement à un jour spécifique
  const navigateToDay = (day: number) => {
    const pageIndex = Math.ceil(day / daysPerPage);
    setCurrentPage(pageIndex);
    
    // Trouver l'ID du jour correspondant
    const jourFound = jours.find(jour => jour.numero_jour === day);
    if (jourFound) {
      // Développer ce jour
      const newExpanded = new Set(expandedJours);
      newExpanded.add(jourFound.id);
      setExpandedJours(newExpanded);
      
      // Faire défiler jusqu'à ce jour (timeout pour laisser le temps au rendu)
      setTimeout(() => {
        const element = document.getElementById(`jour-${jourFound.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };
  
  // Callback après l'ajout d'un exercice
  const handleExerciseAdded = () => {
    loadProgramDays();
    if (onExercisesUpdated) onExercisesUpdated();
  };
  
  // Supprimer un exercice
  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('exercices')
        .delete()
        .eq('id', exerciseId);
        
      if (error) {
        console.error("Erreur lors de la suppression de l'exercice:", error);
        setError("Erreur lors de la suppression de l'exercice");
        return;
      }
      
      // Recharger les exercices
      await loadProgramDays();
      
      setSuccess("Exercice supprimé avec succès");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Erreur lors de la suppression de l'exercice:", err);
      setError("Erreur lors de la suppression de l'exercice");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Vérifier l'existence et créer si nécessaire un jour spécifique
  const checkAndCreateDay = async (dayNumber: number) => {
    try {
      // Vérifier si le jour existe déjà
      const jourExistant = jours.find(jour => jour.numero_jour === dayNumber);
      if (jourExistant) {
        return jourExistant.id;
      }
      
      // Créer le jour s'il n'existe pas
      const { data, error } = await supabase
        .from('jours')
        .insert([{ programme_id: programId, numero_jour: dayNumber }])
        .select('id')
        .single();
        
      if (error) {
        console.error(`Erreur lors de la création du jour ${dayNumber}:`, error);
        throw error;
      }
      
      // Recharger les jours
      await loadProgramDays();
      
      return data.id;
    } catch (err) {
      console.error(`Erreur lors de la vérification/création du jour ${dayNumber}:`, err);
      throw err;
    }
  };
  
  // Formater le numéro du jour
  const formatDayNumber = (day: number): string => {
    return `Jour ${day}`;
  };
  
  // Calculer la progression du programme
  const calculateProgress = () => {
    if (!jours.length) return 0;
    
    let joursAvecExercices = 0;
    
    jours.forEach(jour => {
      if (exercisesByJour[jour.id] && exercisesByJour[jour.id].length > 0) {
        joursAvecExercices++;
      }
    });
    
    return Math.round((joursAvecExercices / jours.length) * 100);
  };
  
  // Générer les numéros de page pour la pagination
  const generatePageNumbers = () => {
    const totalPages = Math.ceil(jours.length / daysPerPage);
    const pageNumbers = [];
    
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };
  
  if (isLoading && jours.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const currentPageJours = getCurrentPageJours();
  const progress = calculateProgress();
  const pageNumbers = generatePageNumbers();
  
  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-medium text-gray-800">
              Exercices du programme {program?.name && `- ${program.name}`}
            </h2>
            <p className="text-sm text-gray-500">
              {jours.length} jours au total, {daysPerPage} jours par page
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={expandAllDays}
              className="text-sm"
            >
              <ChevronDown className="h-4 w-4 mr-1" />
              Tout développer
            </Button>
            <Button
              variant="secondary"
              onClick={collapseAllDays}
              className="text-sm"
            >
              <ChevronUp className="h-4 w-4 mr-1" />
              Tout réduire
            </Button>
          </div>
        </div>
        
        {/* Barre de progression */}
        <div className="px-4 py-3 bg-gray-50 border-b">
          <div className="flex items-center">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm font-medium text-gray-600">{progress}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Progression: {jours.filter(jour => exercisesByJour[jour.id]?.length > 0).length} jours sur {jours.length} avec exercices
          </p>
        </div>
        
        {/* Navigation rapide vers les jours */}
        <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">Naviguer vers un jour:</div>
          <div className="flex gap-1 overflow-x-auto">
            {Array.from({ length: Math.min(7, programDuration) }, (_, i) => i + 1).map(day => (
              <button
                key={`quick-${day}`}
                onClick={() => navigateToDay(day)}
                className="px-2 py-1 rounded text-sm bg-gray-200 hover:bg-gray-300"
              >
                {day}
              </button>
            ))}
            {programDuration > 7 && (
              <>
                <span className="px-2 py-1">...</span>
                {Array.from({ length: Math.min(3, programDuration - 7) }, (_, i) => programDuration - 2 + i).map(day => (
                  <button
                    key={`quick-${day}`}
                    onClick={() => navigateToDay(day)}
                    className="px-2 py-1 rounded text-sm bg-gray-200 hover:bg-gray-300"
                  >
                    {day}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className={`flex items-center px-2 py-1 rounded ${
              currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Précédent
          </button>
          
          <div className="flex space-x-1">
            {pageNumbers.map(page => (
              <button
                key={`page-${page}`}
                onClick={() => goToPage(page)}
                className={`px-3 py-1 rounded ${
                  currentPage === page 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={goToNextPage}
            disabled={currentPage === Math.ceil(jours.length / daysPerPage)}
            className={`flex items-center px-2 py-1 rounded ${
              currentPage === Math.ceil(jours.length / daysPerPage) 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
        
        {/* Liste des jours avec exercices */}
        <div className="divide-y">
          {currentPageJours.map(jour => {
            const isExpanded = expandedJours.has(jour.id);
            const exercises = exercisesByJour[jour.id] || [];
            
            return (
              <div 
                key={jour.id} 
                id={`jour-${jour.id}`}
                className="border-b last:border-b-0"
              >
                <div
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 ${
                    isExpanded ? 'bg-gray-50' : ''
                  }`}
                  onClick={() => toggleDayExpansion(jour.id)}
                >
                  <div className="flex items-center">
                    <Calendar className={`w-5 h-5 mr-3 ${exercises.length > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                    <div>
                      <span className="font-medium text-gray-900">
                        {formatDayNumber(jour.numero_jour)}
                      </span>
                      <span className="ml-3 text-sm text-gray-500">
                        {exercises.length} {exercises.length > 1 ? 'exercices' : 'exercice'}
                      </span>
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
                  <div className="border-t p-4">
                    {exercises.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <Dumbbell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>Aucun exercice pour ce jour</p>
                        <Button
                          variant="secondary"
                          onClick={() => openAddExerciseModal(jour.id)}
                          className="mt-2"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Ajouter un exercice
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {exercises.map((exercise) => (
                          <div key={exercise.id} className="bg-white border rounded-lg p-3 flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{exercise.nom}</h4>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {exercise.type}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  Niveau {exercise.niveau}
                                </span>
                                {exercise.ordre && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Ordre: {exercise.ordre}
                                  </span>
                                )}
                              </div>
                              {exercise.valeur_cible && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Valeur cible: {exercise.valeur_cible}
                                </p>
                              )}
                            </div>
                            
                            <button
                              onClick={() => handleDeleteExercise(exercise.id)}
                              className="text-red-500 hover:text-red-700"
                              title="Supprimer cet exercice"
                            >
                              ×
                            </button>
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
      </div>
      
      {selectedJourId && (
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

export default ProgramExerciseManager; 