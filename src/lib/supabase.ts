import { createClient } from '@supabase/supabase-js';

// Récupérer les variables d'environnement sans manipulation complexe
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.toString().replace(/%$/, '') || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.toString() || '';

// Vérifier et corriger l'URL si nécessaire
const cleanedSupabaseUrl = supabaseUrl.endsWith('%') 
  ? supabaseUrl.slice(0, -1) 
  : supabaseUrl;

// Créer le client Supabase
export const supabase = createClient(cleanedSupabaseUrl, supabaseAnonKey);

// Fonction utilitaire pour vérifier la connexion
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('programmes').select('count').limit(1);
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erreur de connexion à Supabase:', error);
    return { success: false, error };
  }
};

// Fonction pour vérifier la structure de la table programmes
export const checkProgrammesTable = async () => {
  try {
    // Vérifier si on peut accéder à la table programmes
    const { data, error } = await supabase
      .from('programmes')
      .select('id, nom')
      .limit(1);
    
    if (error) {
      console.error('Erreur lors de la vérification de la table programmes:', error);
      return false;
    }
    
    console.log('Structure de la table programmes semble correcte');
    console.log('Premier programme trouvé:', data?.[0]?.nom || 'Aucun programme trouvé');
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification de la structure de la table:', error);
    return false;
  }
};

// Fonction pour lister les tables disponibles dans Supabase
export const listTables = async () => {
  try {
    const { data, error } = await supabase.rpc('get_tables');
    
    if (error) {
      console.error('Erreur lors de la récupération des tables:', error);
      
      // Plan B: essayer une autre approche
      try {
        const { data: tables, error: err2 } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');
          
        if (err2) {
          console.error('Échec de la récupération des tables (plan B):', err2);
          return [];
        }
        
        return tables || [];
      } catch (e) {
        console.error('Erreur dans le plan B:', e);
        return [];
      }
    }
    
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des tables:', error);
    return [];
  }
};

// Fonction pour vérifier la structure de la table exercices
export const checkExercicesTable = async () => {
  try {
    console.log('Vérification de la structure de la table exercices...');
    
    // Essayer d'abord d'obtenir des données pour voir la structure
    const { data, error } = await supabase
      .from('exercices')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Erreur lors de la vérification de la table exercices:', error);
      return { success: false, error, columns: [] };
    }
    
    // Si on a des données, on peut extraire les noms de colonnes
    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
    console.log('Colonnes trouvées dans la table exercices:', columns);
    
    // Tenter d'obtenir la description des colonnes via PostgreSQL
    try {
      const { data: colsData, error: colsError } = await supabase.rpc(
        'get_table_columns',
        { table_name: 'exercices' }
      );
      
      if (colsError) {
        console.warn('Impossible d\'obtenir les détails des colonnes via RPC:', colsError);
      } else if (colsData) {
        console.log('Détails des colonnes de la table exercices:', colsData);
      }
    } catch (e) {
      console.warn('Erreur lors de l\'appel RPC pour obtenir les colonnes:', e);
    }
    
    return { success: true, columns, example: data?.[0] };
  } catch (error) {
    console.error('Erreur lors de la vérification de la structure de la table exercices:', error);
    return { success: false, error, columns: [] };
  }
};

// Vérifier la connexion au démarrage (sans bloquer)
setTimeout(async () => {
  const result = await checkSupabaseConnection();
  if (result.success) {
    console.log('✅ Connexion à Supabase établie');
    console.log('URL Supabase utilisée:', cleanedSupabaseUrl);
    
    // Vérifier également la structure de la table
    await checkProgrammesTable();
    
    // Lister les tables disponibles
    console.log('Récupération de la liste des tables disponibles...');
    const tables = await listTables();
    console.log('Tables disponibles:', tables);
    
    // Vérifier spécifiquement si la table banque_exercices existe
    const hasBanqueExercices = tables.some((t: any) => 
      t.table_name === 'banque_exercices' || t.tablename === 'banque_exercices'
    );
    
    if (hasBanqueExercices) {
      console.log('✅ Table banque_exercices trouvée');
    } else {
      console.warn('⚠️ Table banque_exercices non trouvée');
      console.log('Recherche de tables similaires...');
      
      const exerciseTables = tables.filter((t: any) => {
        const tableName = t.table_name || t.tablename || '';
        return tableName.includes('exercice') || tableName.includes('exercise');
      });
      
      if (exerciseTables.length > 0) {
        console.log('Tables d\'exercices trouvées:', exerciseTables);
      } else {
        console.error('❌ Aucune table d\'exercices trouvée');
      }
    }
    
    // Vérifier la structure de la table exercices
    console.log('Vérification de la structure de la table exercices...');
    const exercicesTableInfo = await checkExercicesTable();
    if (exercicesTableInfo.success) {
      console.log('Structure de la table exercices récupérée avec succès');
    } else {
      console.error('Échec de la récupération de la structure de la table exercices');
    }
    
  } else {
    console.error('❌ Erreur de connexion à Supabase');
  }
}, 1000);