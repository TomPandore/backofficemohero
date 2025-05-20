import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, File, Check, Plus, Calendar, RefreshCw, Layers, Info } from 'lucide-react';
import { usePrograms } from '../context/ProgramContext';
import { Program } from '../types';
import { programService } from '../services/programService';
import { supabase } from '../lib/supabase';
import PageContainer from '../components/Layout/PageContainer';
import Button from '../components/UI/Button';
import ProgramDayManager from '../components/ProgramExercises/ProgramDayManager';
import ProgramExerciseManager from '../components/ProgramExercises/ProgramExerciseManager';

// Interface pour les jours
interface JourData {
  id: string;
  numero_jour: number;
  programme_id: string;
}

const ProgramDaysPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // États pour la gestion des jours
  const [jours, setJours] = useState<JourData[]>([]);
  const [showJourManagement, setShowJourManagement] = useState(false);
  const [jourToAdd, setJourToAdd] = useState<number>(1);
  const [isCreatingAllDays, setIsCreatingAllDays] = useState(false);
  
  useEffect(() => {
    if (!id) return;
    
    const loadProgram = async () => {
      setIsLoading(true);
      try {
        const data = await programService.getById(id);
        if (!data) {
          setError('Programme non trouvé');
          return;
        }
        setProgram(data);
        
        // Charger les jours existants
        await loadJours();
      } catch (err) {
        console.error('Erreur lors du chargement du programme:', err);
        setError('Erreur lors du chargement du programme');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProgram();
  }, [id]);
  
  // Charger les jours du programme
  const loadJours = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('jours')
        .select('id, numero_jour, programme_id')
        .eq('programme_id', id)
        .order('numero_jour', { ascending: true });
        
      if (error) throw error;
      
      setJours(data || []);
      
      // Si aucun jour n'existe, proposer d'en créer
      if (!data || data.length === 0) {
        setShowJourManagement(true);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des jours:', err);
      setError('Erreur lors du chargement des jours');
    }
  };
  
  // Ajouter un nouveau jour
  const handleAddJour = async () => {
    if (!id) return;
    
    try {
      // Vérifier si le jour existe déjà
      const jourExiste = jours.some(jour => jour.numero_jour === jourToAdd);
      
      if (jourExiste) {
        setError(`Le jour ${jourToAdd} existe déjà`);
        return;
      }
      
      // Ajouter le jour
      const { data, error } = await supabase
        .from('jours')
        .insert([{ programme_id: id, numero_jour: jourToAdd }])
        .select();
        
      if (error) throw error;
      
      setSuccess(`Jour ${jourToAdd} ajouté avec succès`);
      setJourToAdd(prevJour => prevJour + 1);
      
      // Recharger les jours
      await loadJours();
    } catch (err) {
      console.error('Erreur lors de l\'ajout du jour:', err);
      setError('Erreur lors de l\'ajout du jour');
    }
  };
  
  // Créer tous les jours pour la durée du programme
  const handleCreateAllDays = async () => {
    if (!id || !program) return;
    
    try {
      setIsCreatingAllDays(true);
      const duration = program.duration || 28;
      const joursToCreate = [];
      
      // Déterminer quels jours n'existent pas encore
      for (let i = 1; i <= duration; i++) {
        if (!jours.some(jour => jour.numero_jour === i)) {
          joursToCreate.push({
            programme_id: id,
            numero_jour: i
          });
        }
      }
      
      if (joursToCreate.length === 0) {
        setSuccess('Tous les jours existent déjà');
        setIsCreatingAllDays(false);
        return;
      }
      
      // Créer les jours manquants
      const { data, error } = await supabase
        .from('jours')
        .insert(joursToCreate)
        .select();
        
      if (error) throw error;
      
      setSuccess(`${joursToCreate.length} jours ajoutés avec succès`);
      
      // Recharger les jours
      await loadJours();
      
      // Masquer l'interface de gestion des jours
      setTimeout(() => {
        setShowJourManagement(false);
      }, 1500);
    } catch (err) {
      console.error('Erreur lors de la création des jours:', err);
      setError('Erreur lors de la création des jours');
    } finally {
      setIsCreatingAllDays(false);
    }
  };
  
  // Supprimer un jour
  const handleDeleteJour = async (jourId: string, numeroJour: number) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le jour ${numeroJour} ? Tous les exercices associés seront perdus.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('jours')
        .delete()
        .eq('id', jourId);
        
      if (error) throw error;
      
      setSuccess(`Jour ${numeroJour} supprimé avec succès`);
      
      // Recharger les jours
      await loadJours();
    } catch (err) {
      console.error('Erreur lors de la suppression du jour:', err);
      setError('Erreur lors de la suppression du jour');
    }
  };
  
  const handleUpdated = () => {
    if (!id) return;
    
    // Rafraîchir les données du programme
    programService.getById(id).then(data => {
      if (data) setProgram(data);
    });
    
    // Recharger les jours
    loadJours();
  };
  
  if (isLoading) {
    return (
      <PageContainer title="Chargement...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </PageContainer>
    );
  }
  
  if (error || !program) {
    return (
      <PageContainer title="Erreur">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Programme non trouvé'}
        </div>
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={() => navigate('/programmes')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer 
      title={`Jours du programme: ${program.name}`}
      action={
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={() => setShowJourManagement(!showJourManagement)}
            className="flex items-center"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {showJourManagement ? 'Masquer gestion jours' : 'Gérer les jours'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/edit-program/${program.id}`)}
            className="flex items-center"
          >
            <File className="mr-2 h-4 w-4" />
            Modifier le programme
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/program/${program.id}/complete`)}
            className="flex items-center"
          >
            <Eye className="mr-2 h-4 w-4" />
            Voir complet
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/programmes')}
            className="flex items-center"
          >
            <Check className="mr-2 h-4 w-4" />
            Terminer
          </Button>
        </div>
      }
    >
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800">Détails du programme</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
          <div>
            <p className="text-sm text-gray-500">Nom</p>
            <p className="font-medium">{program.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Durée</p>
            <p className="font-medium">{program.duration} jours</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-medium">{program.type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Niveau de difficulté</p>
            <p className="font-medium">{program.niveau_difficulte || 'Non spécifié'}</p>
          </div>
        </div>
      </div>
      
      {/* Interface de gestion des jours */}
      {showJourManagement && (
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <Layers className="h-5 w-5 mr-2 text-blue-500" />
            Gestion des jours
          </h2>
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              {success}
            </div>
          )}
          
          <div className="flex flex-col space-y-4">
            {/* Affichage des jours existants */}
            <div className="flex flex-col border-b pb-6">
              <h3 className="text-md font-medium mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                Jours existants ({jours.length})
              </h3>
              
              {jours.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-md">
                  <p className="text-yellow-700 flex items-center">
                    <Info className="h-5 w-5 mr-2 text-yellow-500" />
                    Aucun jour n'a été créé pour ce programme.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {jours.map(jour => (
                    <div key={jour.id} className="flex items-center justify-between border rounded p-2 bg-gray-50 hover:bg-gray-100">
                      <span className="font-medium">{jour.numero_jour}</span>
                      <button 
                        onClick={() => handleDeleteJour(jour.id, jour.numero_jour)}
                        className="text-red-500 hover:text-red-700"
                        title="Supprimer ce jour"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Ajouter un jour spécifique */}
            <div className="flex flex-col pt-4 border-b pb-6">
              <h3 className="text-md font-medium mb-2 flex items-center">
                <Plus className="h-4 w-4 mr-2 text-gray-600" />
                Ajouter un jour spécifique
              </h3>
              
              <div className="flex items-center">
                <div className="w-24">
                  <input 
                    type="number" 
                    min="1" 
                    max="365"
                    value={jourToAdd} 
                    onChange={(e) => setJourToAdd(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={handleAddJour}
                  className="ml-2"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Ajouter le jour {jourToAdd}
                </Button>
              </div>
            </div>
            
            {/* Créer tous les jours */}
            <div className="flex flex-col pt-4">
              <h3 className="text-md font-medium mb-2 flex items-center">
                <RefreshCw className="h-4 w-4 mr-2 text-gray-600" />
                Créer automatiquement les jours
              </h3>
              
              <div className="p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800 mb-3">
                  Cette action créera tous les jours manquants pour couvrir la durée complète du programme ({program.duration} jours).
                </p>
                <Button
                  variant="primary"
                  onClick={handleCreateAllDays}
                  disabled={isCreatingAllDays}
                  className="w-full sm:w-auto"
                >
                  {isCreatingAllDays ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-1 h-4 w-4" />
                      Créer les {program.duration} jours du programme
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Affichage des jours et exercices */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        {jours.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun jour défini</h3>
            <p className="text-gray-600 mb-4">Vous devez d'abord créer des jours pour ce programme.</p>
            <Button
              variant="primary"
              onClick={() => {
                setShowJourManagement(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Créer les jours du programme
            </Button>
          </div>
        ) : (
          <ProgramExerciseManager 
            programId={program.id}
            programDuration={program.duration}
            onExercisesUpdated={handleUpdated}
          />
        )}
      </div>
    </PageContainer>
  );
};

export default ProgramDaysPage; 