import { supabase } from '../lib/supabase';

// Mappage des IDs de clan connus
const CLAN_IDS = {
  ONOTKA: '29214484-ec80-450b-8ef5-2137fddbe18a',
  EKLOA: '203a6951-edca-4663-a9a5-407554a0032f',
  OKWAHO: '2976ae91-538d-49a1-9d9d-2106b8d7360d'
};

// Mappage des noms de clan vers leurs IDs
const CLAN_NAMES_TO_IDS: Record<string, string> = {
  'Onotka': CLAN_IDS.ONOTKA,
  'Ekloa': CLAN_IDS.EKLOA,
  'Okwáho': CLAN_IDS.OKWAHO
};

// Normaliser l'ID d'un clan
const normalizeClanId = (clanId: string | null): string | null => {
  if (!clanId) return null;
  
  // Vérifier si l'ID est déjà l'un des IDs connus
  const knownClanId = Object.values(CLAN_IDS).find(
    id => id.toLowerCase() === clanId.toLowerCase()
  );
  
  if (knownClanId) return knownClanId;
  
  // Vérifier si l'ID est similaire à l'un des IDs connus
  for (const knownId of Object.values(CLAN_IDS)) {
    if (clanId.includes(knownId) || knownId.includes(clanId)) {
      return knownId;
    }
  }
  
  // Vérifier si le clanId est en fait un nom de clan
  const clanNameMatch = Object.keys(CLAN_NAMES_TO_IDS).find(
    name => name.toLowerCase() === clanId.toLowerCase()
  );
  
  if (clanNameMatch) {
    return CLAN_NAMES_TO_IDS[clanNameMatch];
  }
  
  // Sinon, retourner l'ID tel quel
  return clanId;
};

export const userService = {
  // Mettre à jour le clan d'un utilisateur
  updateUserClan: async (userId: string, clanId: string): Promise<boolean> => {
    try {
      // Normaliser l'ID du clan
      const normalizedClanId = normalizeClanId(clanId);
      
      console.log(`Mise à jour du clan pour l'utilisateur ${userId}:`);
      console.log(`- ID de clan reçu: ${clanId}`);
      console.log(`- ID de clan normalisé: ${normalizedClanId}`);
      
      const { error } = await supabase
        .from('profiles')
        .update({ clan_id: normalizedClanId })
        .eq('id', userId);
      
      if (error) {
        console.error(`Erreur lors de la mise à jour du clan de l'utilisateur ${userId}:`, error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du clan:', error);
      return false;
    }
  },
  
  // Normaliser les clans de tous les utilisateurs
  normalizeAllUserClans: async (): Promise<{ success: boolean, updatedCount: number }> => {
    try {
      // Récupérer tous les profils avec clan_id non null
      const { data, error } = await supabase
        .from('profiles')
        .select('id, clan_id')
        .not('clan_id', 'is', null);
      
      if (error) {
        console.error('Erreur lors de la récupération des profils:', error);
        return { success: false, updatedCount: 0 };
      }
      
      if (!data || data.length === 0) {
        console.log('Aucun profil avec clan_id trouvé');
        return { success: true, updatedCount: 0 };
      }
      
      let updatedCount = 0;
      
      // Traiter chaque profil
      for (const profile of data) {
        const normalizedClanId = normalizeClanId(profile.clan_id);
        
        // Si l'ID a changé, mettre à jour le profil
        if (normalizedClanId !== profile.clan_id) {
          console.log(`Normalisation du clan pour l'utilisateur ${profile.id}:`);
          console.log(`- Ancien ID: ${profile.clan_id}`);
          console.log(`- Nouvel ID: ${normalizedClanId}`);
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ clan_id: normalizedClanId })
            .eq('id', profile.id);
          
          if (updateError) {
            console.error(`Erreur lors de la mise à jour du clan de l'utilisateur ${profile.id}:`, updateError);
          } else {
            updatedCount++;
          }
        }
      }
      
      console.log(`${updatedCount} profils mis à jour avec des IDs de clan normalisés`);
      return { success: true, updatedCount };
    } catch (error) {
      console.error('Erreur lors de la normalisation des clans:', error);
      return { success: false, updatedCount: 0 };
    }
  },
  
  // Récupérer tous les utilisateurs par clan
  getUsersByClan: async (): Promise<Record<string, { count: number, users: Array<{ id: string, email?: string }> }>> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, clan_id')
        .not('clan_id', 'is', null);
      
      if (error) {
        console.error('Erreur lors de la récupération des utilisateurs par clan:', error);
        return {};
      }
      
      if (!data || data.length === 0) {
        return {};
      }
      
      // Regrouper les utilisateurs par clan normalisé
      const clanMap: Record<string, { count: number, users: Array<{ id: string, email?: string }> }> = {};
      
      // Initialiser avec les clans connus
      Object.values(CLAN_IDS).forEach(clanId => {
        clanMap[clanId] = { count: 0, users: [] };
      });
      
      // Ajouter les utilisateurs aux clans
      data.forEach(profile => {
        const normalizedClanId = normalizeClanId(profile.clan_id) || profile.clan_id;
        
        if (!clanMap[normalizedClanId]) {
          clanMap[normalizedClanId] = { count: 0, users: [] };
        }
        
        clanMap[normalizedClanId].users.push({
          id: profile.id,
          email: profile.email
        });
        
        clanMap[normalizedClanId].count++;
      });
      
      return clanMap;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs par clan:', error);
      return {};
    }
  }
}; 