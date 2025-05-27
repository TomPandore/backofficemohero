import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { blogService, BlogPost } from '../../services/blogService';
import Button from '../../components/UI/Button';
import PageContainer from '../../components/Layout/PageContainer';

const EditBlogPost: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    titre: '',
    contenu: '',
    image: '',
    categorie: ''
  });

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      setIsLoading(true);
      if (id) {
        const post = await blogService.getById(parseInt(id));
        if (post) {
          setFormData({
            titre: post.titre,
            contenu: post.contenu,
            image: post.image || '',
            categorie: post.categorie || ''
          });
        }
      }
    } catch (err) {
      setError('Erreur lors du chargement de l\'article');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      if (id) {
        await blogService.update(parseInt(id), formData);
      } else {
        await blogService.create(formData);
      }
      navigate('/blog');
    } catch (err) {
      setError('Erreur lors de l\'enregistrement de l\'article');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer title={id ? "Modifier l'article" : "Nouvel article"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Titre de l'article"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenu
            </label>
            <Editor
              apiKey="votre_clé_api_tinymce"
              value={formData.contenu}
              onEditorChange={(content: string) => setFormData({ ...formData, contenu: content })}
              init={{
                height: 500,
                menubar: true,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                ],
                toolbar: 'undo redo | blocks | ' +
                  'bold italic forecolor | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent | ' +
                  'removeformat | help',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de l'image
            </label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="URL de l'image"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <input
              type="text"
              value={formData.categorie}
              onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Catégorie de l'article"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/blog')}
            type="button"
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Enregistrement...' : id ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};

export default EditBlogPost; 