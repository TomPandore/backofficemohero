import React, { useState } from 'react';
import { supabase, checkProgrammesTable } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { DailyExercises } from '../../types';
import { programService } from '../../services/programService';

interface DebugButtonProps {
  className?: string;
}

const DebugButton: React.FC<DebugButtonProps> = ({ className }) => {
  const [showDebug, setShowDebug] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleToggleDebug = () => {
    setShowDebug(!showDebug);
  };

  const testSupabaseConnection = async () => {
    setIsWorking(true);
    setStatus('Test de connexion à Supabase...');
    setResults([]);
    
    try {
      const { data, error } = await supabase
        .from('programmes')
        .select('count')
        .limit(1);
      
      if (error) {
        setStatus(`❌ Erreur de connexion: ${error.message}`);
        setResults([{ type: 'error', message: error.message, details: error }]);
      } else {
        setStatus(`✅ Connexion réussie! Nombre de résultats: ${data?.length || 0}`);
        setResults([{ type: 'success', message: 'Connexion établie', data }]);
        
        // Vérifier la table programmes
        await checkProgrammesTable();
      }
    } catch (err) {
      setStatus(`❌ Erreur inattendue: ${err instanceof Error ? err.message : String(err)}`);
      setResults([{ type: 'error', message: 'Erreur inattendue', error: err }]);
    } finally {
      setIsWorking(false);
    }
  };
  
  const testUpdateExercises = async () => {
    setIsWorking(true);
    setStatus('Test de mise à jour du programme...');
    setResults([]);
    
    try {
      // D'abord récupérer un programme
      const { data: programs, error: fetchError } = await supabase
        .from('programmes')
        .select('id, nom, description')
        .limit(1);
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!programs || programs.length === 0) {
        setStatus('❌ Aucun programme trouvé pour tester la mise à jour');
        return;
      }
      
      const program = programs[0];
      const programId = program.id;
      
      // Préparer des données de test simples
      const testUpdate = {
        nom: `Test-${Date.now()}`,
        description: `Description mise à jour le ${new Date().toISOString()}`
      };
      
      // Faire un log complet avant la mise à jour
      console.log('Programme avant mise à jour:', JSON.stringify(program, null, 2));
      console.log('Données à mettre à jour:', JSON.stringify(testUpdate, null, 2));
      
      // Faire la mise à jour
      const { data: updateData, error: updateError } = await supabase
        .from('programmes')
        .update(testUpdate)
        .eq('id', programId)
        .select('id, nom, description')
        .single();
      
      if (updateError) {
        setStatus(`❌ Erreur de mise à jour: ${updateError.message}`);
        setResults([
          { type: 'info', message: 'Programme utilisé', data: program },
          { type: 'error', message: updateError.message, details: updateError }
        ]);
      } else {
        setStatus(`✅ Mise à jour réussie pour le programme ${programId}`);
        
        // Faire une pause avant la vérification
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Vérifier si la mise à jour a bien été appliquée
        const { data: updatedProgram, error: checkError } = await supabase
          .from('programmes')
          .select('id, nom, description')
          .eq('id', programId)
          .single();
        
        if (checkError) {
          setResults([
            { type: 'success', message: 'Mise à jour envoyée avec succès', data: updateData },
            { type: 'error', message: 'Échec de la vérification', details: checkError }
          ]);
        } else {
          // Comparer les données mises à jour
          const nomMatch = updatedProgram.nom === testUpdate.nom;
          const descMatch = updatedProgram.description === testUpdate.description;
          const match = nomMatch && descMatch;
          
          setResults([
            { type: 'success', message: 'Mise à jour réussie', data: updateData },
            { type: 'info', message: 'Données avant', data: program },
            { type: 'info', message: 'Données attendues', data: testUpdate },
            { type: 'info', message: 'Données après', data: updatedProgram },
            { type: match ? 'success' : 'warning', message: match ? 'Les données correspondent parfaitement' : 'Les données ne correspondent pas exactement' }
          ]);
          
          if (!match) {
            setStatus(`⚠️ Les données mises à jour ne correspondent pas exactement à ce qui a été envoyé`);
          }
          
          // Restaurer les données originales
          await supabase
            .from('programmes')
            .update({
              nom: program.nom,
              description: program.description
            })
            .eq('id', programId);
        }
      }
    } catch (err) {
      setStatus(`❌ Erreur inattendue: ${err instanceof Error ? err.message : String(err)}`);
      setResults([{ type: 'error', message: 'Erreur inattendue', error: err }]);
    } finally {
      setIsWorking(false);
    }
  };

  const inspectSpecificProgram = async () => {
    const programIdInput = prompt('Entrez l\'ID du programme à inspecter');
    if (!programIdInput) return;
    
    setIsWorking(true);
    setStatus(`Inspection du programme ${programIdInput}...`);
    setResults([]);
    
    try {
      const { data, error } = await supabase
        .from('programmes')
        .select('*')
        .eq('id', programIdInput)
        .single();
      
      if (error) {
        setStatus(`❌ Erreur: ${error.message}`);
        setResults([{ type: 'error', message: error.message, details: error }]);
        return;
      }
      
      if (!data) {
        setStatus('❌ Programme non trouvé');
        return;
      }
      
      setStatus(`✅ Programme trouvé: ${data.nom || data.name}`);
      setResults([
        { type: 'info', message: 'Détails du programme', data }
      ]);
      
      // Récupérer les exercices associés au programme depuis la table jours
      const { data: joursData, error: joursError } = await supabase
        .from('jours')
        .select('numero_jour, exercise_id')
        .eq('programme_id', programIdInput);
      
      if (!joursError && joursData) {
        // Organiser les exercices par jour
        const exercisesByDay: Record<number, string[]> = {};
        joursData.forEach(jour => {
          const day = jour.numero_jour;
          if (!exercisesByDay[day]) {
            exercisesByDay[day] = [];
          }
          if (jour.exercise_id) {
            exercisesByDay[day].push(jour.exercise_id);
          }
        });
        
        setResults(prev => [
          ...prev,
          { type: 'info', message: 'Exercices associés', data: exercisesByDay }
        ]);
      }
      
    } catch (err) {
      setStatus(`❌ Erreur: ${err instanceof Error ? err.message : String(err)}`);
      setResults([{ type: 'error', message: 'Erreur inattendue', error: err }]);
    } finally {
      setIsWorking(false);
    }
  };

  const diagnoseUpdateProcess = async () => {
    const programIdInput = prompt('Entrez l\'ID du programme à diagnostiquer');
    if (!programIdInput) return;
    
    setIsWorking(true);
    setStatus(`Diagnostic complet pour le programme ${programIdInput}...`);
    setResults([]);
    
    try {
      const diagnosticResult = await programService.diagnoseUpdateIssue(programIdInput);
      
      if (diagnosticResult.success) {
        setStatus(`✅ Diagnostic réussi: mise à jour possible`);
      } else {
        setStatus(`❌ Échec du diagnostic à l'étape: ${diagnosticResult.step}`);
      }
      
      setResults([
        { type: diagnosticResult.success ? 'success' : 'error', 
          message: `Résultat du diagnostic: ${diagnosticResult.success ? 'Réussi' : 'Échec'}`, 
          data: diagnosticResult }
      ]);
      
    } catch (err) {
      setStatus(`❌ Erreur pendant le diagnostic: ${err instanceof Error ? err.message : String(err)}`);
      setResults([{ type: 'error', message: 'Erreur inattendue', error: err }]);
    } finally {
      setIsWorking(false);
    }
  };

  const resetLocalStorage = () => {
    localStorage.removeItem('MOHERO_UPDATE_SUCCESS');
    localStorage.removeItem('MOHERO_UPDATE_TIME');
    localStorage.removeItem('MOHERO_UPDATED_PROGRAM_ID');
    localStorage.removeItem('MOHERO_CREATE_SUCCESS');
    setStatus('✅ LocalStorage nettoyé');
  };

  const viewLogs = () => {
    logger.dumpLogs();
    setStatus('Logs affichés dans la console (F12)');
  };

  const downloadLogs = () => {
    logger.exportLogs();
    setStatus('Logs téléchargés');
  };

  if (!showDebug) {
    return (
      <button
        onClick={handleToggleDebug}
        className={`fixed bottom-4 right-4 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-xs ${className}`}
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-80 max-h-96 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Outils de diagnostic</h3>
        <button
          onClick={handleToggleDebug}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={testSupabaseConnection}
          disabled={isWorking}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          Tester la connexion
        </button>
        
        <button
          onClick={testUpdateExercises}
          disabled={isWorking}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          Tester la mise à jour des exercices
        </button>
        
        <button
          onClick={inspectSpecificProgram}
          disabled={isWorking}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          Inspecter un programme
        </button>
        
        <button
          onClick={diagnoseUpdateProcess}
          disabled={isWorking}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          Diagnostic complet de mise à jour
        </button>
      </div>
      
      {status && (
        <div className={`mt-4 p-3 rounded-md ${status.includes('✅') ? 'bg-green-100' : 'bg-red-100'}`}>
          {status}
        </div>
      )}
      
      {results.length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h4 className="font-medium mb-2">Résultats:</h4>
          <div className="space-y-2 text-xs">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-2 rounded-md ${
                  result.type === 'success' ? 'bg-green-50 border border-green-200' :
                  result.type === 'error' ? 'bg-red-50 border border-red-200' :
                  'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className="font-medium">{result.message}</div>
                {result.data && (
                  <pre className="mt-1 overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
                {result.details && (
                  <details className="mt-1">
                    <summary className="cursor-pointer">Détails</summary>
                    <pre className="overflow-x-auto mt-1">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugButton; 