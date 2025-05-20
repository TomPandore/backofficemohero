import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { usePrograms } from '../context/ProgramContext';
import PageContainer from '../components/Layout/PageContainer';
import ProgramForm from '../components/ProgramForm/ProgramForm';
import UnifiedExerciseManager from '../components/ProgramExercises/UnifiedExerciseManager';
import { Program } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/UI';
import { SaveIcon, ArrowLeft, Calendar, Info } from 'lucide-react';
import Button from '../components/UI/Button';

const EditProgramPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getProgram, updateProgram, error: contextError, refreshPrograms } = usePrograms();
  
  // Vérifier les paramètres d'URL pour voir si un onglet spécifique est demandé
  const [activeTab, setActiveTab] = useState<string>(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'exercises'; // Par défaut "exercises" au lieu de "details"
  });
  const [program, setProgram] = useState<Program | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    if (id) {
      const foundProgram = getProgram(id);
      if (foundProgram) {
        setProgram(foundProgram);
      } else {
        setError('Programme non trouvé');
      }
    }
  }, [id, getProgram]);

  // Mise à jour de l'URL lorsque l'onglet change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/edit-program/${id}?tab=${value}`, { replace: true });
  };

  // Mise à jour du programme
  const handleUpdateProgram = async (updatedProgram: Omit<Program, 'id'>) => {
    if (!id) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await updateProgram(id, updatedProgram);
      setUpdateSuccess(true);
      
      // Masquer le message après un délai
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
      
      // Rafraîchir les données
      const refreshedProgram = getProgram(id);
      if (refreshedProgram) {
        setProgram(refreshedProgram);
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rafraîchir les données du programme
  const refreshProgramData = () => {
    if (!id) return;
    
    const refreshedProgram = getProgram(id);
    if (refreshedProgram) {
      setProgram(refreshedProgram);
    } else {
      refreshPrograms().then(() => {
        const foundProgram = getProgram(id);
        if (foundProgram) {
          setProgram(foundProgram);
        }
      });
    }
  };

  // Gérer la navigation vers la page de gestion des jours
  const handleManageDays = () => {
    if (id) {
      navigate(`/program/${id}/days`);
    }
  };

  if (!id) {
    return <div>ID du programme manquant</div>;
  }

  return (
    <PageContainer 
      title={program ? `Modifier: ${program.name}` : 'Chargement...'} 
      action={
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={handleManageDays}
            className="flex items-center"
          >
            <Calendar className="h-4 w-4 mr-1" />
            Gérer les jours
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour à la liste
          </Button>
        </div>
      }
    >
      {(error || contextError) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || contextError}
        </div>
      )}
      
      {updateSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Programme mis à jour avec succès !
        </div>
      )}
      
      {program ? (
        <>
          {/* Barre de navigation flottante aux exercices fréquemment utilisés */}
          {activeTab === 'exercises' && (
            <div className="fixed bottom-6 right-6 z-10">
              <div className="flex flex-col gap-2">
                <Button 
                  variant="primary"
                  onClick={() => setShowTips(!showTips)}
                  className="rounded-full h-12 w-12 flex items-center justify-center shadow-lg bg-blue-600 hover:bg-blue-700"
                  title="Astuces d'utilisation"
                >
                  <Info className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}
          
          {showTips && (
            <div className="fixed bottom-20 right-6 z-10 bg-white p-4 rounded-lg shadow-lg border border-blue-200 max-w-md">
              <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Astuces pour gérer les exercices
              </h3>
              <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
                <li>Utilisez les boutons numérotés pour naviguer rapidement entre les jours</li>
                <li>Survolez les boutons pour voir le nombre d'exercices par jour</li>
                <li>Les jours en vert ont déjà des exercices assignés</li>
                <li>Utilisez la recherche pour trouver rapidement des exercices dans la banque</li>
              </ul>
              <Button 
                variant="secondary" 
                onClick={() => setShowTips(false)}
                className="mt-3 text-xs w-full"
              >
                Fermer les astuces
              </Button>
            </div>
          )}
        
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="sticky top-0 bg-white z-10 border-b pb-2 mb-4">
              <TabsTrigger value="details">Détails du programme</TabsTrigger>
              <TabsTrigger value="exercises">Exercices</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <ProgramForm
                program={program}
                onSubmit={handleUpdateProgram}
                onClose={() => navigate('/')}
                isSubmitting={isSubmitting}
              />
            </TabsContent>
            
            <TabsContent value="exercises">
              <UnifiedExerciseManager 
                programId={id} 
                onExercisesUpdated={refreshProgramData}
                programDuration={program.duration || 28}
              />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </PageContainer>
  );
};

export default EditProgramPage;