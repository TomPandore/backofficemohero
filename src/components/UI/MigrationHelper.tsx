import React, { useState } from 'react';
import { runAllMigrations, migrateExercisesToJoursTable, cleanInvalidExercises } from '../../scripts/migrations';
import Button from './Button';

interface MigrationHelperProps {
  className?: string;
}

const MigrationHelper: React.FC<MigrationHelperProps> = ({ className }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const runMigration = async () => {
    setIsRunning(true);
    setResults(null);
    setLogs([]);
    
    addLog('Démarrage des migrations...');
    
    try {
      // Exécuter toutes les migrations
      const result = await runAllMigrations();
      addLog('Migrations terminées avec succès');
      setResults(result);
    } catch (error) {
      addLog(`Erreur lors des migrations: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Erreur lors des migrations:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runJoursMigration = async () => {
    setIsRunning(true);
    addLog('Démarrage de la migration des exercices vers jours...');
    
    try {
      const result = await migrateExercisesToJoursTable();
      addLog(`Migration des exercices terminée: ${result.success ? 'Succès' : 'Échec'}`);
      
      if (result.success) {
        addLog(`Programmes migrés: ${result.migrated}, Ignorés: ${result.skipped}, Échecs: ${result.failed}`);
      }
      
      setResults({ joursMigration: result });
    } catch (error) {
      addLog(`Erreur lors de la migration: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Erreur lors de la migration:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runCleanup = async () => {
    setIsRunning(true);
    addLog('Démarrage du nettoyage des exercices invalides...');
    
    try {
      const result = await cleanInvalidExercises();
      addLog(`Nettoyage terminé: ${result.success ? 'Succès' : 'Échec'}`);
      
      if (result.success) {
        addLog(`Exercices vérifiés: ${result.checkedExercises}, Exercices invalides supprimés: ${result.invalidExercises}`);
      }
      
      setResults({ cleanup: result });
    } catch (error) {
      addLog(`Erreur lors du nettoyage: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Erreur lors du nettoyage:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className={`p-4 bg-orange-50 border border-orange-200 rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Outils de migration des données</h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant="primary"
          onClick={runMigration}
          disabled={isRunning}
        >
          {isRunning ? 'Migration en cours...' : 'Exécuter toutes les migrations'}
        </Button>
        
        <Button
          variant="secondary"
          onClick={runJoursMigration}
          disabled={isRunning}
        >
          Migrer exercices → jours
        </Button>
        
        <Button
          variant="secondary"
          onClick={runCleanup}
          disabled={isRunning}
        >
          Nettoyer exercices invalides
        </Button>
      </div>
      
      {/* Journal des opérations */}
      {logs.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Journal</h4>
          <div className="bg-gray-800 text-gray-200 p-3 rounded text-xs font-mono h-40 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))}
          </div>
        </div>
      )}
      
      {/* Résultats */}
      {results && (
        <div>
          <h4 className="text-sm font-medium mb-2">Résultats</h4>
          <pre className="bg-white border border-gray-200 p-2 text-xs rounded overflow-auto max-h-60">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default MigrationHelper; 