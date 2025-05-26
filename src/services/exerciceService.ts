import { supabase } from '../lib/supabase';

// Service pour les opérations sur les exercices
export const exerciceService = {
  // Vérifier la structure de la table exercices
  checkTableStructure: async () => {
    try {
      // Vérifier si on peut accéder à la table
      const { data, error } = await supabase
        .from('exercices')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('Erreur lors de l\'accès à la table exercices:', error);
        return { success: false, error };
      }
      
      // Extraire les informations sur les colonnes
      const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
      return { 
        success: true, 
        columns, 
        sample: data?.[0],
        hasData: data && data.length > 0
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de la table exercices:', error);
      return { success: false, error };
    }
  },
  
  // Vérifier si un jour donné existe
  verifyJourExists: async (jourId: string) => {
    if (!jourId) return { exists: false, error: 'ID du jour non fourni' };
    
    try {
      const { data, error } = await supabase
        .from('jours')
        .select('id, numero_jour, programme_id')
        .eq('id', jourId)
        .single();
        
      if (error) {
        console.error(`[EXERCICE SERVICE] Jour ID ${jourId} non trouvé:`, error);
        return { exists: false, error };
      }
      
      return { exists: true, data };
    } catch (error) {
      console.error(`[EXERCICE SERVICE] Erreur lors de la vérification du jour ${jourId}:`, error);
      return { exists: false, error };
    }
  },
  
  // Trouver un jour qui a déjà des exercices fonctionnels
  findWorkingDay: async (programId: string, currentJourId: string) => {
    try {
      // 1. Obtenir tous les jours du programme
      const { data: jours, error: joursError } = await supabase
        .from('jours')
        .select('id, numero_jour')
        .eq('programme_id', programId)
        .order('numero_jour', { ascending: true });
        
      if (joursError || !jours || jours.length === 0) {
        return { found: false, error: 'Aucun jour trouvé pour ce programme' };
      }
      
      console.log(`[EXERCICE SERVICE] ${jours.length} jours trouvés pour le programme ${programId}`);
      
      // 2. Pour chaque jour, vérifier s'il a des exercices
      for (const jour of jours) {
        // Ne pas vérifier le jour en cours
        if (jour.id === currentJourId) continue;
        
        const { data: exercices } = await supabase
          .from('exercices')
          .select('id')
          .eq('jour_id', jour.id)
          .limit(1);
          
        if (exercices && exercices.length > 0) {
          console.log(`[EXERCICE SERVICE] Jour ${jour.numero_jour} (ID: ${jour.id}) a des exercices`);
          return { found: true, jourId: jour.id, numero_jour: jour.numero_jour };
        }
      }
      
      return { found: false, error: 'Aucun jour avec exercices trouvé' };
    } catch (error) {
      console.error('[EXERCICE SERVICE] Erreur lors de la recherche d\'un jour fonctionnel:', error);
      return { found: false, error };
    }
  },
  
  // Ajouter un exercice avec gestion d'erreur robuste
  addExercice: async (jourId: string, exerciceData: any) => {
    try {
      console.log('[EXERCICE SERVICE] Tentative d\'ajout d\'exercice - jour_id:', jourId);
      
      // Validation de l'ID du jour
      if (!jourId) {
        console.error('[EXERCICE SERVICE] ID du jour non fourni');
        return { success: false, error: 'ID du jour non fourni' };
      }
      
      // Vérifier que l'ID est bien un UUID valide
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jourId);
      if (!isValidUUID) {
        console.error('[EXERCICE SERVICE] ID du jour invalide (non UUID):', jourId);
        return { success: false, error: `ID du jour invalide: ${jourId}` };
      }

      // Vérifier l'existence du jour et récupérer les infos du programme
      const { data: jourInfo, error: jourError } = await supabase
        .from('jours')
        .select('id, numero_jour, programme_id')
        .eq('id', jourId)
        .single();
      
      if (jourError || !jourInfo) {
        console.error('[EXERCICE SERVICE] Jour non trouvé:', jourError);
        return { success: false, error: 'Jour non trouvé', details: jourError };
      }
      
      const programId = jourInfo.programme_id;
      console.log(`[EXERCICE SERVICE] Jour #${jourInfo.numero_jour} trouvé, Programme: ${programId}`);
      
      // Vérifier d'abord si ce jour a déjà des exercices
      const { data: existingExercises } = await supabase
        .from('exercices')
        .select('id')
        .eq('jour_id', jourId)
        .limit(1);
        
      if (existingExercises && existingExercises.length > 0) {
        console.log('[EXERCICE SERVICE] Ce jour a déjà des exercices, ajout simple');
        
        // Ce jour a déjà des exercices, ajouter normalement
        return await exerciceService.addExerciceNormal(jourId, exerciceData);
      }
      
      // Si ce jour n'a pas d'exercices, chercher un autre jour du même programme qui en a
      const { found, jourId: workingJourId } = await exerciceService.findWorkingDay(programId, jourId);
      
      if (found && workingJourId) {
        console.log(`[EXERCICE SERVICE] Trouvé un jour (${workingJourId}) avec des exercices fonctionnels`);
        
        // Copier la structure d'un exercice existant
        const { data: exerciceModel } = await supabase
          .from('exercices')
          .select('*')
          .eq('jour_id', workingJourId)
          .limit(1)
          .single();
          
        if (exerciceModel) {
          console.log('[EXERCICE SERVICE] Modèle d\'exercice trouvé, adaptation en cours...');
          
          // Créer un nouveau modèle basé sur l'exercice existant
          let adaptedData = { ...exerciceModel };
          delete adaptedData.id; // Supprimer l'ID pour la création
          adaptedData.jour_id = jourId; // Mettre à jour l'ID du jour
          
          // Appliquer les données fournies
          Object.keys(exerciceData).forEach(key => {
            if (key in adaptedData) {
              adaptedData[key] = exerciceData[key];
            }
          });
          
          // Ajouter les champs obligatoires s'ils sont manquants
          if (!adaptedData.nom && exerciceData.nom) adaptedData.nom = exerciceData.nom;
          else if (!adaptedData.nom) adaptedData.nom = 'Exercice';
          
          // Ajouter la variante si elle est fournie
          if (exerciceData.variante) adaptedData.variante = exerciceData.variante;
          
          console.log('[EXERCICE SERVICE] Données adaptées:', adaptedData);
          
          // Tenter l'insertion avec la structure adaptée
          const { data: result, error: insertError } = await supabase
            .from('exercices')
            .insert([adaptedData])
            .select('id')
            .single();
            
          if (insertError) {
            console.error('[EXERCICE SERVICE] Erreur lors de l\'insertion avec structure adaptée:', insertError);
            return { success: false, error: insertError };
          }
          
          return { success: true, data: result, method: 'adapted' };
        }
      }
      
      // Si aucune adaptation n'est possible, essayer l'ajout normal
      return await exerciceService.addExerciceNormal(jourId, exerciceData);
    } catch (err) {
      console.error('[EXERCICE SERVICE] Erreur lors de l\'ajout de l\'exercice:', err);
      return { success: false, error: err };
    }
  },
  
  // Méthode standard d'ajout d'exercice
  addExerciceNormal: async (jourId: string, exerciceData: any) => {
    try {
      console.log('[EXERCICE SERVICE] Ajout standard d\'exercice');
      
      // Récupérer la structure des colonnes
      const { success, columns } = await exerciceService.checkTableStructure();
      
      // Construire un objet avec uniquement les colonnes existantes
      const filteredData: Record<string, any> = { jour_id: jourId };
      
      if (success && columns && columns.length > 0) {
        // Ajouter uniquement les propriétés qui existent comme colonnes
        Object.keys(exerciceData).forEach(key => {
          if (columns.includes(key)) {
            filteredData[key] = exerciceData[key];
          }
        });
      } else {
        // Si la structure n'a pas pu être récupérée, essayer avec les données de base
        if (exerciceData.nom) filteredData.nom = exerciceData.nom;
        if (exerciceData.type) filteredData.type = exerciceData.type;
        if (exerciceData.niveau) filteredData.niveau = exerciceData.niveau;
        if (exerciceData.ordre) filteredData.ordre = exerciceData.ordre;
        if (exerciceData.valeur_cible) filteredData.valeur_cible = exerciceData.valeur_cible;
        if (exerciceData.variante) filteredData.variante = exerciceData.variante;
      }
      
      console.log('[EXERCICE SERVICE] Données à insérer:', filteredData);
      
      // Insérer l'exercice
      const { data, error } = await supabase
        .from('exercices')
        .insert([filteredData])
        .select('id')
        .single();
      
      if (error) {
        console.error('[EXERCICE SERVICE] Erreur lors de l\'insertion standard:', error);
        return { success: false, error };
          }
          
      return { success: true, data, method: 'normal' };
    } catch (error) {
      console.error('[EXERCICE SERVICE] Erreur lors de l\'ajout standard:', error);
      return { success: false, error };
    }
  },
  
  // Méthode de dernier recours pour ajouter un exercice avec seulement l'ID du jour
  addRawExercice: async (jourId: string) => {
    try {
      console.log('[EXERCICE SERVICE] Tentative d\'ajout minimal avec uniquement jour_id:', jourId);
      
      const { data, error } = await supabase
        .from('exercices')
        .insert([{ jour_id: jourId }])
        .select('id')
        .single();
      
      if (error) {
        console.error('[EXERCICE SERVICE] Erreur lors de l\'insertion minimale:', error);
        
        // En dernier recours, simuler un succès côté client
        return { 
          success: true, 
          data: { 
            id: `temp-${Date.now()}`,
            jour_id: jourId,
            isTemporary: true
          },
          isTemporary: true,
          message: 'Exercice temporaire créé côté client'
        };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('[EXERCICE SERVICE] Erreur lors de l\'ajout brut:', error);
      return { success: false, error };
    }
  },
  
  // Exécuter une requête SQL personnalisée (pour le débogage)
  executeCustomQuery: async (query: string) => {
    try {
      console.log('Exécution de requête SQL personnalisée:', query);
      
      const { data, error } = await supabase.rpc(
        'execute_sql',
        { sql_query: query }
      );
      
      if (error) {
        console.error('Erreur lors de l\'exécution de la requête personnalisée:', error);
        return { success: false, error };
      }
      
      console.log('Résultat de la requête personnalisée:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Erreur lors de l\'exécution de la requête personnalisée:', error);
      return { success: false, error };
    }
  }
};

export default exerciceService; 