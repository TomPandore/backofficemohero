import { supabase } from '../lib/supabase';

export interface BlogPost {
  id: number;
  created_at: string;
  titre: string;
  image: string | null;
  contenu: string;
  categorie: string | null;
}

export const blogService = {
  // Récupérer tous les articles
  async getAll(): Promise<BlogPost[]> {
    console.log('Tentative de récupération des articles...');
    const { data, error } = await supabase
      .from('blog')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des articles:', error);
      throw error;
    }

    console.log('Articles récupérés:', data);
    return data || [];
  },

  // Récupérer un article par son ID
  async getById(id: number): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération de l\'article:', error);
      throw error;
    }

    return data;
  },

  // Créer un nouvel article
  async create(post: Omit<BlogPost, 'id' | 'created_at'>): Promise<BlogPost> {
    const { data, error } = await supabase
      .from('blog')
      .insert([post])
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de l\'article:', error);
      throw error;
    }

    return data;
  },

  // Mettre à jour un article
  async update(id: number, post: Partial<BlogPost>): Promise<BlogPost> {
    const { data, error } = await supabase
      .from('blog')
      .update(post)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'article:', error);
      throw error;
    }

    return data;
  },

  // Supprimer un article
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('blog')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression de l\'article:', error);
      throw error;
    }
  }
}; 