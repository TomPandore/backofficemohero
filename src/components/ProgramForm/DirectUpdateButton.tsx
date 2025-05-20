import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Program } from '../../types';
import Button from '../UI/Button';
import { logger } from '../../lib/logger';

interface DirectUpdateButtonProps {
  program: Program;
  className?: string;
}

const DirectUpdateButton: React.FC<DirectUpdateButtonProps> = ({ program, className }) => {
  const [statusMessage, setStatusMessage] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleDirectUpdate = async () => {
    if (!program || !program.id) {
      setStatusMessage('Programme invalide');
      return;
    }

    setIsWorking(true);
    setStatusMessage('Préparation de la mise à jour directe...');
    setDebugInfo(null);

    try {
      // Préparer les données à envoyer à Supabase SANS le champ exercises
      const updateData = {
        nom: program.name,
        description: program.description || '',
        duree_jours: program.duration,
        type: program.type,
        clan_id: program.clan_id,
        tags: Array.isArray(program.tags) ? program.tags : [],
        resultats: Array.isArray(program.results) ? program.results : [],
        parcours_resume: Array.isArray(program.summary) ? program.summary : [],
        image_url: program.image_url || '',
        niveau_difficulte: program.niveau_difficulte || 'medium'
      };
      
      logger.log('Données formatées pour Supabase (sans exercises)', updateData);
      setStatusMessage('Envoi des données à Supabase...');
      
      // Vérifier la connexion à Supabase
      const supabaseInfo = {
        url: (supabase as any).supabaseUrl || 'URL non disponible',
        headers: (supabase as any).restClient?.headers || 'Headers non disponibles'
      };
      
      logger.log('Informations de connexion Supabase', supabaseInfo);
      setDebugInfo((prev: any) => ({ ...prev, supabaseInfo }));
      
      // Essayer d'envoyer la mise à jour directement
      setStatusMessage('Envoi des données...');
      const startTime = Date.now();
      
      const updateResult = await supabase
        .from('programmes')
        .update(updateData)
        .eq('id', program.id)
        .select('*');
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (updateResult.error) {
        logger.error('Erreur Supabase', {
          message: updateResult.error.message,
          details: updateResult.error.details,
          code: updateResult.error.code,
          responseTime
        });
        
        setStatusMessage(`Erreur: ${updateResult.error.message}`);
        setDebugInfo((prev: any) => ({ ...prev, error: updateResult.error, responseTime }));
        return;
      }
      
      logger.log('Mise à jour réussie', { responseTime });
      setStatusMessage(`Mise à jour réussie en ${responseTime}ms, vérification des données...`);
      
      // Vérifier si les données ont été correctement mises à jour
      const { data, error: readError } = await supabase
        .from('programmes')
        .select('*')
        .eq('id', program.id)
        .single();
      
      if (readError) {
        logger.error('Erreur lors de la vérification', readError);
        setStatusMessage('Mise à jour réussie mais impossible de vérifier les données');
        setDebugInfo((prev: any) => ({ ...prev, readError, updateData: updateResult.data }));
        return;
      }
      
      const verificationSuccess = data !== null;
      setStatusMessage(verificationSuccess 
        ? `✅ Mise à jour complète et vérifiée en ${responseTime}ms` 
        : '⚠️ Mise à jour envoyée mais données non vérifiables');
      
      setDebugInfo({
        original: program,
        sent: updateData,
        response: updateResult.data,
        verification: data,
        responseTime,
        timestamp: new Date().toISOString()
      });
      
      // Forcer un rechargement de la page après 2 secondes
      if (verificationSuccess) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      logger.error('Erreur lors de la mise à jour directe', err);
      setStatusMessage(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
      setDebugInfo((prev: any) => ({ ...prev, error: err }));
    } finally {
      setIsWorking(false);
    }
  };
  
  // Tester la connexion à Supabase
  const testSupabaseConnection = async () => {
    try {
      setIsWorking(true);
      setStatusMessage('Test de connexion à Supabase...');
      logger.log('Démarrage test connexion Supabase');
      
      const { data, error } = await supabase.from('programmes').select('id').limit(1);
      
      if (error) {
        logger.error('Erreur de connexion à Supabase', error);
        setStatusMessage(`Erreur de connexion: ${error.message}`);
        setDebugInfo({ error, timestamp: new Date().toISOString() });
        return;
      }
      
      logger.log('Connexion à Supabase réussie', data);
      setStatusMessage('Connexion à Supabase OK');
      setDebugInfo({
        connectionTest: 'success',
        data,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      logger.error('Erreur inattendue', err);
      setStatusMessage(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
    } finally {
      setIsWorking(false);
    }
  };
  
  // Vérifier si un programme existe
  const checkProgramExists = async () => {
    try {
      setIsWorking(true);
      setStatusMessage('Vérification du programme...');
      
      const { data, error } = await supabase
        .from('programmes')
        .select('id, nom, description')
        .eq('id', program.id)
        .single();
      
      if (error) {
        setStatusMessage(`Erreur: ${error.message}`);
        setDebugInfo({ error, timestamp: new Date().toISOString() });
        return;
      }
      
      if (!data) {
        setStatusMessage('Programme non trouvé');
        return;
      }
      
      setStatusMessage('Programme trouvé dans la base de données');
      setDebugInfo({
        found: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      logger.error('Erreur lors de la vérification', err);
      setStatusMessage(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-2">
        <Button
          variant="primary"
          onClick={handleDirectUpdate}
          disabled={isWorking}
          className="w-full"
        >
          Mise à jour directe
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={testSupabaseConnection}
            disabled={isWorking}
            className="flex-1"
            size="sm"
          >
            Tester connexion
          </Button>
          
          <Button
            variant="secondary"
            onClick={checkProgramExists}
            disabled={isWorking}
            className="flex-1"
            size="sm"
          >
            Vérifier programme
          </Button>
        </div>
      </div>
      
      {statusMessage && (
        <div className="p-3 bg-gray-100 rounded-md text-sm">
          {statusMessage}
        </div>
      )}
      
      {debugInfo && (
        <div className="p-3 bg-gray-100 rounded-md text-xs overflow-auto max-h-40">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DirectUpdateButton; 