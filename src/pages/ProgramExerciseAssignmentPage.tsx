import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePrograms } from '../context/ProgramContext';
import PageContainer from '../components/Layout/PageContainer';
import { Program } from '../types';
import ProgramExerciseManager from '../components/ProgramExercises/ProgramExerciseManager';
import { programService } from '../services/programService';
import Button from '../components/UI/Button';
import { ArrowLeft, Eye } from 'lucide-react';

const ProgramExerciseAssignmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProgram } = usePrograms();
  
  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProgram = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Charger le programme depuis le service pour obtenir les dernières données
        const loadedProgram = await programService.getById(id);
        if (loadedProgram) {
          setProgram(loadedProgram);
        } else {
          setError('Programme non trouvé');
        }
      } catch (err) {
        console.error('Erreur lors du chargement du programme:', err);
        setError('Erreur lors du chargement du programme');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProgram();
  }, [id]);

  const handleProgramUpdated = async () => {
    if (!id) return;
    
    try {
      const refreshedProgram = await programService.getById(id);
      if (refreshedProgram) {
        setProgram(refreshedProgram);
      }
    } catch (err) {
      console.error('Erreur lors du rafraîchissement du programme:', err);
    }
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
      title={`Attribution d'exercices: ${program.name}`}
      action={
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/program/${program.id}/complete`)}
            className="flex items-center"
          >
            <Eye className="mr-2 h-4 w-4" />
            Voir complet
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/programmes')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>
        </div>
      }
    >
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800">Détails du programme</h2>
            </div>
            <div className="mt-2 md:mt-0">
              <Button 
                variant="primary" 
                onClick={() => navigate(`/edit-program/${program.id}`)}
              >
                Modifier les détails
              </Button>
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
        
        <ProgramExerciseManager 
          programId={program.id} 
          onExercisesUpdated={handleProgramUpdated}
          showBankSelector={true}
        />
      </div>
    </PageContainer>
  );
};

export default ProgramExerciseAssignmentPage; 