import { supabase } from '../lib/supabase';
import { Program, DailyExercises } from '../types';

/**
 * Script de migration pour corriger les problèmes entre programmes et exercices
 */
export const migrateExercisesToJoursTable = async () => {
  console.log('Démarrage de la migration exercices -> jours');
  
  try {
    // 1. Récupérer tous les programmes
    const { data: programmes, error: progError } = await supabase
      .from('programmes')
      .select('*');
    
    if (progError) {
      console.error('Erreur lors de la récupération des programmes:', progError);
      return { success: false, error: progError };
    }
    
    console.log(`${programmes?.length || 0} programmes trouvés`);
    
    // Compteurs pour le rapport
    let migrated = 0;
    let skipped = 0;
    let failed = 0;
    
    // 2. Pour chaque programme qui contient des exercices (dans l'ancienne structure)
    for (const programme of programmes || []) {
      try {
        // Vérifier si le programme a des exercices
        const exercises = programme.exercises || programme.metadata?.exercises;
        if (!exercises || Object.keys(exercises).length === 0) {
          console.log(`Programme ${programme.id} - pas d'exercices à migrer`);
          skipped++;
          continue;
        }
        
        // 3. Obtenir les exercices existants dans la table jours
        const { data: existingJours, error: joursError } = await supabase
          .from('jours')
          .select('numero_jour, exercise_id')
          .eq('programme_id', programme.id);
        
        if (joursError) {
          console.error(`Erreur lors de la vérification des jours pour le programme ${programme.id}:`, joursError);
          failed++;
          continue;
        }
        
        // Si des exercices existent déjà dans la table jours, on passe
        if (existingJours && existingJours.length > 0) {
          console.log(`Programme ${programme.id} - des exercices existent déjà dans la table jours`);
          skipped++;
          continue;
        }
        
        // 4. Préparer les données pour insertion
        const joursToInsert = [];
        let totalExercises = 0;
        
        for (const [dayStr, exerciseIds] of Object.entries(exercises)) {
          const dayNumber = parseInt(dayStr, 10);
          
          if (isNaN(dayNumber)) continue;
          
          if (Array.isArray(exerciseIds) && exerciseIds.length > 0) {
            exerciseIds.forEach((exerciseId) => {
              if (typeof exerciseId === 'string' && exerciseId.trim()) {
                joursToInsert.push({
                  programme_id: programme.id,
                  numero_jour: dayNumber,
                  exercise_id: exerciseId
                });
                totalExercises++;
              }
            });
          }
        }
        
        if (joursToInsert.length === 0) {
          console.log(`Programme ${programme.id} - aucun exercice valide à migrer`);
          skipped++;
          continue;
        }
        
        // 5. Insérer les données dans la table jours
        const { error: insertError } = await supabase
          .from('jours')
          .insert(joursToInsert);
        
        if (insertError) {
          console.error(`Erreur lors de l'insertion des jours pour le programme ${programme.id}:`, insertError);
          failed++;
          continue;
        }
        
        console.log(`Programme ${programme.id} - ${totalExercises} exercices migrés avec succès`);
        migrated++;
        
      } catch (err) {
        console.error(`Erreur lors de la migration du programme ${programme.id}:`, err);
        failed++;
      }
    }
    
    return {
      success: true,
      migrated,
      skipped,
      failed,
      total: (programmes?.length || 0)
    };
    
  } catch (error) {
    console.error('Erreur globale lors de la migration:', error);
    return { success: false, error };
  }
};

// Script pour nettoyer les exercices invalides
export const cleanInvalidExercises = async () => {
  console.log('Démarrage du nettoyage des exercices invalides');
  
  try {
    // 1. Récupérer tous les jours avec leurs exercices
    const { data: jours, error: joursError } = await supabase
      .from('jours')
      .select('id, programme_id, numero_jour, exercise_id');
    
    if (joursError) {
      console.error('Erreur lors de la récupération des jours:', joursError);
      return { success: false, error: joursError };
    }
    
    console.log(`${jours?.length || 0} entrées dans la table jours`);
    
    // Compteurs pour le rapport
    let checkedExercises = 0;
    let invalidExercises = 0;
    
    // 2. Vérifier l'existence de chaque exercice
    for (const jour of jours || []) {
      checkedExercises++;
      
      // Vérifier si l'exercice existe
      const { data: exercise, error: exerciseError } = await supabase
        .from('exercices')
        .select('id')
        .eq('id', jour.exercise_id)
        .single();
      
      if (exerciseError || !exercise) {
        console.warn(`Exercice invalide trouvé: ${jour.exercise_id} (jour ${jour.numero_jour}, programme ${jour.programme_id})`);
        
        // Supprimer l'entrée invalide
        const { error: deleteError } = await supabase
          .from('jours')
          .delete()
          .eq('id', jour.id);
        
        if (deleteError) {
          console.error(`Erreur lors de la suppression de l'entrée invalide:`, deleteError);
        } else {
          invalidExercises++;
          console.log(`Entrée invalide supprimée: ${jour.id}`);
        }
      }
      
      // Ajouter une pause pour éviter de surcharger l'API
      if (checkedExercises % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return {
      success: true,
      checkedExercises,
      invalidExercises
    };
    
  } catch (error) {
    console.error('Erreur globale lors du nettoyage:', error);
    return { success: false, error };
  }
};

export const runAllMigrations = async () => {
  console.log('=== DÉMARRAGE DES MIGRATIONS ===');
  
  const migrateResult = await migrateExercisesToJoursTable();
  console.log('Résultat de la migration:', migrateResult);
  
  const cleanResult = await cleanInvalidExercises();
  console.log('Résultat du nettoyage:', cleanResult);
  
  console.log('=== FIN DES MIGRATIONS ===');
  
  return {
    migrateResult,
    cleanResult
  };
}; 