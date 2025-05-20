import { supabase } from '../lib/supabase';

export interface AppStats {
  totalUsers: number;
  activeUsers: number;
  recentActiveUsers: number;
  totalPrograms: number;
  activePrograms: number;
  totalExercises: number;
  totalClans: number;
  completedDays: number;
  averageCompletionRate: number;
  // KPI de parcours utilisateur
  dailyRegistrations: number;
  averageActiveDaysPerUser: {
    d7: number;
    d30: number;
    d90: number;
  };
  dailyProgramDropouts: number;
  averageProgramDropoutDay: number;
  programCompletionRate: number;
  // Nouvelle métrique: abandons par programme
  programDropoutRates: {
    program_id: string;
    program_name: string;
    dropout_rate: number;
    average_dropout_day: number;
    total_users: number;
  }[];
  programsByType: {
    type: string;
    count: number;
  }[];
  mostPopularPrograms: {
    id: string;
    name: string;
    users: number;
  }[];
  usersByDifficulty: {
    difficulty: string;
    count: number;
  }[];
  usersByClan: {
    clan_id: string;
    clan_name: string;
    count: number;
    image_url?: string;
  }[];
}

// Mappage des IDs de clan vers des noms de clan
const clanNameMap: Record<string, string> = {
  '29214484-ec80-450b-8ef5-2137fddbe18a': 'Onotka',
  '203a6951-edca-4663-a9a5-407554a0032f': 'Ekloa',
  '2976ae91-538d-49a1-9d9d-2106b8d7360d': 'Okwáho',
  // Autres mappages si nécessaire
};

// Mappage des IDs de clan vers des images
const clanImageMap: Record<string, string> = {
  '29214484-ec80-450b-8ef5-2137fddbe18a': 'https://ui-avatars.com/api/?name=Onotka&background=4B7BF5&color=FFFFFF&size=200&bold=true', // Onotka
  '203a6951-edca-4663-a9a5-407554a0032f': 'https://ui-avatars.com/api/?name=Ekloa&background=2BB673&color=FFFFFF&size=200&bold=true', // Ekloa
  '2976ae91-538d-49a1-9d9d-2106b8d7360d': 'https://ui-avatars.com/api/?name=Okwaho&background=F59E0B&color=FFFFFF&size=200&bold=true' // Okwáho
};

// Données de démonstration pour tester l'interface
const demoStats: AppStats = {
  totalUsers: 248,
  activeUsers: 142,
  recentActiveUsers: 86,
  totalPrograms: 12,
  activePrograms: 8,
  totalExercises: 85,
  totalClans: 4,
  completedDays: 1875,
  averageCompletionRate: 0.72,
  // KPI de parcours utilisateur - données démo
  dailyRegistrations: 12,
  averageActiveDaysPerUser: {
    d7: 2.4,
    d30: 8.2,
    d90: 23.5
  },
  dailyProgramDropouts: 4,
  averageProgramDropoutDay: 6,
  programCompletionRate: 0.35,
  // Données démo pour abandons par programme
  programDropoutRates: [
    { program_id: '1', program_name: 'Programme de base', dropout_rate: 0.25, average_dropout_day: 5, total_users: 68 },
    { program_id: '2', program_name: 'Force et endurance', dropout_rate: 0.38, average_dropout_day: 8, total_users: 42 },
    { program_id: '3', program_name: 'Mobilité avancée', dropout_rate: 0.42, average_dropout_day: 4, total_users: 36 }
  ],
  programsByType: [
    { type: 'Découverte', count: 5 },
    { type: 'premium', count: 4 },
    { type: 'premium_clan', count: 3 },
  ],
  mostPopularPrograms: [
    { id: '1', name: 'Programme de base', users: 68 },
    { id: '2', name: 'Force et endurance', users: 42 },
    { id: '3', name: 'Mobilité avancée', users: 36 },
    { id: '4', name: 'Perte de poids', users: 29 },
    { id: '5', name: 'Récupération', users: 21 },
  ],
  usersByDifficulty: [
    { difficulty: 'easy', count: 98 },
    { difficulty: 'medium', count: 112 },
    { difficulty: 'hard', count: 38 },
  ],
  usersByClan: [
    { clan_id: '29214484-ec80-450b-8ef5-2137fddbe18a', clan_name: 'Onotka', count: 65, image_url: 'https://ui-avatars.com/api/?name=Onotka&background=4B7BF5&color=FFFFFF&size=200&bold=true' },
    { clan_id: '203a6951-edca-4663-a9a5-407554a0032f', clan_name: 'Ekloa', count: 52, image_url: 'https://ui-avatars.com/api/?name=Ekloa&background=2BB673&color=FFFFFF&size=200&bold=true' },
    { clan_id: '2976ae91-538d-49a1-9d9d-2106b8d7360d', clan_name: 'Okwáho', count: 43, image_url: 'https://ui-avatars.com/api/?name=Okwaho&background=F59E0B&color=FFFFFF&size=200&bold=true' }
  ]
};

