import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Plus, ArrowUpRight } from 'lucide-react';
import { Exercise } from '../../types';
import Button from '../UI/Button';
import { bankExercisesService, BankExercise } from '../../services/bankExercisesService';
import { fallbackExercisesService } from '../../services/fallbackExercisesService';
import { exerciceService } from '../../services/exerciceService';
import { supabase } from '../../lib/supabase';
import { programService } from '../../services/programService';

interface ExerciseAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  jourId: string;
  onExerciseAdded: () => void;
}

const ExerciseAddModal: React.FC<ExerciseAddModalProps> = ({
  isOpen,
  onClose,
  jourId,
  onExerciseAdded
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [bankExercises, setBankExercises] = useState<BankExercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<BankExercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Exercice sélectionné pour ajout
  const [selectedExercise, setSelectedExercise] = useState<BankExercise | null>(null);
  const [valeurCible, setValeurCible] = useState<string>('');
  const [ordre, setOrdre] = useState<number>(1);

  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  // État pour le programme associé à ce jour
  const [programId, setProgramId] = useState<string | null>(null);

  // Chargement de la banque d'exercices
  useEffect(() => {
    loadBankExercises();
    
    // Vérifier le jour et récupérer l'ID du programme
    if (jourId) {
      verifyJourAndProgram();
    }
  }, [jourId]);

  // Filtrage des exercices
  useEffect(() => {
    filterExercises();
  }, [bankExercises, selectedFilter, searchQuery]);
  
  // Vérifier le jour et récupérer les informations du programme
  const verifyJourAndProgram = async () => {
    try {
      const { data: jourInfo, error: jourError } = await supabase
        .from('jours')
        .select('id, numero_jour, programme_id')
        .eq('id', jourId)
        .single();
        
      if (jourError) {
        console.error("Erreur lors de la vérification du jour:", jourError);
        return;
      }
      
      if (jourInfo && jourInfo.programme_id) {
        setProgramId(jourInfo.programme_id);
        console.log(`Jour #${jourInfo.numero_jour} du programme ${jourInfo.programme_id}`);
      }
    } catch (err) {
      console.error("Erreur lors de la vérification du jour:", err);
    }
  };

  const loadBankExercises = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Tentative de chargement des exercices via le service...");
      const data = await bankExercisesService.getAll();
      
      if (data && data.length > 0) {
        console.log(`${data.length} exercices chargés avec succès depuis le service`);
        setBankExercises(data);
      } else {
        console.log("Aucun exercice trouvé via le service, utilisation du fallback...");
        
        // Utiliser le service de fallback
        const fallbackData = await fallbackExercisesService.getAll();
        console.log(`${fallbackData.length} exercices chargés depuis le fallback`);
        setBankExercises(fallbackData);
      }
    } catch (err) {
      console.error("Erreur principale:", err);
      console.log("Utilisation du fallback suite à une erreur...");
      
      try {
        const fallbackData = await fallbackExercisesService.getAll();
        console.log(`${fallbackData.length} exercices chargés depuis le fallback (après erreur)`);
        setBankExercises(fallbackData);
      } catch (fallbackErr) {
        console.error("Même le fallback a échoué:", fallbackErr);
        setError('Erreur lors du chargement de la banque d\'exercices');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = [...bankExercises];
    
    // Filtrer par type
    if (selectedFilter !== 'all') {
      // Gérer le cas spécial pour mobilité/mobilite
      const searchType = selectedFilter === 'mobilité' ? 'mobilite' : selectedFilter;
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

  const handleSelectExercise = (exercise: BankExercise) => {
    setSelectedExercise(exercise);
    // Définir un ordre par défaut (prochain numéro)
    setOrdre(filteredExercises.length + 1);
  };

  const handleAddExercise = async () => {
    if (!selectedExercise || !jourId) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log("======== DÉBUT AJOUT EXERCICE ========");
      console.log("Jour ID:", jourId);
      
      // Préparer les données de l'exercice
      const exerciceData = {
        nom: selectedExercise.nom || 'Exercice sans nom',
        type: selectedExercise.type,
        niveau: selectedExercise.niveau || 1,
        ordre: ordre || 1,
        valeur_cible: valeurCible,
        description: selectedExercise.description,
        categorie: selectedExercise.categorie,
        image_url: selectedExercise.image_url,
        video_url: selectedExercise.video_url,
        variante: selectedExercise.variante,
        zones: selectedExercise.zones || []
      };
      
      console.log("Données de l'exercice à ajouter:", exerciceData);
      
      // Utiliser le service amélioré pour ajouter l'exercice
      const result = await exerciceService.addExercice(jourId, exerciceData);
      
      if (result.success) {
        console.log("Exercice ajouté avec succès:", result);
        setSuccess(`${selectedExercise.nom} ajouté avec succès`);
        if (onExerciseAdded) {
          onExerciseAdded();
        }
        onClose();
      } else {
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : 'Une erreur est survenue lors de l\'ajout de l\'exercice';
        setError(errorMessage);
      }
      
      console.log("======== FIN AJOUT EXERCICE ========");
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'exercice:', err);
      setError('Une erreur est survenue lors de l\'ajout de l\'exercice');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour diagnostiquer et réparer automatiquement les problèmes
  const runAutomaticRepair = async (programId: string) => {
    try {
      console.log("Démarrage du diagnostic et réparation automatique...");
      
      // 1. Vérifier si le jour existe réellement
      const { exists, data: jourInfo } = await exerciceService.verifyJourExists(jourId);
      
      if (!exists) {
        console.log("Le jour n'existe pas, tentative de création...");
        
        // Récupérer le numéro du jour à partir de l'URL ou d'autres jours
        let numeroJour = 1;
        
        // Récupérer les jours existants
        const { data: jours } = await supabase
          .from('jours')
          .select('numero_jour')
          .eq('programme_id', programId)
          .order('numero_jour', { ascending: false })
          .limit(1);
          
        if (jours && jours.length > 0) {
          // Prendre le jour suivant le plus grand
          numeroJour = jours[0].numero_jour + 1;
        }
        
        // Créer le jour manquant
        const { data: newJour, error: jourError } = await supabase
          .from('jours')
          .insert([{ programme_id: programId, numero_jour: numeroJour }])
          .select('id');
          
        if (jourError) {
          return { fixed: false, message: `Impossible de créer le jour: ${jourError.message}` };
        }
        
        return { fixed: true, message: `Jour ${numeroJour} créé avec succès` };
      }
      
      // 2. Vérifier si d'autres jours ont des exercices
      const { found, jourId: workingJourId, numero_jour: workingJourNumber } = 
        await exerciceService.findWorkingDay(programId, jourId);
      
      if (found) {
        return { 
          fixed: true, 
          message: `Un jour fonctionnel (#${workingJourNumber}) a été identifié et sa structure sera utilisée`
        };
      }
      
      // 3. Si aucun jour n'a d'exercices, essayer d'en créer un test
      console.log("Aucun jour fonctionnel trouvé, tentative de création d'un exercice test...");
      
      // Trouver le premier jour
      const { data: firstDay } = await supabase
        .from('jours')
        .select('id, numero_jour')
        .eq('programme_id', programId)
        .order('numero_jour', { ascending: true })
        .limit(1);
        
      if (firstDay && firstDay.length > 0) {
        const testJourId = firstDay[0].id;
        
        // Essayer de créer un exercice test
        const testResult = await exerciceService.addExercice(testJourId, {
          nom: 'Test diagnostique',
          type: 'test',
          niveau: 1
        });
        
        if (testResult.success) {
          return { 
            fixed: true, 
            message: `Exercice test créé avec succès sur le jour ${firstDay[0].numero_jour}, vous pouvez maintenant ajouter des exercices aux autres jours`
          };
        }
      }
      
      return { fixed: false, message: "Impossible de résoudre automatiquement le problème" };
    } catch (err) {
      console.error("Erreur lors du diagnostic automatique:", err);
      return { fixed: false, message: "Erreur lors du diagnostic" };
    }
  };

  if (!isOpen) return null;

  const exerciseTypes = [
    { value: 'all', label: 'Tous' },
    { value: 'push', label: 'Push' },
    { value: 'pull', label: 'Pull' },
    { value: 'squat', label: 'Squat' },
    { value: 'core', label: 'Core' },
    { value: 'animal_flow', label: 'Animal Flow' },
    { value: 'mobilite', label: 'Mobilité' },
    { value: 'respiration', label: 'Respiration' }
  ];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800">
            {selectedExercise ? 'Configurer l\'exercice' : 'Ajouter un exercice'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        {error && (
          <div className="m-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
        )}
        
        {success && (
          <div className="m-4 p-3 bg-green-100 text-green-700 rounded-md">{success}</div>
        )}
        
        {/* Étape 1: Recherche et sélection d'exercice */}
        {!selectedExercise ? (
          <div className="p-4 flex-1 overflow-auto">
            <div className="mb-4">
              <div className="flex mb-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un exercice..."
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="flex items-center text-sm text-gray-500 mr-2">
                  <Filter size={16} className="mr-1" />
                  Filtrer:
                </div>
                {exerciseTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedFilter(type.value)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedFilter === type.value
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des exercices...</p>
              </div>
            ) : filteredExercises.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto p-2">
                {filteredExercises.map(exercise => (
                  <div
                    key={exercise.id}
                    onClick={() => handleSelectExercise(exercise)}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  >
                    <h3 className="font-medium text-lg mb-1">{exercise.nom}</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {exercise.type}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Niveau {exercise.niveau}
                      </span>
                    </div>
                    {exercise.categorie && (
                      <p className="text-sm text-gray-600 mb-2">Catégorie: {exercise.categorie}</p>
                    )}
                    {exercise.zones && exercise.zones.length > 0 && (
                      <p className="text-sm text-gray-600">Zones: {exercise.zones.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Aucun exercice trouvé.</p>
                <Button
                  variant="secondary"
                  onClick={loadBankExercises}
                  className="mt-4"
                >
                  Recharger les exercices
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 flex-1 overflow-auto">
            <h3 className="text-lg font-medium mb-4">{selectedExercise.nom}</h3>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="valeur_cible" className="block text-sm font-medium text-gray-700 mb-1">
                  Valeur cible (ex: 30 reps, 2 min)
                </label>
                <input
                  type="text"
                  id="valeur_cible"
                  value={valeurCible}
                  onChange={(e) => setValeurCible(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 3 séries de 10 répétitions"
                />
              </div>
              
              <div>
                <label htmlFor="ordre" className="block text-sm font-medium text-gray-700 mb-1">
                  Ordre d'exécution
                </label>
                <input
                  type="number"
                  id="ordre"
                  value={ordre}
                  onChange={(e) => setOrdre(parseInt(e.target.value, 10) || 1)}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {selectedExercise.image_url && (
                <div>
                  <p className="block text-sm font-medium text-gray-700 mb-1">Image</p>
                  <img 
                    src={selectedExercise.image_url} 
                    alt={selectedExercise.nom} 
                    className="rounded-md max-h-40 object-contain"
                  />
                </div>
              )}

              {selectedExercise.video_url && (
                <div>
                  <p className="block text-sm font-medium text-gray-700 mb-1">Vidéo de démonstration</p>
                  <a 
                    href={selectedExercise.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <ArrowUpRight size={16} className="mr-1" />
                    Voir la vidéo
                  </a>
                </div>
              )}

              {selectedExercise.variante && (
                <div>
                  <p className="block text-sm font-medium text-gray-700 mb-1">Variante plus facile</p>
                  <p className="text-sm text-gray-600">{selectedExercise.variante}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="p-4 border-t flex justify-between">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          
          {selectedExercise ? (
            <Button 
              variant="primary" 
              onClick={handleAddExercise}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
                  Ajout en cours...
                </>
              ) : (
                <>
                  <Plus size={18} className="mr-1" />
                  Ajouter l'exercice
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ExerciseAddModal; 