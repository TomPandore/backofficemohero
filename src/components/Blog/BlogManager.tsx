import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { blogService, BlogPost } from '../../services/blogService';
import Button from '../UI/Button';

const BlogManager: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Chargement initial des articles
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      console.log('Début du chargement des articles...');
      setIsLoading(true);
      const data = await blogService.getAll();
      console.log('Articles chargés dans le composant:', data);
      setPosts(data);
    } catch (err) {
      console.error('Erreur détaillée lors du chargement des articles:', err);
      setError('Erreur lors du chargement des articles');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les articles en fonction de la recherche
  const filteredPosts = posts.filter(post =>
    post.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.categorie?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Gérer la suppression d'un article
  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return;
    }

    try {
      setIsLoading(true);
      await blogService.delete(id);
      await loadPosts();
      setSuccess('Article supprimé avec succès');
    } catch (err) {
      setError('Erreur lors de la suppression de l\'article');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un article..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/blog/new')}
          className="flex items-center"
        >
          <Plus className="h-5 w-5 mr-1" />
          Nouvel article
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Titre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Catégorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date de création
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPosts.map((post) => (
              <tr key={post.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{post.titre}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {post.categorie || 'Non catégorisé'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(post.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => navigate(`/blog/edit/${post.id}`)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BlogManager; 