export const statsService = {
  // Récupérer toutes les statistiques de l'application
  getAppStats: async (): Promise<AppStats> => {
    try {
      // Vérifier si la connexion à Supabase fonctionne
      let useRealData = false;
      try {
        const { data: testData, error: testError } = await supabase
          .from('programmes')
          .select('count');
          
        useRealData = !testError && testData && testData.length > 0;
      } catch {
        useRealData = false;
      }
      
      // Si la connexion ne fonctionne pas ou si nous sommes en mode développement, 
      // utiliser les données de démonstration
      if (!useRealData) {
        console.log('Utilisation des données de démonstration pour les statistiques');
        return demoStats;
      }
      
      // Statistiques sur les utilisateurs depuis la table profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('count');
      
      if (profilesError) {
        console.error('Erreur lors de la récupération des profils utilisateurs:', profilesError);
        console.log('Utilisation des données de démonstration pour les utilisateurs');
      }
      
      // Récupérer tous les profils avec leurs données de progression
      const { data: allProfilesData, error: allProfilesError } = await supabase
        .from('profiles')
        .select('id, total_days_completed, consecutive_days, last_completed_day, jour_actuel, progress, programme_id, created_at');
      
      if (allProfilesError) {
        console.error('Erreur lors de la récupération des données de profil:', allProfilesError);
      }
      
      // Récupérer les informations sur tous les programmes
      const { data: allProgramsData, error: allProgramsError } = await supabase
        .from('programmes')
        .select('id, nom, nb_jours, type');
        
      if (allProgramsError) {
        console.error('Erreur lors de la récupération des données de programmes:', allProgramsError);
      }
      
      // Analyser la progression des rituels quotidiens pour déterminer l'activité
      // Compter les utilisateurs actifs (ceux qui ont progressé dans leurs rituels récemment)
      let activeUsers = demoStats.activeUsers;
      let recentActiveUsers = demoStats.recentActiveUsers;
      let averageActiveDaysPerUser = { ...demoStats.averageActiveDaysPerUser };
      
      if (allProfilesData && allProfilesData.length > 0) {
        // Date actuelle et limites pour les différentes périodes
        const currentDate = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(currentDate.getDate() - 30);
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(currentDate.getDate() - 7);
        
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(currentDate.getDate() - 90);
        
        // Compter les utilisateurs qui ont été actifs (au moins un jour complété)
        const activeProfilesCount = allProfilesData.filter(profile => 
          (profile.total_days_completed && profile.total_days_completed > 0)
        ).length;
        
        if (activeProfilesCount > 0) {
          activeUsers = activeProfilesCount;
        }
        
        // Compter les utilisateurs qui ont été actifs ces 30 derniers jours
        // On utilise last_completed_day quand disponible
        const recentActiveProfilesCount = allProfilesData.filter(profile => {
          if (profile.last_completed_day) {
            const lastCompletedDate = new Date(profile.last_completed_day);
            return lastCompletedDate >= thirtyDaysAgo;
          }
          return false;
        }).length;
        
        if (recentActiveProfilesCount > 0) {
          recentActiveUsers = recentActiveProfilesCount;
        }
        
        // Calculer la moyenne des jours actifs par utilisateur pour D7, D30, D90
        // Pour D7, utiliser les streaks (consecutive_days)
        const activeStreaks = allProfilesData
          .filter(profile => profile.consecutive_days && profile.consecutive_days > 0)
          .map(profile => Math.min(7, profile.consecutive_days));
        
        if (activeStreaks.length > 0) {
          const avgStreak = activeStreaks.reduce((sum, streak) => sum + streak, 0) / activeStreaks.length;
          averageActiveDaysPerUser.d7 = Math.round(avgStreak * 10) / 10;
        }
        
        // Pour D30 et D90, estimer à partir des rituels complétés récemment
        // Calculer les jours actifs dans une période en fonction de last_completed_day et la progression
        const calculateActiveDaysInPeriod = (profile: any, startDate: Date, days: number) => {
          // Si pas de date de dernière activité ou pas de progression, retourner 0
          if (!profile.last_completed_day) return 0;
          
          const lastCompleted = new Date(profile.last_completed_day);
          // Si la dernière activité est antérieure à la période, retourner 0
          if (lastCompleted < startDate) return 0;
          
          // Utiliser le total_days_completed, mais le plafonner au nombre de jours de la période
          return Math.min(days, profile.total_days_completed || 0);
        };
        
        // Calculer les jours actifs pour D30
        const activeDaysD30 = allProfilesData
          .map(profile => calculateActiveDaysInPeriod(profile, thirtyDaysAgo, 30))
          .filter(days => days > 0);
        
        if (activeDaysD30.length > 0) {
          const avgDaysD30 = activeDaysD30.reduce((sum, days) => sum + days, 0) / activeDaysD30.length;
          averageActiveDaysPerUser.d30 = Math.round(avgDaysD30 * 10) / 10;
        }
        
        // Calculer les jours actifs pour D90
        const activeDaysD90 = allProfilesData
          .map(profile => calculateActiveDaysInPeriod(profile, ninetyDaysAgo, 90))
          .filter(days => days > 0);
        
        if (activeDaysD90.length > 0) {
          const avgDaysD90 = activeDaysD90.reduce((sum, days) => sum + days, 0) / activeDaysD90.length;
          averageActiveDaysPerUser.d90 = Math.round(avgDaysD90 * 10) / 10;
        }
      }
      
      // KPI : Nombre d'inscrits par jour
      let dailyRegistrations = demoStats.dailyRegistrations;
      try {
        if (allProfilesData && allProfilesData.length > 0) {
          // Compter les inscriptions des 7 derniers jours
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const recentSignups = allProfilesData.filter(profile => {
            if (profile.created_at) {
              const createdDate = new Date(profile.created_at);
              return createdDate >= sevenDaysAgo;
            }
            return false;
          });
          
          if (recentSignups.length > 0) {
            dailyRegistrations = Math.round(recentSignups.length / 7);
          }
        } else {
          // Fallback à la requête précédente si allProfilesData n'est pas disponible
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const sevenDaysAgoStr = sevenDaysAgo.toISOString();
          
          const { data: recentRegistrations, error: registrationsError } = await supabase
            .from('profiles')
            .select('created_at')
            .gte('created_at', sevenDaysAgoStr);
            
          if (registrationsError) {
            console.error('Erreur lors de la récupération des inscriptions récentes:', registrationsError);
          } else if (recentRegistrations && recentRegistrations.length > 0) {
            dailyRegistrations = Math.round(recentRegistrations.length / 7);
          }
        }
      } catch (error) {
        console.error('Erreur lors du calcul des inscriptions quotidiennes:', error);
      }
      
      // KPI : Abandons quotidiens de programme et jour moyen d'abandon
      let dailyProgramDropouts = demoStats.dailyProgramDropouts;
      let averageProgramDropoutDay = demoStats.averageProgramDropoutDay;
      let programDropoutRates: typeof demoStats.programDropoutRates = [];
      
      try {
        if (allProfilesData && allProfilesData.length > 0 && allProgramsData && allProgramsData.length > 0) {
          // Définir un abandon comme un utilisateur qui a un programme mais n'a pas été actif depuis 14+ jours
          const fourteenDaysAgo = new Date();
          fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
          
          // Créer un dictionnaire des programmes par ID
          const programsById: Record<string, {id: string, nom: string, nb_jours?: number, type?: string}> = {};
          allProgramsData.forEach(program => {
            if (program.id) {
              programsById[program.id] = program;
            }
          });
          
          // Statistiques globales d'abandon
          const abandonedProfiles = allProfilesData.filter(profile => {
            // L'utilisateur doit avoir un programme
            if (!profile.programme_id) return false;
            
            // Vérifier la date de dernière activité
            if (profile.last_completed_day) {
              const lastCompletedDate = new Date(profile.last_completed_day);
              return lastCompletedDate < fourteenDaysAgo;
            }
            
            // Si pas de date de dernière activité mais créé il y a plus de 14 jours, considérer comme abandonné
            if (profile.created_at) {
              const createdDate = new Date(profile.created_at);
              return createdDate < fourteenDaysAgo && (!profile.total_days_completed || profile.total_days_completed === 0);
            }
            
            return false;
          });
          
          if (abandonedProfiles.length > 0) {
            // Estimer les abandons quotidiens (sur 90 jours)
            dailyProgramDropouts = Math.round((abandonedProfiles.length / 90) * 10) / 10;
            
            // Calculer le jour moyen d'abandon
            const totalDaysCompleted = abandonedProfiles.reduce((sum, profile) => 
              sum + (profile.jour_actuel || 1), 0);
              
            averageProgramDropoutDay = Math.round(totalDaysCompleted / abandonedProfiles.length);
          }
          
          // Statistiques d'abandon par programme
          // Grouper les profils par programme_id
          const profilesByProgram: Record<string, any[]> = {};
          
          allProfilesData.forEach(profile => {
            if (profile.programme_id) {
              if (!profilesByProgram[profile.programme_id]) {
                profilesByProgram[profile.programme_id] = [];
              }
              profilesByProgram[profile.programme_id].push(profile);
            }
          });
          
          // Calculer le taux d'abandon pour chaque programme
          programDropoutRates = Object.entries(profilesByProgram)
            .filter(([programId, profiles]) => {
              // Ignorer les programmes avec moins de 5 utilisateurs (pas assez de données)
              return profiles.length >= 5 && programsById[programId];
            })
            .map(([programId, profiles]) => {
              const program = programsById[programId];
              
              // Trouver les profils abandonnés pour ce programme
              const abandonedForProgram = profiles.filter(profile => {
                if (profile.last_completed_day) {
                  const lastCompletedDate = new Date(profile.last_completed_day);
                  return lastCompletedDate < fourteenDaysAgo;
                }
                
                if (profile.created_at) {
                  const createdDate = new Date(profile.created_at);
                  return createdDate < fourteenDaysAgo && (!profile.total_days_completed || profile.total_days_completed === 0);
                }
                
                return false;
              });
              
              // Calculer le taux d'abandon
              const dropoutRate = abandonedForProgram.length / profiles.length;
              
              // Calculer le jour moyen d'abandon
              let avgDropoutDay = 0;
              if (abandonedForProgram.length > 0) {
                const totalDaysCompleted = abandonedForProgram.reduce((sum, profile) => 
                  sum + (profile.jour_actuel || 1), 0);
                avgDropoutDay = Math.round(totalDaysCompleted / abandonedForProgram.length);
              }
              
              return {
                program_id: programId,
                program_name: program.nom || `Programme ${programId}`,
                dropout_rate: Math.round(dropoutRate * 100) / 100, // Arrondi à 2 décimales
                average_dropout_day: avgDropoutDay,
                total_users: profiles.length
              };
            })
            .sort((a, b) => b.dropout_rate - a.dropout_rate) // Trier par taux d'abandon décroissant
            .slice(0, 5); // Garder les 5 programmes avec le plus haut taux d'abandon
            
          // Si aucun programme n'a assez d'utilisateurs, utiliser les données de démonstration
          if (programDropoutRates.length === 0) {
            programDropoutRates = demoStats.programDropoutRates;
          }
        } else {
          // Fallback à l'ancienne méthode pour les statistiques globales
          const { data: startedProfilesData, error: startedProfilesError } = await supabase
            .from('profiles')
            .select('count')
            .not('programme_id', 'is', null);
            
          const fourteenDaysAgo = new Date();
          fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
          const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split('T')[0];
          
          const { data: inactiveProfilesData, error: inactiveProfilesError } = await supabase
            .from('profiles')
            .select('count, jour_actuel')
            .not('programme_id', 'is', null)
            .lt('last_completed_day', fourteenDaysAgoStr);
            
          if (!startedProfilesError && !inactiveProfilesError && 
              startedProfilesData && startedProfilesData[0] &&
              inactiveProfilesData) {
            const totalStarted = parseInt(String(startedProfilesData[0].count));
            const totalInactive = inactiveProfilesData.length;
            
            if (totalStarted > 0) {
              dailyProgramDropouts = Math.round((totalInactive / 90) * 10) / 10;
              
              if (inactiveProfilesData.length > 0) {
                const totalDays = inactiveProfilesData.reduce((sum, profile) => 
                  sum + (profile.jour_actuel || 1), 0);
                  
                averageProgramDropoutDay = Math.round(totalDays / inactiveProfilesData.length);
              }
            }
          }
          
          // Utiliser les données de démonstration pour les abandons par programme
          programDropoutRates = demoStats.programDropoutRates;
        }
      } catch (error) {
        console.error('Erreur lors du calcul des abandons de programme:', error);
        programDropoutRates = demoStats.programDropoutRates;
      }
      
      // KPI : Taux de complétion des programmes
      let programCompletionRate = demoStats.programCompletionRate;
      try {
        if (allProfilesData && allProfilesData.length > 0) {
          // Récupérer les programmes avec leur nombre de jours
          const { data: programLengthsData, error: programLengthsError } = await supabase
            .from('programmes')
            .select('id, nb_jours');
            
          if (!programLengthsError && programLengthsData && programLengthsData.length > 0) {
            // Créer un dictionnaire des longueurs de programme
            const programLengths: Record<string, number> = {};
            programLengthsData.forEach(program => {
              if (program.id && program.nb_jours) {
                programLengths[program.id] = program.nb_jours;
              }
            });
            
            // Calculer le taux de complétion
            let totalProgramUsers = 0;
            let completedProgramUsers = 0;
            
            allProfilesData.forEach(profile => {
              if (profile.programme_id && programLengths[profile.programme_id]) {
                totalProgramUsers++;
                
                // Vérifier si l'utilisateur a complété le programme
                const programLength = programLengths[profile.programme_id];
                if (profile.jour_actuel && profile.jour_actuel >= programLength) {
                  completedProgramUsers++;
                }
              }
            });
            
            if (totalProgramUsers > 0) {
              programCompletionRate = completedProgramUsers / totalProgramUsers;
            }
          }
        } else {
          // Fallback à l'ancienne méthode
          const { data: programLengthsData, error: programLengthsError } = await supabase
            .from('programmes')
            .select('id, nb_jours');
            
          if (!programLengthsError && programLengthsData && programLengthsData.length > 0) {
            let totalProgramUsers = 0;
            let completedProgramUsers = 0;
            
            for (const program of programLengthsData) {
              if (program.id && program.nb_jours) {
                const { data: programUsersData, error: programUsersError } = await supabase
                  .from('profiles')
                  .select('count')
                  .eq('programme_id', program.id);
                  
                const { data: completedUsersData, error: completedUsersError } = await supabase
                  .from('profiles')
                  .select('count')
                  .eq('programme_id', program.id)
                  .gte('jour_actuel', program.nb_jours);
                  
                if (!programUsersError && !completedUsersError && 
                    programUsersData && programUsersData[0] &&
                    completedUsersData && completedUsersData[0]) {
                  totalProgramUsers += parseInt(String(programUsersData[0].count));
                  completedProgramUsers += parseInt(String(completedUsersData[0].count));
                }
              }
            }
            
            if (totalProgramUsers > 0) {
              programCompletionRate = completedProgramUsers / totalProgramUsers;
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du calcul du taux de complétion des programmes:', error);
      }
      
      // Statistiques sur les programmes
      const { data: programData, error: programError } = await supabase
        .from('programmes')
        .select('count');
      
      if (programError) console.error('Erreur lors de la récupération des programmes:', programError);
      
      // Statistiques sur les exercices
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercises')
        .select('count');
      
      if (exerciseError) console.error('Erreur lors de la récupération des exercices:', exerciseError);
      
      // Statistiques sur les clans
      const { data: clanData, error: clanError } = await supabase
        .from('clans')
        .select('count');
      
      if (clanError) console.error('Erreur lors de la récupération des clans:', clanError);
      
      // Récupérer la liste des clans et leur nom
      let clansWithNames: Array<{id: string, name: string, color?: string, image_url?: string}> = [];
      try {
        const { data: clansData, error: clansError } = await supabase
          .from('clans')
          .select('id, name, color, image_url');
          
        if (clansError) {
          console.error('Erreur lors de la récupération des données de clans:', clansError);
        } else if (clansData) {
          clansWithNames = clansData;
          console.log('Clans récupérés de la base de données:', clansWithNames);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données de clans:', error);
      }
      
      // Si nous n'avons pas réussi à récupérer les clans, définissons les clans connus par leurs IDs
      if (clansWithNames.length === 0) {
        clansWithNames = [
          { id: '29214484-ec80-450b-8ef5-2137fddbe18a', name: 'Onotka', image_url: clanImageMap['29214484-ec80-450b-8ef5-2137fddbe18a'] },
          { id: '203a6951-edca-4663-a9a5-407554a0032f', name: 'Ekloa', image_url: clanImageMap['203a6951-edca-4663-a9a5-407554a0032f'] },
          { id: '2976ae91-538d-49a1-9d9d-2106b8d7360d', name: 'Okwáho', image_url: clanImageMap['2976ae91-538d-49a1-9d9d-2106b8d7360d'] }
        ];
        console.log('Utilisation des clans prédéfinis:', clansWithNames);
      }
      
      // Compter les utilisateurs par clan
      let usersByClan: Array<{clan_id: string, clan_name: string, count: number, image_url?: string}> = [];
      try {
        // Récupérer les utilisateurs directement liés à un clan
        const { data: clanUsersData, error: clanUsersError } = await supabase
          .from('profiles')
          .select('clan_id');
          
        if (clanUsersError) {
          console.error('Erreur lors du comptage des utilisateurs par clan:', clanUsersError);
        } else if (clanUsersData && clanUsersData.length > 0) {
          // Compter manuellement les utilisateurs par clan_id
          const clanCounts: Record<string, number> = {};
          clanUsersData.forEach((item: {clan_id: string | null}) => {
            if (item.clan_id) {
              // Normaliser l'ID du clan pour s'assurer qu'il correspond à l'un des clans connus
              // Vérifier si cet ID correspond à l'un des IDs connus (en ignorant la casse)
              const knownClanId = Object.keys(clanNameMap).find(
                knownId => knownId.toLowerCase() === item.clan_id?.toLowerCase()
              );
              
              // Utiliser l'ID connu s'il existe, sinon utiliser l'ID original
              const clanIdToUse = knownClanId || item.clan_id;
              clanCounts[clanIdToUse] = (clanCounts[clanIdToUse] || 0) + 1;
            }
          });
          
          // Convertir en format attendu
          usersByClan = Object.entries(clanCounts).map(([clan_id, count]) => {
            // Chercher d'abord dans le mappage statique
            if (clanNameMap[clan_id]) {
              return {
                clan_id,
                clan_name: clanNameMap[clan_id],
                count,
                image_url: clanImageMap[clan_id] || 'https://via.placeholder.com/100'
              };
            }
            
            // Vérifier si cet ID est similaire à l'un des IDs connus (en ignorant la casse)
            for (const [knownId, knownName] of Object.entries(clanNameMap)) {
              if (knownId.toLowerCase() === clan_id.toLowerCase() ||
                  clan_id.includes(knownId) || 
                  knownId.includes(clan_id)) {
                return {
                  clan_id: knownId, // Utiliser l'ID connu
                  clan_name: knownName,
                  count,
                  image_url: clanImageMap[knownId] || 'https://via.placeholder.com/100'
                };
              }
            }
            
            // Sinon, chercher dans les données de clans récupérées
            const matchingClan = clansWithNames.find(clan => 
              clan.id === clan_id || 
              clan.id.toLowerCase() === clan_id.toLowerCase() ||
              clan.name.toLowerCase() === clan_id.toLowerCase()
            );
            
            // Si toujours pas trouvé, raccourcir l'ID
            const shortId = clan_id.length > 8 ? clan_id.substring(0, 8) + '...' : clan_id;
            return {
              clan_id,
              clan_name: matchingClan ? matchingClan.name : `Clan ${shortId}`,
              count,
              image_url: matchingClan?.image_url || clanImageMap[clan_id] || 'https://via.placeholder.com/100'
            };
          });
          
          // S'assurer que tous les clans connus sont présents, même ceux avec zéro utilisateur
          const clanIdsInResults = new Set(usersByClan.map(clan => clan.clan_id));
          
          clansWithNames.forEach(clan => {
            if (!clanIdsInResults.has(clan.id)) {
              // Ajouter le clan manquant avec un compte de 0
              usersByClan.push({
                clan_id: clan.id,
                clan_name: clan.name || clanNameMap[clan.id] || `Clan ${clan.id.substring(0, 6)}...`,
                count: 0,
                image_url: clan.image_url || clanImageMap[clan.id] || 'https://via.placeholder.com/100'
              });
            }
          });
          
        } else {
          // Sinon, essayer via les programmes liés aux clans
          const { data: programClansData, error: programClansError } = await supabase
            .from('programmes')
            .select('clan_id')
            .not('clan_id', 'is', null);
            
          if (programClansError) {
            console.error('Erreur lors de la récupération des programmes par clan:', programClansError);
          } else if (programClansData) {
            // Compter les occurrences de chaque clan_id
            const clanCounts: Record<string, number> = {};
            programClansData.forEach(item => {
              if (item.clan_id) {
                clanCounts[item.clan_id] = (clanCounts[item.clan_id] || 0) + 1;
              }
            });
            
            // Convertir en format attendu
            usersByClan = Object.entries(clanCounts).map(([clan_id, count]) => {
              // Chercher d'abord dans le mappage statique
              if (clanNameMap[clan_id]) {
                return {
                  clan_id,
                  clan_name: clanNameMap[clan_id],
                  count,
                  image_url: clanImageMap[clan_id] || 'https://via.placeholder.com/100'
                };
              }
              
              // Vérifier si cet ID est similaire à l'un des IDs connus (en ignorant la casse)
              for (const [knownId, knownName] of Object.entries(clanNameMap)) {
                if (knownId.toLowerCase() === clan_id.toLowerCase() ||
                    clan_id.includes(knownId) || 
                    knownId.includes(clan_id)) {
                  return {
                    clan_id: knownId, // Utiliser l'ID connu
                    clan_name: knownName,
                    count,
                    image_url: clanImageMap[knownId] || 'https://via.placeholder.com/100'
                  };
                }
              }
              
              // Sinon, chercher dans les données de clans récupérées
              const matchingClan = clansWithNames.find(clan => 
                clan.id === clan_id || 
                clan.id.toLowerCase() === clan_id.toLowerCase() ||
                clan.name.toLowerCase() === clan_id.toLowerCase()
              );
              
              // Si toujours pas trouvé, raccourcir l'ID
              const shortId = clan_id.length > 8 ? clan_id.substring(0, 8) + '...' : clan_id;
              return {
                clan_id,
                clan_name: matchingClan ? matchingClan.name : `Clan ${shortId}`,
                count,
                image_url: matchingClan?.image_url || clanImageMap[clan_id] || 'https://via.placeholder.com/100'
              };
            });
          }
        }
        
        // Si toujours pas de données, utiliser les données de démo
        if (usersByClan.length === 0) {
          usersByClan = demoStats.usersByClan;
        }
        
        // Appliquer le mappage des noms de clan
        usersByClan = usersByClan.map(clan => {
          // Vérifier si nous avons un nom personnalisé dans notre mappage
          if (clanNameMap[clan.clan_id]) {
            return {
              ...clan,
              clan_name: clanNameMap[clan.clan_id]
            };
          }
          
          // Si le clan_name ressemble à un UUID, le raccourcir
          if (clan.clan_name.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            return {
              ...clan,
              clan_name: `Clan ${clan.clan_id.substring(0, 6)}...`
            };
          }
          
          return clan;
        });
        
        // S'assurer que tous les clans connus sont présents, même ceux avec zéro utilisateur
        const clanIdsInResults = new Set(usersByClan.map(clan => clan.clan_id));
        
        clansWithNames.forEach(clan => {
          if (!clanIdsInResults.has(clan.id)) {
            // Ajouter le clan manquant avec un compte de 0
            usersByClan.push({
              clan_id: clan.id,
              clan_name: clan.name || clanNameMap[clan.id] || `Clan ${clan.id.substring(0, 6)}...`,
              count: 0,
              image_url: clan.image_url || clanImageMap[clan.id] || 'https://via.placeholder.com/100'
            });
          }
        });
        
      } catch (error) {
        console.error('Erreur lors du comptage des utilisateurs par clan:', error);
        usersByClan = demoStats.usersByClan;
      }
      
      // Statistiques sur les jours d'exercices complétés
      // Utilisation du champ total_days_completed de la table profiles
      let totalCompletedDays = demoStats.completedDays;
      try {
        const { data: completedDaysData, error: completedDaysError } = await supabase
          .from('profiles')
          .select('total_days_completed');
      
        if (!completedDaysError && completedDaysData) {
          totalCompletedDays = completedDaysData.reduce((sum, profile) => 
            sum + (profile.total_days_completed || 0), 0);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des jours complétés:', error);
      }
      
      // Statistiques sur les programmes par type
      let programsByTypeData;
      try {
        const { data, error } = await supabase
          .from('programmes')
          .select('type');
        
        if (error) throw error;
        
        // Compter manuellement les types de programmes
        programsByTypeData = data.reduce((acc: {type: string, count: number}[], program: {type: string}) => {
          const existingType = acc.find(item => item.type === program.type);
          if (existingType) {
            existingType.count++;
          } else {
            acc.push({ type: program.type, count: 1 });
          }
          return acc;
        }, []);
      } catch (error) {
        console.error('Erreur lors de la récupération des types de programmes:', error);
        programsByTypeData = demoStats.programsByType;
      }
      
      // Statistiques sur les programmes les plus populaires
      let popularProgramsData;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('programme_id, programmes:programme_id(id, nom)')
          .not('programme_id', 'is', null);
        
        if (error) throw error;
        popularProgramsData = data;
      } catch (error) {
        console.error('Erreur lors de la récupération des programmes populaires:', error);
        popularProgramsData = demoStats.mostPopularPrograms.map(p => ({
          programme_id: p.id,
          programmes: { id: p.id, nom: p.name }
        }));
      }
      
      // Statistiques sur les utilisateurs par niveau de difficulté
      let difficultyData;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('programmes:programme_id(niveau_difficulte)')
          .not('programme_id', 'is', null);
        
        if (error) throw error;
        difficultyData = data;
      } catch (error) {
        console.error('Erreur lors de la récupération des niveaux de difficulté:', error);
        difficultyData = demoStats.usersByDifficulty.map(d => ({
          programmes: { niveau_difficulte: d.difficulty }
        }));
      }
      
      // Traitement et organisation des données
      const programsByType = programsByTypeData && Array.isArray(programsByTypeData)
        ? programsByTypeData
        : demoStats.programsByType;
      
      // Programmes les plus populaires
      let mostPopularPrograms: { id: string; name: string; users: number }[] = [];
      if (popularProgramsData && Array.isArray(popularProgramsData)) {
        // Compter les occurrences de chaque programme_id
        const programCounts: Record<string, { id: string; name: string; count: number }> = {};
        popularProgramsData.forEach(item => {
          if (item.programme_id && item.programmes) {
            const programId = item.programme_id;
            const programName = typeof item.programmes === 'object' ? 
                               (item.programmes as any).nom || 'Programme sans nom' : 
                               'Programme sans nom';
            
            if (!programCounts[programId]) {
              programCounts[programId] = {
                id: programId,
                name: programName,
                count: 0
              };
            }
            programCounts[programId].count++;
          }
        });
        
        // Convertir en tableau et trier
        mostPopularPrograms = Object.values(programCounts)
          .map(item => ({ id: item.id, name: item.name, users: item.count }))
          .sort((a, b) => b.users - a.users)
          .slice(0, 5); // Top 5
      } else {
        mostPopularPrograms = demoStats.mostPopularPrograms;
      }
      
      // Utilisateurs par niveau de difficulté
      let usersByDifficulty: { difficulty: string; count: number }[] = [];
      if (difficultyData && Array.isArray(difficultyData)) {
        const difficultyCounts: Record<string, number> = {};
        difficultyData.forEach(item => {
          if (item.programmes) {
            const difficulty = typeof item.programmes === 'object' ? 
                              (item.programmes as any).niveau_difficulte || 'medium' : 
                              'medium';
            
            difficultyCounts[difficulty] = (difficultyCounts[difficulty] || 0) + 1;
          }
        });
        
        usersByDifficulty = Object.entries(difficultyCounts)
          .map(([difficulty, count]) => ({ difficulty, count }));
      } else {
        usersByDifficulty = demoStats.usersByDifficulty;
      }
      
      // Nombre total d'utilisateurs (depuis profiles)
      const totalUsers = profilesData && profilesData[0] ? 
                        (typeof profilesData[0].count === 'number' ? profilesData[0].count : parseInt(String(profilesData[0].count))) : 
                        demoStats.totalUsers;
      
      // Nombre approximatif de programmes actifs (70% des programmes pour la démo)
      const totalPrograms = programData && programData[0] ? 
                          (typeof programData[0].count === 'number' ? programData[0].count : parseInt(String(programData[0].count))) : 
                          demoStats.totalPrograms;
      const activePrograms = Math.floor(totalPrograms * 0.7);
      
      // Taux moyen d'achèvement (basé sur le nombre moyen de jours complétés par utilisateur)
      const averageCompletionRate = totalUsers > 0 
        ? Math.min(0.85, totalCompletedDays / (totalUsers * 30)) 
        : demoStats.averageCompletionRate;
      
      // Total des exercices
      const totalExercises = exerciseData && exerciseData[0] 
        ? (typeof exerciseData[0].count === 'number' ? exerciseData[0].count : parseInt(String(exerciseData[0].count)))
        : demoStats.totalExercises;
      
      // Total des clans
      const totalClans = clanData && clanData[0] 
        ? (typeof clanData[0].count === 'number' ? clanData[0].count : parseInt(String(clanData[0].count)))
        : demoStats.totalClans;
      
      return {
        totalUsers,
        activeUsers,
        recentActiveUsers,
        totalPrograms,
        activePrograms,
        totalExercises,
        totalClans,
        completedDays: totalCompletedDays,
        averageCompletionRate,
        // KPI de parcours utilisateur
        dailyRegistrations,
        averageActiveDaysPerUser,
        dailyProgramDropouts,
        averageProgramDropoutDay,
        programCompletionRate,
        programDropoutRates,
        programsByType,
        mostPopularPrograms,
        usersByDifficulty,
        usersByClan
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      // Renvoyer des données de démonstration en cas d'erreur
      return demoStats;
    }
  }
};

export default statsService; 