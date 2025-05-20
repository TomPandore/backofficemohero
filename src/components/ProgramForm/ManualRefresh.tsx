import React, { useState } from 'react';
import { Program } from '../../types';
import { supabase } from '../../lib/supabase';
import Button from '../UI/Button';
import { logger } from '../../lib/logger';

interface ManualRefreshProps {
  program: Program;
}

const ManualRefresh: React.FC<ManualRefreshProps> = ({ program }) => {
  const [status, setStatus] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const updateAndRefresh = async () => {
    try {
      setIsWorking(true);
      setStatus('Mise à jour en cours...');
      
      // Vérifier que l'ID du programme est bien défini
      if (!program.id) {
        const errMsg = 'ID du programme non défini';
        logger.error(errMsg);
        setStatus(`Erreur: ${errMsg}`);
        setIsWorking(false);
        return;
      }
      
      // S'assurer que tous les champs sont correctement formatés
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
      
      logger.log('⚡️ Tentative de mise à jour avec rafraîchissement forcé', {
        program_id: program.id,
        updateData,
        currentDate: new Date().toISOString()
      });
      
      // Tester d'abord si le programme existe
      const { data: checkData, error: checkError } = await supabase
        .from('programmes')
        .select('id, nom')
        .eq('id', program.id)
        .single();
      
      if (checkError) {
        logger.error('Erreur lors de la vérification du programme', checkError);
        setStatus(`Erreur de vérification: ${checkError.message}`);
        setIsWorking(false);
        return;
      }
      
      logger.log('Programme vérifié avant mise à jour:', checkData);
      
      // Appel direct à Supabase avec sélection des données mises à jour
      const { data, error } = await supabase
        .from('programmes')
        .update(updateData)
        .eq('id', program.id)
        .select();
      
      if (error) {
        logger.error('Erreur lors de la mise à jour', error);
        setStatus(`Erreur: ${error.message}`);
        setIsWorking(false);
        return;
      }
      
      logger.log('Réponse de Supabase après mise à jour:', data);
      
      // Vérifier que la mise à jour a bien été effectuée
      if (!data || data.length === 0) {
        logger.warn('Pas de données retournées par Supabase, vérification supplémentaire');
        
        // Vérifier à nouveau que le programme existe et a été mis à jour
        const { data: verifyData, error: verifyError } = await supabase
          .from('programmes')
          .select('*')
          .eq('id', program.id)
          .single();
        
        if (verifyError) {
          logger.error('Erreur lors de la vérification après mise à jour', verifyError);
        } else {
          logger.log('Vérification après mise à jour:', verifyData);
        }
      }
      
      // Stocker un indicateur pour savoir que l'update a réussi
      localStorage.setItem('MOHERO_UPDATE_SUCCESS', 'true');
      localStorage.setItem('MOHERO_UPDATE_TIME', new Date().toISOString());
      localStorage.setItem('MOHERO_UPDATED_PROGRAM_ID', program.id);
      
      logger.log('✅ Mise à jour réussie, rafraîchissement de la page...');
      setStatus('Mise à jour réussie! Rafraîchissement...');
      
      // Attendre un peu pour que l'utilisateur voie le message
      setTimeout(() => {
        // Force un rafraîchissement complet de la page
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      logger.error('Erreur globale', error);
      setStatus(`Erreur: ${error instanceof Error ? error.message : 'Inconnue'}`);
      setIsWorking(false);
    }
  };

  return (
    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
      <div className="flex flex-col items-center">
        <Button
          type="button"
          variant="primary"
          onClick={updateAndRefresh}
          disabled={isWorking}
          className="w-full py-3 font-medium"
        >
          {isWorking ? 'Mise à jour en cours...' : 'Mettre à jour le programme'}
        </Button>
        
        {status && (
          <div className="mt-2 p-2 bg-white text-sm rounded w-full text-center">
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualRefresh; 