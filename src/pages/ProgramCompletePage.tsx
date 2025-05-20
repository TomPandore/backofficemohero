import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import { usePrograms } from '../context/ProgramContext';
import PageContainer from '../components/Layout/PageContainer';
import { Program, Exercise } from '../types';
import { programService } from '../services/programService';
import Button from '../components/UI/Button';

const ProgramCompletePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProgram } = usePrograms();
  
  const [program, setProgram] = useState<Program | null>(null);
  const [programExercises, setProgramExercises] = useState<{ [day: number]: Exercise[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadProgramAndExercises = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Charger le programme
        const loadedProgram = await programService.getById(id);
        if (!loadedProgram) {
          setError('Programme non trouvé');
          setIsLoading(false);
          return;
        }
        
        setProgram(loadedProgram);
        
        // Charger tous les exercices du programme
        const exercises = await programService.getAllProgramExercises(id);
        setProgramExercises(exercises);
        
        // Par défaut, développer tous les jours qui ont des exercices
        const daysWithExercises = new Set<number>(
          Object.keys(exercises).map(day => parseInt(day, 10))
        );
        setExpandedDays(daysWithExercises);
      } catch (err) {
        console.error('Erreur lors du chargement du programme et des exercices:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProgramAndExercises();
  }, [id]);

  const toggleDayExpansion = (day: number) => {
    const newExpandedDays = new Set(expandedDays);
    if (newExpandedDays.has(day)) {
      newExpandedDays.delete(day);
    } else {
      newExpandedDays.add(day);
    }
    setExpandedDays(newExpandedDays);
  };

  const printProgram = () => {
    window.print();
  };

  const expandAllDays = () => {
    if (!program) return;
    
    const allDays = new Set<number>();
    for (let i = 1; i <= program.duration; i++) {
      allDays.add(i);
    }
    setExpandedDays(allDays);
  };

  const collapseAllDays = () => {
    setExpandedDays(new Set<number>());
  };

  const getDayExerciseCount = (day: number): number => {
    return programExercises[day]?.length || 0;
  };

  // Format un jour avec padding de zéro
  const formatDay = (day: number): string => {
    return day.toString().padStart(2, '0');
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
      title={`Programme Complet: ${program.name}`}
      action={
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/program/${program.id}/exercises`)}
            className="flex items-center"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Éditer les exercices
          </Button>
          <Button
            variant="primary"
            onClick={printProgram}
            className="flex items-center print:hidden"
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
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
            <div className="mt-2 md:mt-0 print:hidden">
              <Button 
                variant="secondary" 
                onClick={() => navigate(`/edit-program/${program.id}`)}
                className="text-sm px-3 py-1"
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
        
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Programme complet</h2>
            <div className="flex space-x-2 print:hidden">
              <Button 
                variant="secondary" 
                onClick={expandAllDays}
                className="text-sm px-3 py-1"
              >
                <ChevronDown className="mr-1 h-4 w-4" />
                Tout développer
              </Button>
              <Button 
                variant="secondary" 
                onClick={collapseAllDays}
                className="text-sm px-3 py-1"
              >
                <ChevronUp className="mr-1 h-4 w-4" />
                Tout réduire
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            {Array.from({ length: program.duration }, (_, i) => i + 1).map(day => (
              <div 
                key={day} 
                className={`border rounded-md ${
                  getDayExerciseCount(day) > 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div 
                  className={`flex justify-between items-center p-4 cursor-pointer ${
                    getDayExerciseCount(day) > 0 ? 'hover:bg-blue-100' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => toggleDayExpansion(day)}
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      getDayExerciseCount(day) > 0 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {formatDay(day)}
                    </div>
                    <h3 className="font-medium">
                      Jour {day} {getDayExerciseCount(day) > 0 ? `(${getDayExerciseCount(day)} exercice${getDayExerciseCount(day) > 1 ? 's' : ''})` : ''}
                    </h3>
                  </div>
                  <div>
                    {expandedDays.has(day) ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>
                
                {expandedDays.has(day) && programExercises[day] && programExercises[day].length > 0 && (
                  <div className="border-t border-gray-200 p-4">
                    <ul className="divide-y divide-gray-200">
                      {programExercises[day].map((exercise, index) => (
                        <li key={exercise.id} className="py-3">
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mr-3 text-xs">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium">{exercise.name}</h4>
                              <p className="text-sm text-gray-500">
                                Type: {exercise.type} | Niveau: {exercise.level}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {expandedDays.has(day) && (!programExercises[day] || programExercises[day].length === 0) && (
                  <div className="border-t border-gray-200 p-4 text-center text-gray-500">
                    Aucun exercice pour ce jour
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Styles d'impression */}
      <style type="text/css" media="print">
        {`
          @page {
            size: portrait;
            margin: 2cm;
          }
          .print\\:hidden {
            display: none !important;
          }
          body {
            font-size: 12pt;
          }
          h2 {
            font-size: 16pt;
            margin-top: 1.5cm;
          }
          h3, h4 {
            font-size: 14pt;
          }
        `}
      </style>
    </PageContainer>
  );
};

export default ProgramCompletePage; 