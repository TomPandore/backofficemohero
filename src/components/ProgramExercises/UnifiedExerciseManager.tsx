import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Dumbbell, Calendar, Plus, Filter, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { usePrograms } from '../../context/ProgramContext';
import { exerciceService } from '../../services/exerciceService';
import { bankExercisesService, BankExercise } from '../../services/bankExercisesService';
import { Program, ExerciseData } from '../../types';
import Button from '../UI/Button';
import Modal from '../UI/Modal';

interface JourData {
  id: string;
  numero_jour: number;
  programme_id: string;
}

interface UnifiedExerciseManagerProps {
  programId: string;
  programDuration?: number;
  onExercisesUpdated?: () => void;
}

const UnifiedExerciseManager: React.FC<UnifiedExerciseManagerProps> = ({
  programId,
  programDuration = 28,
  onExercisesUpdated
}) => {
  const navigate = useNavigate();
  const { getProgram } = usePrograms();
  
  // États globaux
  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // États de l'interface
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [jours, setJours] = useState<JourData[]>([]);
  const [exercisesByJour, setExercisesByJour] = useState<Record<string, ExerciseData[]>>({});
  
  // États pour la banque d'exercices
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [bankExercises, setBankExercises] = useState<BankExercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<BankExercise[]>([]);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  
  // États pour la modal de valeur cible
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<BankExercise | null>(null);
  const [targetValue, setTargetValue] = useState('');
  
  // États pour la modal d'édition
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseData | null>(null);
  const [editFormData, setEditFormData] = useState({
    nom: '',
    description: '',
    valeur_cible: '',
    type: '',
    niveau: 1,
    variante: ''
  });
  
  // Gestionnaire d'erreurs global
  const handleError = useCallback((error: any, message: string) => {
    console.error(`${message}:`, error);
    setError(message);
    setIsLoading(false);
  }, []);

  // Gestionnaire de succès global
  const handleSuccess = useCallback((message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  }, []);
  
  // Chargement initial des données
  useEffect(() => {
    loadProgramData();
    loadBankExercises();
  }, [programId]);
  
  // Filtrage des exercices de la banque
  useEffect(() => {
    filterBankExercises();
  }, [bankExercises, selectedFilter, searchQuery]);

  // Chargement des données du programme
  const loadProgramData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Charger les informations de base du programme
      const programData = await getProgram(programId);
      if (programData) {
        setProgram(programData);
      } else {
        throw new Error("Programme non trouvé");
      }
      
      // Charger les jours et exercices
      await loadJoursEtExercices();
    } catch (err) {
      handleError(err, 'Erreur lors du chargement du programme');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Chargement des jours et exercices
  const loadJoursEtExercices = async () => {
    try {
      // 1. Récupérer les jours du programme
      const { data: joursData, error: joursError } = await supabase
        .from('jours')
        .select('id, numero_jour, programme_id')
        .eq('programme_id', programId)
        .order('numero_jour', { ascending: true });
      
      if (joursError) throw joursError;
      
      // Vérifier s'il faut créer les jours manquants
      if (!joursData || joursData.length === 0) {
        await createJours();
        return; // La fonction sera rappelée après création
      }
      
      // Vérifier que tous les jours existent
      const existingDays = new Set(joursData.map(j => j.numero_jour));
      const missingDays = [];
      
      for (let i = 1; i <= programDuration; i++) {
        if (!existingDays.has(i)) {
          missingDays.push({
            programme_id: programId,
            numero_jour: i
          });
        }
      }
      
      // Créer les jours manquants si nécessaire
      if (missingDays.length > 0) {
        const { data: newJours, error: createError } = await supabase
          .from('jours')
          .insert(missingDays)
          .select('id, numero_jour, programme_id');
        
        if (createError) {
          console.error("Erreur lors de la création des jours manquants:", createError);
        } else if (newJours) {
          // Fusionner et trier tous les jours
          joursData.push(...newJours);
          joursData.sort((a, b) => a.numero_jour - b.numero_jour);
        }
      }
      
      setJours(joursData);
      
      // 2. Récupérer les exercices pour tous les jours
      const jourIds = joursData.map(j => j.id);
      
      const { data: exercicesData, error: exercicesError } = await supabase
        .from('exercices')
        .select('*')
        .in('jour_id', jourIds)
        .order('ordre', { ascending: true });
      
      if (exercicesError) throw exercicesError;
      
      // Organiser les exercices par jour
      const exerciseMap: Record<string, ExerciseData[]> = {};
      
      // Initialiser tous les jours avec un tableau vide
      for (const jour of joursData) {
        exerciseMap[jour.id] = [];
      }
      
      // Ajouter les exercices à leur jour respectif
      if (exercicesData) {
        for (const exercice of exercicesData) {
          const jourId = exercice.jour_id;
          if (exerciseMap[jourId]) {
            exerciseMap[jourId].push(exercice);
          }
        }
      }
      
      setExercisesByJour(exerciseMap);
    } catch (err) {
      console.error('Erreur lors du chargement des jours et exercices:', err);
      setError('Erreur lors du chargement des jours et exercices');
    }
  };
  
  // Création des jours pour un nouveau programme
  const createJours = async () => {
    try {
      const daysToCreate = [];
      
      for (let i = 1; i <= programDuration; i++) {
        daysToCreate.push({
          programme_id: programId,
          numero_jour: i
        });
      }
      
      const { data, error } = await supabase
        .from('jours')
        .insert(daysToCreate)
        .select('id, numero_jour, programme_id');
      
      if (error) throw error;
      
      setSuccess("Jours du programme créés avec succès");
      setTimeout(() => setSuccess(null), 3000);
      
      // Recharger les jours et exercices
      await loadJoursEtExercices();
    } catch (err) {
      console.error('Erreur lors de la création des jours:', err);
      setError('Erreur lors de la création des jours');
    }
  };
  
  // Chargement de la banque d'exercices
  const loadBankExercises = async () => {
    try {
      const data = await bankExercisesService.getAll();
      
      if (data && data.length > 0) {
        setBankExercises(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de la banque d\'exercices:', err);
    }
  };
  
  // Filtrage des exercices de la banque
  const filterBankExercises = () => {
    let filtered = [...bankExercises];
    
    // Filtrer par type
    if (selectedFilter !== 'all') {
      // Gérer les cas spéciaux
      const searchType = selectedFilter === 'mobilité' ? 'mobilite' : 
                        selectedFilter === 'Animal Flow' ? 'Animal Flow' : 
                        selectedFilter;
      filtered = filtered.filter(ex => ex.type === searchType);
    }
    
    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ex => 
        ex.nom.toLowerCase().includes(query) || 
        (ex.categorie && ex.categorie.toLowerCase().includes(query))
      );
    }
    
    setFilteredExercises(filtered);
  };
  
  // Navigation entre les jours
  const goToNextDay = () => {
    if (currentDay < programDuration) {
      setCurrentDay(prev => prev + 1);
    }
  };
  
  const goToPrevDay = () => {
    if (currentDay > 1) {
      setCurrentDay(prev => prev - 1);
    }
  };
  
  // Ouvrir la modal pour définir la valeur cible
  const handleOpenTargetModal = (exercise: BankExercise) => {
    setSelectedExercise(exercise);
    setTargetValue('10');
    setIsTargetModalOpen(true);
  };
  
  // Fermer la modal
  const handleCloseTargetModal = () => {
    setIsTargetModalOpen(false);
    setSelectedExercise(null);
    setTargetValue('');
  };
  
  // Ajouter l'exercice avec la valeur cible définie
  const handleConfirmAddExercise = async () => {
    if (!selectedExercise) return;
    
    // Trouver l'ID du jour correspondant au jour actuel
    const jourInfo = jours.find(j => j.numero_jour === currentDay);
    if (!jourInfo) {
      setError(`Jour ${currentDay} non trouvé`);
      return;
    }
    
    setIsLoading(true);
    setIsTargetModalOpen(false);
    
    try {
      // Préparer les données de l'exercice
      const exerciceData = {
        nom: selectedExercise.nom || 'Exercice sans nom',
        type: selectedExercise.type,
        niveau: 1, // Niveau par défaut
        // Attribuer un ordre en fonction du nombre d'exercices existants
        ordre: (exercisesByJour[jourInfo.id]?.length || 0) + 1,
        description: selectedExercise.description,
        categorie: selectedExercise.categorie,
        image_url: selectedExercise.image_url,
        video_url: selectedExercise.video_url,
        variante: selectedExercise.variante,
        valeur_cible: targetValue // Valeur définie par l'utilisateur
      };
      
      // Ajouter l'exercice avec le service amélioré
      const result = await exerciceService.addExercice(jourInfo.id, exerciceData);
      
      if (result.success) {
        setSuccess(`${selectedExercise.nom} ajouté au jour ${currentDay}`);
        await loadJoursEtExercices(); // Recharger les données
        
        if (onExercisesUpdated) {
          onExercisesUpdated();
        }
      } else {
        setError(`Erreur lors de l'ajout de l'exercice: ${typeof result.error === 'object' ? 'erreur système' : result.error || 'erreur inconnue'}`);
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'exercice:', err);
      setError('Erreur lors de l\'ajout de l\'exercice');
    } finally {
      setIsLoading(false);
      setSelectedExercise(null);
      setTargetValue('');
    }
  };
  
  // Suppression d'un exercice
  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet exercice ?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('exercices')
        .delete()
        .eq('id', exerciseId);
      
      if (error) throw error;
      
      setSuccess('Exercice supprimé avec succès');
      await loadJoursEtExercices(); // Recharger les données
      
      if (onExercisesUpdated) {
        onExercisesUpdated();
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'exercice:', err);
      setError('Erreur lors de la suppression de l\'exercice');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Obtenir les exercices pour le jour actuel
  const getCurrentDayExercises = (): ExerciseData[] => {
    const jourInfo = jours.find(j => j.numero_jour === currentDay);
    if (!jourInfo) return [];
    
    return exercisesByJour[jourInfo.id] || [];
  };
  
  // Obtenir le pourcentage de progression
  const getProgress = (): number => {
    if (!jours.length) return 0;
    
    let joursAvecExercices = 0;
    
    jours.forEach(jour => {
      if (exercisesByJour[jour.id] && exercisesByJour[jour.id].length > 0) {
        joursAvecExercices++;
      }
    });
    
    return Math.round((joursAvecExercices / jours.length) * 100);
  };
  
  // Ouvrir la modal d'édition
  const handleOpenEditModal = (exercise: ExerciseData) => {
    try {
      console.log('Opening edit modal for exercise:', exercise);
      setEditingExercise(exercise);
      setEditFormData({
        nom: exercise.nom || '',
        description: exercise.description || '',
        valeur_cible: exercise.valeur_cible || '',
        type: exercise.type || '',
        niveau: exercise.niveau || 1,
        variante: exercise.variante || ''
      });
      setIsEditModalOpen(true);
    } catch (err) {
      console.error('Error opening edit modal:', err);
      setError('Erreur lors de l\'ouverture de la modal d\'édition');
    }
  };

  // Fermer la modal d'édition
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingExercise(null);
    setEditFormData({
      nom: '',
      description: '',
      valeur_cible: '',
      type: '',
      niveau: 1,
      variante: ''
    });
  };

  // Mettre à jour un exercice
  const handleUpdateExercise = async () => {
    if (!editingExercise) {
      console.error('No exercise selected for update');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Updating exercise:', editingExercise.id, editFormData);
      
      const { error: updateError } = await supabase
        .from('exercices')
        .update({
          nom: editFormData.nom,
          description: editFormData.description,
          valeur_cible: editFormData.valeur_cible,
          type: editFormData.type,
          niveau: editFormData.niveau,
          variante: editFormData.variante
        })
        .eq('id', editingExercise.id);
      
      if (updateError) throw updateError;
      
      console.log('Exercise updated successfully');
      setSuccess('Exercice modifié avec succès');
      await loadJoursEtExercices(); // Recharger les données
      
      if (onExercisesUpdated) {
        onExercisesUpdated();
      }
      
      handleCloseEditModal();
    } catch (err) {
      console.error('Error updating exercise:', err);
      setError('Erreur lors de la modification de l\'exercice');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Ajouter cette fonction pour réorganiser les exercices
  const handleReorderExercise = async (exerciseId: string, currentIndex: number, direction: 'up' | 'down') => {
    const jourInfo = jours.find(j => j.numero_jour === currentDay);
    if (!jourInfo) return;
    
    const currentExercises = [...(exercisesByJour[jourInfo.id] || [])];
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= currentExercises.length) return;
    
    // Échanger les positions
    [currentExercises[currentIndex], currentExercises[newIndex]] = 
    [currentExercises[newIndex], currentExercises[currentIndex]];
    
    // Mettre à jour l'ordre dans la base de données
    try {
      setIsLoading(true);
      
      // Mettre à jour l'ordre de tous les exercices affectés
      for (let i = 0; i < currentExercises.length; i++) {
        await supabase
          .from('exercices')
          .update({ ordre: i + 1 })
          .eq('id', currentExercises[i].id);
      }
      
      await loadJoursEtExercices();
      setSuccess('Ordre des exercices mis à jour');
    } catch (err) {
      console.error('Erreur lors de la réorganisation:', err);
      setError('Erreur lors de la réorganisation des exercices');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Si chargement initial
  if (isLoading && jours.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Types d'exercices pour le filtre
  const exerciseTypes = [
    { value: 'all', label: 'Tous' },
    { value: 'push', label: 'Push' },
    { value: 'pull', label: 'Pull' },
    { value: 'squat', label: 'Squat' },
    { value: 'core', label: 'Core' },
    { value: 'Animal Flow', label: 'Animal Flow' },
    { value: 'mobilite', label: 'Mobilité' },
    { value: 'respiration', label: 'Respiration' }
  ];
  
  const currentExercises = getCurrentDayExercises();
  const progress = getProgress();
  
  // Récupérer une image de placeholder si aucune image n'est fournie
  const getImageUrl = (exercise: BankExercise): string => {
    if (exercise.image_url) return exercise.image_url;
    
    // Utiliser une image par défaut selon le type d'exercice
    switch (exercise.type) {
      case 'push': return 'https://via.placeholder.com/150?text=Pompes';
      case 'pull': return 'https://via.placeholder.com/150?text=Pull';
      case 'squat': return 'https://via.placeholder.com/150?text=Squat';
      case 'core': return 'https://via.placeholder.com/150?text=Core';
      case 'Animal Flow': return 'https://via.placeholder.com/150?text=Animal+Flow';
      case 'mobilite': return 'https://via.placeholder.com/150?text=Mobilité';
      case 'respiration': return 'https://via.placeholder.com/150?text=Respiration';
      default: return 'https://via.placeholder.com/150?text=Exercice';
    }
  };
  
  // Générer une couleur en fonction du type d'exercice
  const getTypeColor = (typeValue: string): string => {
    switch (typeValue) {
      case 'push': return 'bg-blue-500';
      case 'pull': return 'bg-purple-500';
      case 'squat': return 'bg-green-500';
      case 'core': return 'bg-orange-500';
      case 'Animal Flow': return 'bg-yellow-500';
      case 'mobilite': return 'bg-teal-500';
      case 'respiration': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };
  
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
      
      {/* Modal pour définir la valeur cible */}
      {isTargetModalOpen && selectedExercise && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
            <h3 className="text-lg font-medium mb-4">Ajouter {selectedExercise.nom}</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de répétitions / Valeur cible
              </label>
              <input
                type="text"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="ex: 10, 20, 30..."
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <div className="flex gap-1.5 mt-2 justify-between">
                {[5, 10, 20, 30, 40, 45, 50].map((value) => (
                  <button
                    key={value}
                    onClick={() => setTargetValue(value.toString())}
                    className="px-3 py-2 text-base font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded-md transition-colors border border-green-200 flex-1"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCloseTargetModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmAddExercise}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                disabled={!targetValue.trim()}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal d'édition d'exercice */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Modifier l'exercice"
        footer={
          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={handleCloseEditModal}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateExercise}
              disabled={isLoading}
            >
              {isLoading ? 'Mise à jour...' : 'Enregistrer'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'exercice
            </label>
            <input
              type="text"
              value={editFormData.nom}
              onChange={(e) => setEditFormData({...editFormData, nom: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editFormData.description}
              onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variante plus facile
            </label>
            <textarea
              value={editFormData.variante}
              onChange={(e) => setEditFormData({...editFormData, variante: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Décrivez une variante plus facile de cet exercice..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de répétitions / Valeur cible
            </label>
            <input
              type="text"
              value={editFormData.valeur_cible}
              onChange={(e) => setEditFormData({...editFormData, valeur_cible: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type d'exercice
            </label>
            <select
              value={editFormData.type}
              onChange={(e) => setEditFormData({...editFormData, type: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            >
              {exerciseTypes.map(type => (
                type.value !== 'all' && (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                )
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveau
            </label>
            <select
              value={editFormData.niveau}
              onChange={(e) => setEditFormData({...editFormData, niveau: parseInt(e.target.value)})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>Niveau 1</option>
              <option value={2}>Niveau 2</option>
              <option value={3}>Niveau 3</option>
            </select>
          </div>
        </div>
      </Modal>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* En-tête avec progression */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium text-gray-800">
              Exercices du programme {program?.name && `- ${program.name}`}
            </h2>
            <div className="flex items-center gap-2">
              <button
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  viewMode === 'calendar' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('calendar')}
              >
                <Calendar className="h-4 w-4 inline mr-1" />
                Par jour
              </button>
              <button
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('list')}
              >
                <ChevronDown className="h-4 w-4 inline mr-1" />
                Liste complète
              </button>
              <Button
                variant="primary"
                onClick={() => setIsAddPanelOpen(!isAddPanelOpen)}
                className="ml-2"
              >
                {isAddPanelOpen ? 'Masquer exercices' : 'Ajouter exercices'}
              </Button>
            </div>
          </div>
          
          {/* Barre de progression */}
          <div className="mt-3">
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
        </div>

        {/* Interface de navigation des jours */}
        <div className="border-b bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevDay}
              disabled={currentDay === 1}
              className={`px-3 py-1 rounded flex items-center ${
                currentDay === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="ml-1 hidden sm:inline">Jour précédent</span>
            </button>
            
            <div className="flex items-center">
              <div className="font-medium text-lg">Jour {currentDay}</div>
              <span className="mx-3 text-gray-500">|</span>
              <div className="flex items-center space-x-2">
                {/* Sélecteur de jour rapide */}
                <select
                  value={currentDay}
                  onChange={(e) => setCurrentDay(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: programDuration }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>
                      Jour {day} {exercisesByJour[jours.find(j => j.numero_jour === day)?.id || '']?.length > 0 ? '✓' : ''}
                    </option>
                  ))}
                </select>

                {/* Navigation visuelle par blocs */}
                <div className="hidden md:flex items-center gap-2">
                  {/* Premiers jours */}
                  {Array.from({ length: Math.min(5, programDuration) }, (_, i) => i + 1).map(day => (
                    <button
                      key={`day-${day}`}
                      onClick={() => setCurrentDay(day)}
                      className={`h-9 w-9 aspect-square rounded-full flex items-center justify-center text-sm font-medium ${
                        currentDay === day 
                          ? 'bg-blue-600 text-white' 
                          : exercisesByJour[jours.find(j => j.numero_jour === day)?.id || '']?.length > 0
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}

                  {programDuration > 10 && (
                    <>
                      <span className="flex items-center justify-center text-gray-400 px-1">...</span>
                      
                      {/* Jours autour du jour actuel si pas dans les premiers ou derniers */}
                      {currentDay > 5 && currentDay < programDuration - 4 && (
                        <>
                          {[-1, 0, 1].map(offset => {
                            const day = currentDay + offset;
                            return (
                              <button
                                key={`day-${day}`}
                                onClick={() => setCurrentDay(day)}
                                className={`h-9 w-9 aspect-square rounded-full flex items-center justify-center text-sm font-medium ${
                                  currentDay === day 
                                    ? 'bg-blue-600 text-white' 
                                    : exercisesByJour[jours.find(j => j.numero_jour === day)?.id || '']?.length > 0
                                      ? 'bg-green-100 text-green-800 border border-green-300' 
                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                          <span className="flex items-center justify-center text-gray-400 px-1">...</span>
                        </>
                      )}

                      {/* Derniers jours */}
                      {Array.from({ length: Math.min(3, programDuration - 7) }, (_, i) => programDuration - 2 + i).map(day => (
                        <button
                          key={`day-${day}`}
                          onClick={() => setCurrentDay(day)}
                          className={`h-9 w-9 aspect-square rounded-full flex items-center justify-center text-sm font-medium ${
                            currentDay === day 
                              ? 'bg-blue-600 text-white' 
                              : exercisesByJour[jours.find(j => j.numero_jour === day)?.id || '']?.length > 0
                                ? 'bg-green-100 text-green-800 border border-green-300' 
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={goToNextDay}
              disabled={currentDay === programDuration}
              className={`px-3 py-1 rounded flex items-center ${
                currentDay === programDuration
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <span className="mr-1 hidden sm:inline">Jour suivant</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Nouvelle disposition: Layout vertical */}
        <div className="flex flex-col">
          {/* Zone d'affichage des exercices du jour */}
          <div className="p-4 border-b">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-lg">Exercices du jour {currentDay}</h3>
              <Button
                variant="primary"
                onClick={() => setIsAddPanelOpen(!isAddPanelOpen)}
                className="bg-green-600 hover:bg-green-700"
              >
                {isAddPanelOpen ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Masquer la banque
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter des exercices
                  </>
                )}
              </Button>
            </div>
            
            {currentExercises.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Dumbbell className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-3">Aucun exercice pour ce jour</p>
                <Button
                  variant="secondary"
                  onClick={() => setIsAddPanelOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter un exercice
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto px-1 py-2">
                {currentExercises.map((exercise, index) => (
                  <div key={exercise.id} 
                    className="border rounded-lg px-5 py-4 hover:shadow-md transition-shadow bg-white flex justify-between items-start"
                  >
                    <div className="flex items-start">
                      <div className="flex flex-col justify-center mr-4">
                        <button
                          onClick={() => handleReorderExercise(exercise.id, index, 'up')}
                          disabled={index === 0}
                          className={`p-2 rounded-md hover:bg-gray-100 ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600'}`}
                          title="Monter"
                        >
                          <ChevronUp className="h-6 w-6" />
                        </button>
                        <div className="h-1"></div>
                        <button
                          onClick={() => handleReorderExercise(exercise.id, index, 'down')}
                          disabled={index === currentExercises.length - 1}
                          className={`p-2 rounded-md hover:bg-gray-100 ${index === currentExercises.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600'}`}
                          title="Descendre"
                        >
                          <ChevronDown className="h-6 w-6" />
                        </button>
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center">
                          <div className="bg-gray-100 text-gray-800 h-7 w-7 rounded-full flex items-center justify-center text-sm mr-3">
                            {index + 1}
                          </div>
                          <h4 className="font-medium">{exercise.nom}</h4>
                        </div>
                        
                        {exercise.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {exercise.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {exercise.type}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Niveau {exercise.niveau}
                          </span>
                          {exercise.valeur_cible && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              {exercise.valeur_cible}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(exercise)}
                        className="text-blue-500 hover:text-blue-700 p-2.5 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Modifier cet exercice"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteExercise(exercise.id)}
                        className="text-red-500 hover:text-red-700 p-2.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Supprimer cet exercice"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Banque d'exercices (visible seulement si le panneau est ouvert) */}
          {isAddPanelOpen && (
            <div className="p-4 bg-gray-50">
              <div className="mb-4">
                <h3 className="font-medium text-lg flex items-center mb-3">
                  <Dumbbell className="h-5 w-5 mr-2 text-blue-500" />
                  Banque d'exercices
                </h3>
                
                <div className="flex flex-col gap-3 mb-3">
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un exercice..."
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="w-full">
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Filter size={14} className="mr-1" />
                      Filtrer par type:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {exerciseTypes.map(type => (
                        <button
                          key={type.value}
                          onClick={() => setSelectedFilter(type.value)}
                          className={`px-3 py-1 rounded-md text-sm transition-colors ${
                            selectedFilter === type.value
                              ? 'bg-blue-100 text-blue-800 font-medium'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {filteredExercises.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-[350px] overflow-y-auto p-1">
                  {filteredExercises.map(exercise => (
                    <div
                      key={exercise.id}
                      onClick={() => handleOpenTargetModal(exercise)}
                      className="border rounded-lg p-3 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors bg-white group"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm">{exercise.nom}</h3>
                        <span className="text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          + Ajouter
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {exercise.type}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Niveau 1
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg border">
                  <p className="text-gray-600">Aucun exercice trouvé</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedExerciseManager; 