import { supabase } from '../lib/supabase';
import { exerciceService } from './exerciceService';
import { Program, Phase, DailyExercises, ProgramDay, Exercise } from '../types';

// Mapper un objet de la base de données vers un objet du frontend
const mapDbProgramToProgram = (dbProgram: any): Program => {
  // Normaliser le type si nécessaire (pour les anciens enregistrements)
  let programType = dbProgram.type || 'Découverte';
  if (programType === 'découverte') {
    programType = 'Découverte';
  }

  return {
    id: dbProgram.id,
    name: dbProgram.nom || '',
    description: dbProgram.description || '',
    duration: dbProgram.duree_jours || 28,
    type: programType,
    clan_id: dbProgram.clan_id,
    tags: Array.isArray(dbProgram.tags) ? dbProgram.tags : [],
    results: Array.isArray(dbProgram.resultats) ? dbProgram.resultats : [],
    summary: Array.isArray(dbProgram.parcours_resume) ? dbProgram.parcours_resume : [],
    image_url: dbProgram.image_url || '',
    niveau_difficulte: dbProgram.niveau_difficulte || 'medium',
    exercises: dbProgram.exercises || {}
  };
};

// Mapper un objet du frontend vers un objet pour la base de données
const mapProgramToDbProgram = (program: Omit<Program, 'id'>) => {
  return {
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
};

// Service pour les programmes
export const programService = {
  // Récupérer tous les programmes
  getAll: async (): Promise<Program[]> => {
    try {
      const { data, error } = await supabase
        .from('programmes')
        .select('*')
        .order('nom', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(mapDbProgramToProgram);
    } catch (error) {
      console.error('Erreur lors de la récupération des programmes:', error);
      throw error;
    }
  },

  // Récupérer un programme par ID
  getById: async (id: string): Promise<Program | null> => {
    try {
      // 1. Récupérer les informations de base du programme
      const { data, error } = await supabase
        .from('programmes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;
      
      // 2. Récupérer les exercices du programme
      const { data: jourData, error: jourError } = await supabase
        .from('jours')
        .select('numero_jour, exercise_id')
        .eq('programme_id', id);
      
      if (jourError) {
        console.warn('Erreur lors de la récupération des exercices:', jourError);
        // Ne pas échouer si les exercices ne peuvent pas être récupérés
      }
      
      // 3. Organiser les exercices par jour
      const exercises: DailyExercises = {};
      
      if (jourData && jourData.length > 0) {
        jourData.forEach((jour) => {
          const day = jour.numero_jour;
          const exerciseId = jour.exercise_id;
          
          if (!exercises[day]) {
            exercises[day] = [];
          }
          
          if (exerciseId && !exercises[day].includes(exerciseId)) {
            exercises[day].push(exerciseId);
          }
        });
      }
      
      // 4. Mapper les données avec les exercices
      const program = mapDbProgramToProgram(data);
      program.exercises = exercises;
      
      return program;
    } catch (error) {
      console.error(`Erreur lors de la récupération du programme ${id}:`, error);
      throw error;
    }
  },

  // Créer un nouveau programme
  create: async (program: Omit<Program, 'id'>): Promise<Program> => {
    try {
      // Utiliser directement les données mappées sans déstructurer
      const programData = mapProgramToDbProgram(program);
      
      // Corriger le problème de type UUID pour clan_id
      // Si clan_id n'est pas un UUID valide, le mettre à null
      if (programData.clan_id && typeof programData.clan_id === 'string') {
        // Vérifier si c'est un UUID valide avec regex
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(programData.clan_id)) {
          console.warn(`clan_id "${programData.clan_id}" n'est pas un UUID valide, définition à null`);
          programData.clan_id = null;
        }
      }
      
      console.log('Création de programme - Données:', JSON.stringify(programData, null, 2));
      
      const { data, error } = await supabase
        .from('programmes')
        .insert([programData])
        .select('*')
        .single();

      if (error) {
        console.error('Erreur lors de la création du programme:', error);
        console.error('Code erreur:', error.code);
        console.error('Message erreur:', error.message);
        console.error('Détails:', error.details);
        throw error;
      }
      
      if (!data) throw new Error('Aucune donnée retournée après création');
      
      const createdProgram = mapDbProgramToProgram(data);
      
      // Si le programme avait des exercices, les ajouter séparément
      if (program.exercises && Object.keys(program.exercises).length > 0 && data.id) {
        try {
          await programService.updateProgramExercises(data.id, program.exercises);
        } catch (exerciseError) {
          console.warn('Programme créé mais erreur lors de l\'ajout des exercices:', exerciseError);
          // On continue car le programme a été créé
        }
      }
      
      return createdProgram;
    } catch (error) {
      console.error('Erreur lors de la création du programme:', error);
      throw error;
    }
  },

  // Mettre à jour un programme
  update: async (id: string, program: Omit<Program, 'id'>): Promise<Program> => {
    try {
      // Créer une copie des données à envoyer sans le champ exercises
      const programData = mapProgramToDbProgram(program);
      
      console.log('Mise à jour du programme - ID:', id);
      console.log('Données envoyées:', JSON.stringify(programData, null, 2));
      
      // Mise à jour des champs principaux
      const { data, error } = await supabase
        .from('programmes')
        .update(programData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Erreur Supabase lors de la mise à jour:', error);
        console.error('Code erreur:', error.code);
        console.error('Message erreur:', error.message);
        console.error('Détails:', error.details);
        throw error;
      }
      
      if (!data) {
        console.error('Aucune donnée retournée après mise à jour pour ID:', id);
        throw new Error('Aucune donnée retournée après mise à jour');
      }
      
      console.log('Données reçues après mise à jour des champs principaux:', data);
      
      // Mettre à jour les exercices si nécessaire
      if (program.exercises && Object.keys(program.exercises).length > 0) {
        try {
          await programService.updateProgramExercises(id, program.exercises);
          // Recharger le programme complet pour avoir les exercices à jour
          const updatedProgram = await programService.getById(id);
          return updatedProgram || mapDbProgramToProgram(data);
        } catch (exerciseError) {
          console.warn('Mise à jour principale réussie mais erreur lors de la mise à jour des exercices:', exerciseError);
          // On continue car la mise à jour principale a réussi
        }
      }
      
      return mapDbProgramToProgram(data);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du programme ${id}:`, error);
      throw error;
    }
  },

  // Supprimer un programme
  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('programmes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error(`Erreur lors de la suppression du programme ${id}:`, error);
      throw error;
    }
  },
  
  // Obtenir les exercices pour un jour spécifique
  getExercisesForDay: async (programId: string, day: number): Promise<string[]> => {
    try {
      const program = await programService.getById(programId);
      if (!program) throw new Error('Programme non trouvé');
      
      const exercises = program.exercises || {};
      return exercises[day] || [];
    } catch (error) {
      console.error(`Erreur lors de la récupération des exercices pour le jour ${day} du programme ${programId}:`, error);
      throw error;
    }
  },
  
  // Obtenir tous les jours avec exercices pour un programme
  getProgramDays: async (programId: string): Promise<ProgramDay[]> => {
    try {
      const program = await programService.getById(programId);
      if (!program) throw new Error('Programme non trouvé');
      
      const exercises = program.exercises || {};
      const days: ProgramDay[] = [];
      
      // Convertir l'objet exercices en tableau de jours
      Object.keys(exercises).forEach(dayStr => {
        const day = parseInt(dayStr, 10);
        if (!isNaN(day) && Array.isArray(exercises[day])) {
          days.push({
            day,
            exercises: exercises[day]
          });
        }
      });
      
      // Trier par numéro de jour
      return days.sort((a, b) => a.day - b.day);
    } catch (error) {
      console.error(`Erreur lors de la récupération des jours du programme ${programId}:`, error);
      throw error;
    }
  },
  
  // Ajouter un exercice à un jour spécifique d'un programme
  addExerciseToDay: async (programId: string, day: number, exerciseId: string): Promise<void> => {
    try {
      // D'abord récupérer le programme
      const program = await programService.getById(programId);
      if (!program) throw new Error('Programme non trouvé');
      
      // Initialiser la structure des exercices si nécessaire
      const exercises: DailyExercises = program.exercises || {};
      
      // Ajouter l'exercice au jour spécifié
      if (!exercises[day]) {
        exercises[day] = [];
      }
      
      // Éviter les doublons
      if (!exercises[day].includes(exerciseId)) {
        exercises[day].push(exerciseId);
      }
      
      // Mettre à jour le programme
      await programService.update(programId, {
        ...program,
        exercises
      });
    } catch (error) {
      console.error(`Erreur lors de l'ajout de l'exercice au programme ${programId}:`, error);
      throw error;
    }
  },
  
  // Supprimer un exercice d'un jour spécifique d'un programme
  removeExerciseFromDay: async (programId: string, day: number, exerciseId: string): Promise<void> => {
    try {
      // D'abord récupérer le programme
      const program = await programService.getById(programId);
      if (!program) throw new Error('Programme non trouvé');
      
      // Vérifier si des exercices existent pour ce jour
      const exercises: DailyExercises = program.exercises || {};
      if (!exercises[day] || !exercises[day].includes(exerciseId)) {
        return; // L'exercice n'existe pas pour ce jour, rien à faire
      }
      
      // Supprimer l'exercice
      exercises[day] = exercises[day].filter(id => id !== exerciseId);
      
      // Nettoyer les jours vides
      if (exercises[day].length === 0) {
        delete exercises[day];
      }
      
      // Mettre à jour le programme
      await programService.update(programId, {
        ...program,
        exercises
      });
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'exercice du programme ${programId}:`, error);
      throw error;
    }
  },

  // Mettre à jour uniquement les exercices d'un programme
  updateProgramExercises: async (programId: string, exercises: DailyExercises): Promise<void> => {
    try {
      console.log('Mise à jour des exercices uniquement - ID:', programId);
      console.log('Exercices à mettre à jour (brut):', JSON.stringify(exercises, null, 2));
      
      // Vérifier et nettoyer la structure des exercices
      let cleanedExercises: DailyExercises = {};
      
      // S'assurer que la structure des exercices est valide
      if (typeof exercises !== 'object' || exercises === null) {
        console.warn('La structure exercises n\'est pas un objet valide:', exercises);
        cleanedExercises = {};
      } else {
        // Conversion deep copy pour éviter les références
        cleanedExercises = JSON.parse(JSON.stringify(exercises));
        
        // Nettoyage des jours vides ou mal formés
        Object.keys(cleanedExercises).forEach(day => {
          const dayNumber = parseInt(day, 10);
          if (isNaN(dayNumber)) {
            console.warn(`Jour invalide (pas un nombre): ${day}`);
            delete cleanedExercises[day as any];
            return;
          }
          
          if (!Array.isArray(cleanedExercises[dayNumber])) {
            console.warn(`Structure invalide pour le jour ${day}: les exercices ne sont pas un tableau`, cleanedExercises[dayNumber]);
            cleanedExercises[dayNumber] = [];
            return;
          }
          
          // Filtrer les IDs d'exercices non valides (vides, null, undefined)
          cleanedExercises[dayNumber] = cleanedExercises[dayNumber].filter(id => {
            const isValid = typeof id === 'string' && id.trim().length > 0;
            if (!isValid) {
              console.warn(`ID d'exercice invalide trouvé dans le jour ${day}:`, id);
            }
            return isValid;
          });
        });
      }
      
      console.log('Exercices nettoyés avant envoi:', JSON.stringify(cleanedExercises, null, 2));
      
      // D'abord, obtenir le programme pour vérifier qu'il existe
      const { data: programData, error: programError } = await supabase
        .from('programmes')
        .select('id')
        .eq('id', programId)
        .single();
      
      if (programError) {
        console.error('Erreur lors de la vérification du programme:', programError);
        throw programError;
      }
      
      if (!programData) {
        throw new Error(`Programme ${programId} non trouvé`);
      }
      
      // Nouvelle approche: vérifier d'abord le schéma de la table jours
      const { data: jourSchemaData, error: schemaError } = await supabase
        .from('jours')
        .select('*')
        .limit(1);
      
      if (schemaError) {
        console.error('Erreur lors de la vérification du schéma de la table jours:', schemaError);
        throw schemaError;
      }
      
      // Déterminer si la table jours a une colonne exercise_id ou non
      const useExerciseIdColumn = jourSchemaData && jourSchemaData.length > 0 && 'exercise_id' in jourSchemaData[0];
      
      console.log(`Schéma de la table jours détecté avec colonne exercise_id: ${useExerciseIdColumn}`);
      
      // 1. Supprimer les jours existants pour ce programme
      const { error: deleteError } = await supabase
        .from('jours')
        .delete()
        .eq('programme_id', programId);
      
      if (deleteError) {
        console.error('Erreur lors de la suppression des jours existants:', deleteError);
        throw deleteError;
      }
      
      // 2. Insérer les nouveaux jours avec leurs exercices
      if (Object.keys(cleanedExercises).length > 0) {
        // Préparer les données pour insertion
        if (useExerciseIdColumn) {
          // Ancien schéma avec exercise_id dans la table jours
          interface JourExerciseEntry {
            programme_id: string;
            numero_jour: number;
            exercise_id: string;
          }
          
          const joursToInsert: JourExerciseEntry[] = [];
          
          for (const [dayStr, exerciseIds] of Object.entries(cleanedExercises)) {
            const dayNumber = parseInt(dayStr, 10);
            if (!isNaN(dayNumber) && Array.isArray(exerciseIds) && exerciseIds.length > 0) {
              exerciseIds.forEach((exerciseId) => {
                joursToInsert.push({
                  programme_id: programId,
                  numero_jour: dayNumber,
                  exercise_id: exerciseId
                });
              });
            }
          }
          
          if (joursToInsert.length > 0) {
            const { error: insertError } = await supabase
              .from('jours')
              .insert(joursToInsert);
            
            if (insertError) {
              console.error('Erreur lors de l\'insertion des jours:', insertError);
              throw insertError;
            }
          }
        } else {
          // Nouveau schéma: d'abord créer les jours puis associer les exercices
          // 1. Insérer les jours
          const joursToInsert = Object.keys(cleanedExercises).map(dayStr => {
            const dayNumber = parseInt(dayStr, 10);
            return {
              programme_id: programId,
              numero_jour: dayNumber
            };
          });
          
          if (joursToInsert.length > 0) {
            const { data: insertedJours, error: insertJoursError } = await supabase
              .from('jours')
              .insert(joursToInsert)
              .select('id, numero_jour');
            
            if (insertJoursError) {
              console.error('Erreur lors de l\'insertion des jours:', insertJoursError);
              throw insertJoursError;
            }
            
            // 2. Associer les exercices aux jours créés
            if (insertedJours && insertedJours.length > 0) {
              for (const jour of insertedJours) {
                const dayNumber = jour.numero_jour;
                const jourId = jour.id;
                const exerciseIds = cleanedExercises[dayNumber];
                
                if (Array.isArray(exerciseIds) && exerciseIds.length > 0) {
                  // Pour chaque exercice du jour
                  for (const exerciseId of exerciseIds) {
                    const exerciceData = {
                      jour_id: jourId,
                      nom: `Exercice ${exerciseId}`, // Valeur par défaut
                      type: 'default',
                      niveau: 1
                    };
                    
                    // Essayer de récupérer les informations de l'exercice depuis la banque
                    try {
                      const { data: exerciseData, error: exerciseError } = await supabase
                        .from('bank_exercises')
                        .select('*')
                        .eq('id', exerciseId)
                        .single();
                      
                      if (!exerciseError && exerciseData) {
                        exerciceData.nom = exerciseData.name || exerciceData.nom;
                        exerciceData.type = exerciseData.type || exerciceData.type;
                        exerciceData.niveau = exerciseData.level || exerciceData.niveau;
                      }
                    } catch (e) {
                      console.warn(`Impossible de récupérer les données de l'exercice ${exerciseId}:`, e);
                    }
                    
                    // Insérer l'exercice dans la table exercices
                    const { error: insertExerciseError } = await supabase
                      .from('exercices')
                      .insert([exerciceData]);
                    
                    if (insertExerciseError) {
                      console.error(`Erreur lors de l'ajout de l'exercice ${exerciseId} au jour ${dayNumber}:`, insertExerciseError);
                      // Continuer malgré l'erreur pour les autres exercices
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      console.log('Exercices mis à jour avec succès pour ID:', programId);
      
    } catch (error) {
      console.error(`Erreur lors de la mise à jour des exercices du programme ${programId}:`, error);
      throw error;
    }
  },

  // Fonction de diagnostic pour les mises à jour
  diagnoseUpdateIssue: async (programId: string): Promise<any> => {
    try {
      // 1. Récupérer l'état actuel du programme
      const { data: currentData, error: fetchError } = await supabase
        .from('programmes')
        .select('*')
        .eq('id', programId)
        .single();
      
      if (fetchError) {
        return { 
          success: false, 
          step: 'fetch', 
          error: fetchError 
        };
      }
      
      // 2. Préparation de données de test simples
      const testUpdate = {
        nom: `Test ${new Date().toISOString()}`,
        description: `Description de test générée à ${new Date().toISOString()}`
      };
      
      // 3. Tenter une mise à jour minimale avec des données simples
      const { data: updateData, error: updateError } = await supabase
        .from('programmes')
        .update(testUpdate)
        .eq('id', programId)
        .select('nom, description')
        .single();
      
      if (updateError) {
        return { 
          success: false, 
          step: 'update', 
          error: updateError,
          originalData: currentData
        };
      }
      
      // 4. Vérifier si la mise à jour a réussi
      const { data: verifyData, error: verifyError } = await supabase
        .from('programmes')
        .select('nom, description')
        .eq('id', programId)
        .single();
      
      if (verifyError) {
        return { 
          success: false, 
          step: 'verify', 
          error: verifyError,
          updateData
        };
      }
      
      // 5. Comparer les données pour voir si la mise à jour a été enregistrée
      const updateSuccess = verifyData && verifyData.nom === testUpdate.nom;
      
      // 6. Restaurer les données d'origine
      const restoreData = {
        nom: currentData.nom,
        description: currentData.description
      };
      
      await supabase
        .from('programmes')
        .update(restoreData)
        .eq('id', programId);
      
      return {
        success: updateSuccess,
        step: 'complete',
        originalData: currentData,
        testUpdate,
        updateData,
        verifyData,
        match: updateSuccess
      };
    } catch (error) {
      console.error(`Erreur lors du diagnostic de mise à jour pour ${programId}:`, error);
      return { 
        success: false, 
        step: 'unknown', 
        error 
      };
    }
  },

  // Ajouter cette nouvelle fonction au service programService
  getAllProgramExercises: async (programId: string): Promise<{ [day: number]: Exercise[] }> => {
    try {
      // 1. Récupérer le programme
      const { data: program, error: programError } = await supabase
        .from('programmes')
        .select('*')
        .eq('id', programId)
        .single();
      
      if (programError) {
        console.error('Erreur lors de la récupération du programme:', programError);
        throw programError;
      }
      
      if (!program) throw new Error('Programme non trouvé');
      
      console.log(`getAllProgramExercises: Programme trouvé - ${program.nom}`);
      
      // 2. Récupérer tous les jours du programme
      const { data: jours, error: joursError } = await supabase
        .from('jours')
        .select('id, numero_jour')
        .eq('programme_id', programId);
      
      if (joursError) {
        console.error('Erreur lors de la récupération des jours:', joursError);
        throw joursError;
      }
      
      if (!jours || jours.length === 0) {
        console.log(`getAllProgramExercises: Aucun jour trouvé pour ce programme`);
        return {}; // Aucun jour à récupérer
      }
      
      console.log(`getAllProgramExercises: ${jours.length} jours trouvés`);
      
      // 3. Initialiser la structure de résultat
      const result: { [day: number]: Exercise[] } = {};
      
      // 4. Pour chaque jour, récupérer les exercices associés
      for (const jour of jours) {
        const numeroJour = jour.numero_jour;
        const jourId = jour.id;
        
        // Initialiser le tableau pour ce jour
        result[numeroJour] = [];
        
        // Récupérer les exercices liés à ce jour
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercices')
          .select('*')
          .eq('jour_id', jourId);
        
        if (exercisesError) {
          console.error(`Erreur lors de la récupération des exercices pour le jour ${numeroJour}:`, exercisesError);
          continue; // Passer au jour suivant en cas d'erreur
        }
        
        if (exercisesData && exercisesData.length > 0) {
          // Mapper les données de la base vers notre modèle d'exercice
          result[numeroJour] = exercisesData.map(dbExercise => ({
            id: dbExercise.id,
            name: dbExercise.nom || '',
            type: dbExercise.type || 'push',
            level: dbExercise.niveau || 1,
            zones: Array.isArray(dbExercise.zones) ? dbExercise.zones : []
          }));
          
          console.log(`getAllProgramExercises: Jour ${numeroJour} - ${result[numeroJour].length} exercices trouvés`);
        } else {
          console.log(`getAllProgramExercises: Aucun exercice trouvé pour le jour ${numeroJour}`);
        }
      }
      
      // 5. Journal des jours avec exercices
      const joursAvecExercices = Object.keys(result).filter(day => result[Number(day)].length > 0);
      console.log(`getAllProgramExercises: ${joursAvecExercices.length} jours ont des exercices:`, joursAvecExercices);
      
      return result;
    } catch (error) {
      console.error(`Erreur lors de la récupération de tous les exercices du programme ${programId}:`, error);
      throw error;
    }
  },

  // Fonction de diagnostic pour vérifier les structures des tables
  inspectTableStructures: async (programId: string) => {
    try {
      console.log('Inspection des structures de tables pour le programme:', programId);
      
      // Résultats d'inspection
      const results: any = {
        timestamp: new Date().toISOString(),
        tables: {}
      };
      
      // 1. Vérifier la structure de la table programmes
      const { data: programData, error: programError } = await supabase
        .from('programmes')
        .select('*')
        .eq('id', programId)
        .single();
        
      results.tables.programmes = {
        hasError: !!programError,
        error: programError,
        structure: programData ? Object.keys(programData) : [],
        sample: programData
      };
      
      // 2. Vérifier la structure de la table jours
      const { data: joursData, error: joursError } = await supabase
        .from('jours')
        .select('*')
        .eq('programme_id', programId)
        .limit(5);
        
      results.tables.jours = {
        hasError: !!joursError,
        error: joursError,
        structure: joursData && joursData.length > 0 ? Object.keys(joursData[0]) : [],
        count: joursData?.length || 0,
        sample: joursData && joursData.length > 0 ? joursData[0] : null
      };
      
      // Si des jours ont été trouvés, vérifier les exercices pour le premier jour
      if (joursData && joursData.length > 0) {
        const premierJour = joursData[0];
        
        // 3. Vérifier la structure de la table exercices
        const { data: exercicesData, error: exercicesError } = await supabase
          .from('exercices')
          .select('*')
          .eq('jour_id', premierJour.id)
          .limit(5);
          
        results.tables.exercices = {
          hasError: !!exercicesError,
          error: exercicesError,
          structure: exercicesData && exercicesData.length > 0 ? Object.keys(exercicesData[0]) : [],
          count: exercicesData?.length || 0,
          sample: exercicesData && exercicesData.length > 0 ? exercicesData[0] : null,
          jourId: premierJour.id
        };
        
        // 4. Tester la création d'un exercice sur le jour 1
        const testResult = await exerciceService.addExercice(premierJour.id, {
          nom: 'Test diagnostic ' + Date.now(),
          type: 'test',
          niveau: 1
        });
        
        results.testCreation = {
          jour: premierJour.numero_jour,
          jourId: premierJour.id,
          success: testResult.success,
          error: (testResult as any).error,
          data: testResult.data
        };
        
        // 5. Si le jour 1 fonctionne, tester un autre jour
        if (joursData.length > 1) {
          const deuxiemeJour = joursData.find(jour => jour.numero_jour === 2) || joursData[1];
          
          const testResult2 = await exerciceService.addExercice(deuxiemeJour.id, {
            nom: 'Test diagnostic jour 2 ' + Date.now(),
            type: 'test',
            niveau: 1
          });
          
          results.testCreationJour2 = {
            jour: deuxiemeJour.numero_jour,
            jourId: deuxiemeJour.id,
            success: testResult2.success,
            error: (testResult2 as any).error,
            data: testResult2.data
          };
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Erreur lors de l\'inspection des structures:', error);
      return { error };
    }
  },
};

export default programService; 