import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Program } from '../../types';
import Button from '../UI/Button';

interface SqlUpdateFormProps {
  program: Program;
}

const SqlUpdateForm: React.FC<SqlUpdateFormProps> = ({ program }) => {
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newName, setNewName] = useState(program.name);
  const [response, setResponse] = useState<any>(null);

  const handleUpdate = async () => {
    if (!program.id) return;
    
    setIsLoading(true);
    setStatus('Mise à jour en cours...');
    setResponse(null);
    
    try {
      // Requête SQL directe pour mettre à jour le nom
      const { data, error } = await supabase.rpc('update_program_direct', {
        program_id: program.id,
        new_name: newName
      });
      
      if (error) {
        setStatus(`❌ Erreur: ${error.message}`);
        setResponse({ error });
      } else {
        setStatus('✅ Mise à jour réussie!');
        setResponse({ data });
        // Actualiser la page après 2 secondes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      setStatus(`❌ Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
      setResponse({ error: err });
    } finally {
      setIsLoading(false);
    }
  };

  const executeRawSql = async () => {
    if (!program.id) return;

    setIsLoading(true);
    setStatus('Exécution de la requête SQL brute...');
    setResponse(null);

    try {
      // Requête SQL directe avec le client Supabase
      const { data, error } = await supabase.from('programmes')
        .update({ nom: newName })
        .eq('id', program.id)
        .select();

      if (error) {
        setStatus(`❌ Erreur: ${error.message}`);
        setResponse({ error });
      } else {
        setStatus('✅ Mise à jour SQL réussie!');
        setResponse({ data });
        // Actualiser la page après 2 secondes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      setStatus(`❌ Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
      setResponse({ error: err });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Mise à jour par SQL</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nom du programme (actuel: {program.name})
        </label>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div className="flex space-x-4 mb-4">
        <Button
          onClick={executeRawSql}
          disabled={isLoading || newName === program.name}
          className="w-full"
        >
          {isLoading ? 'En cours...' : 'Mettre à jour avec SQL'}
        </Button>
        
        <Button
          onClick={handleUpdate}
          disabled={isLoading || newName === program.name}
          variant="secondary"
          className="w-full"
        >
          {isLoading ? 'En cours...' : 'Mettre à jour avec RPC'}
        </Button>
      </div>
      
      {status && (
        <div className={`p-4 mb-4 rounded-md ${status.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {status}
        </div>
      )}
      
      {response && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Réponse:</h3>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SqlUpdateForm; 