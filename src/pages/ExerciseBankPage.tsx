import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Filter, X, ChevronDown, ChevronUp, Save, Check, Sliders, ArrowUpRight } from 'lucide-react';
import PageContainer from '../components/Layout/PageContainer';
import Button from '../components/UI/Button';
import { bankExercisesService, BankExercise, exerciseTypes } from '../services/bankExercisesService';
import { supabase } from '../lib/supabase';

const ExerciseBankPage: React.FC = () => {
  const navigate = useNavigate();
  
  // États pour la gestion des exercices
  const [exercises, setExercises] = useState<BankExercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<BankExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // États pour les statistiques
  const [stats, setStats] = useState({
    total: 0,
    byType: {} as Record<string, number>
  });
  
  // États pour la recherche et le filtrage
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  
  // États pour le formulaire d'ajout/modification
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<BankExercise | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    type: 'push',
    categorie: '',
    description: '',
    image_url: '',
    video_url: '',
    variante: ''
  });
  
  // Chargement initial des données
  useEffect(() => {
    loadExercises();
  }, []);
  
  // Filtrage des exercices
  useEffect(() => {
    filterExercises();
  }, [exercises, selectedFilter, searchQuery]);
  
  // Charger tous les exercices
  const loadExercises = async () => {
    setIsLoading(true);
    try {
      const data = await bankExercisesService.getAll();
      setExercises(data);
      
      // Calculer les statistiques
      const typeCounts = data.reduce((acc, exercise) => {
        acc[exercise.type] = (acc[exercise.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      setStats({
        total: data.length,
        byType: typeCounts
      });
    } catch (err) {
      console.error('Erreur lors du chargement des exercices:', err);
      setError('Erreur lors du chargement des exercices');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filtrer les exercices selon les critères
  const filterExercises = () => {
    let filtered = [...exercises];
    
    // Filtrer par type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(ex => ex.type === selectedFilter);
    }
    
    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ex => 
        ex.nom.toLowerCase().includes(query) || 
        (ex.categorie && ex.categorie.toLowerCase().includes(query)) ||
        (ex.description && ex.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredExercises(filtered);
  };
  
  // Ouvrir le modal pour ajouter un exercice
  const handleAddExercise = () => {
    setEditingExercise(null);
    setFormData({
      nom: '',
      type: 'push',
      categorie: '',
      description: '',
      image_url: '',
      video_url: '',
      variante: ''
    });
    setIsModalOpen(true);
  };
  
  // Ouvrir le modal pour modifier un exercice
  const handleEditExercise = (exercise: BankExercise) => {
    setEditingExercise(exercise);
    setFormData({
      nom: exercise.nom || '',
      type: exercise.type || 'push',
      categorie: exercise.categorie || '',
      description: exercise.description || '',
      image_url: exercise.image_url || '',
      video_url: exercise.video_url || '',
      variante: exercise.variante || ''
    });
    setIsModalOpen(true);
  };
  
  // Gérer les changements dans le formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Sauvegarder un exercice (ajout ou modification)
  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom.trim()) {
      setError('Le nom de l\'exercice est obligatoire');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (editingExercise) {
        // Mise à jour d'un exercice existant
        await bankExercisesService.update(editingExercise.id, formData);
        setSuccess(`Exercice "${formData.nom}" mis à jour avec succès`);
      } else {
        // Création d'un nouvel exercice
        await bankExercisesService.create(formData);
        setSuccess(`Exercice "${formData.nom}" ajouté avec succès`);
      }
      
      // Fermer le modal et recharger les données
      setIsModalOpen(false);
      await loadExercises();
      
      // Effacer le message de succès après quelques secondes
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de l\'exercice:', err);
      setError('Erreur lors de la sauvegarde de l\'exercice');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Supprimer un exercice
  const handleDeleteExercise = async (id: string, nom: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'exercice "${nom}" ?`)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await bankExercisesService.delete(id);
      setSuccess(`Exercice "${nom}" supprimé avec succès`);
      
      // Recharger les exercices
      await loadExercises();
      
      // Effacer le message de succès après quelques secondes
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'exercice:', err);
      setError('Erreur lors de la suppression de l\'exercice');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour obtenir le libellé du type d'exercice
  const getTypeLabel = (typeValue: string): string => {
    const type = exerciseTypes.find(t => t.value === typeValue);
    return type ? type.label : typeValue;
  };
  
  // Récupérer une image de placeholder si aucune image n'est fournie
  const getImageUrl = (exercise: BankExercise): string => {
    if (exercise.image_url) return exercise.image_url;
    
    // Utiliser une image par défaut selon le type d'exercice
    switch (exercise.type) {
      case 'push': return 'https://via.placeholder.com/150?text=Pompes';
      case 'pull': return 'https://via.placeholder.com/150?text=Pull';
      case 'squat': return 'https://via.placeholder.com/150?text=Squat';
      case 'core': return 'https://via.placeholder.com/150?text=Core';
      case 'animal_flow': return 'https://via.placeholder.com/150?text=Animal+Flow';
      case 'mobilité': return 'https://via.placeholder.com/150?text=Mobilité';
      case 'respiration': return 'https://via.placeholder.com/150?text=Respiration';
      default: return 'https://via.placeholder.com/150?text=Exercice';
    }
  };
  
  // Générer une couleur en fonction du type d'exercice
  const getTypeColor = (typeValue: string): string => {
    switch (typeValue) {
      case 'push': return 'bg-blue-500';
      case 'pull': return 'bg-purple-500';
      case 'squat': return 'bg-green-500';
      case 'core': return 'bg-orange-500';
      case 'animal_flow': return 'bg-yellow-500';
      case 'mobilité': return 'bg-teal-500';
      case 'respiration': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <PageContainer 
      title="Inventaire d'exercices"
      action={
        <Button
          variant="primary"
          onClick={handleAddExercise}
          className="flex items-center bg-blue-600 hover:bg-blue-700 rounded-full py-2 px-4"
        >
          <Plus size={16} className="mr-1" />
          Ajouter un exercice
        </Button>
      }
    >
      {/* Conteneur principal avec style moderne */}
      <div>
        {/* Notifications de succès/erreur */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Section des statistiques */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Statistiques de la banque d'exercices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Total</div>
              <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
            </div>
            {exerciseTypes.map(type => (
              <div key={type.value} className={`p-4 rounded-lg ${getTypeColor(type.value)} bg-opacity-10`}>
                <div className={`text-sm font-medium ${getTypeColor(type.value).replace('bg-', 'text-')}`}>
                  {type.label}
                </div>
                <div className={`text-2xl font-bold ${getTypeColor(type.value).replace('bg-', 'text-')}`}>
                  {stats.byType[type.value] || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Section des filtres et recherche */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un exercice..."
              className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 focus:bg-white"
            />
          </div>
          
          <div>
            <div className="flex items-center mb-3">
              <Sliders className="text-gray-500 mr-2 h-4 w-4" />
              <span className="text-sm font-medium text-gray-700">Filtrer par type:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedFilter === 'all'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                Tous
              </button>
              {exerciseTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setSelectedFilter(type.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedFilter === type.value
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Section des résultats */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-medium text-gray-800">
              Résultats d'exercices
              <span className="ml-2 text-sm font-normal text-gray-500">
                {filteredExercises.length} exercice(s) trouvé(s)
              </span>
            </h2>
            <div className="flex gap-2">
              <button className="p-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-100">
                <Filter size={16} />
              </button>
              <select 
                className="text-sm border border-gray-200 rounded py-1.5 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                defaultValue="recent"
              >
                <option value="recent">Plus récents</option>
                <option value="name">Nom</option>
                <option value="type">Type</option>
              </select>
            </div>
          </div>
          
          {/* Liste des exercices */}
          {isLoading && exercises.length === 0 ? (
            <div className="flex justify-center items-center p-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredExercises.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredExercises.map(exercise => (
                <div
                  key={exercise.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{exercise.nom}</h3>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditExercise(exercise)}
                          className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                          title="Modifier"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteExercise(exercise.id, exercise.nom)}
                          className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getTypeColor(exercise.type)}`}>
                        {getTypeLabel(exercise.type)}
                      </span>
                      {exercise.categorie && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {exercise.categorie}
                        </span>
                      )}
                    </div>

                    {exercise.description && (
                      <p className="text-sm text-gray-600 mb-2">{exercise.description}</p>
                    )}

                    {exercise.variante && (
                      <div className="mt-2 p-2 bg-green-50 rounded-md">
                        <p className="text-xs font-medium text-green-800 mb-1">Variante plus facile :</p>
                        <p className="text-sm text-green-700">{exercise.variante}</p>
                      </div>
                    )}

                    {exercise.image_url && (
                      <img
                        src={getImageUrl(exercise)}
                        alt={exercise.nom}
                        className="w-full h-32 object-cover rounded-md mt-2"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <p className="text-gray-500 mb-4">Aucun exercice trouvé.</p>
              <Button
                variant="secondary"
                onClick={handleAddExercise}
                className="inline-flex items-center"
              >
                <Plus size={16} className="mr-1" />
                Ajouter un exercice
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal d'ajout/modification d'exercice */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* En-tête fixe */}
            <div className="p-4 border-b flex justify-between items-center shrink-0">
              <h2 className="text-lg font-medium text-gray-800">
                {editingExercise ? `Modifier l'exercice: ${editingExercise.nom}` : 'Ajouter un nouvel exercice'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveExercise} className="flex flex-col h-full">
              {/* Contenu scrollable */}
              <div className="p-4 space-y-4 overflow-y-auto flex-grow">
                {/* Première rangée : Nom et Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                      Nom de l'exercice <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      Type d'exercice <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {exerciseTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description et Variante */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="variante" className="block text-sm font-medium text-gray-700">
                      Variante plus facile
                    </label>
                    <textarea
                      id="variante"
                      name="variante"
                      value={formData.variante}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Décrivez une variante plus facile..."
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Catégorie et URLs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="categorie" className="block text-sm font-medium text-gray-700">
                      Catégorie
                    </label>
                    <input
                      type="text"
                      id="categorie"
                      name="categorie"
                      value={formData.categorie}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">
                      URL de l'image
                    </label>
                    <input
                      type="url"
                      id="image_url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://exemple.com/image.jpg"
                    />
                  </div>
                </div>

                {/* URLs des médias */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="video_url" className="block text-sm font-medium text-gray-700">
                      URL de la vidéo
                    </label>
                    <input
                      type="url"
                      id="video_url"
                      name="video_url"
                      value={formData.video_url}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://exemple.com/video.mp4"
                    />
                  </div>
                </div>

                {/* Aperçu de l'image si disponible */}
                {formData.image_url && (
                  <div className="mt-2">
                    <img 
                      src={formData.image_url} 
                      alt="Aperçu" 
                      className="h-32 w-auto object-cover rounded-lg"
                      onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Erreur+Image')}
                    />
                  </div>
                )}
              </div>
              
              {/* Pied de page fixe avec les boutons d'action */}
              <div className="p-4 border-t flex justify-end space-x-3 shrink-0 bg-white">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg"
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
                      {editingExercise ? 'Mise à jour...' : 'Création...'}
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-1" />
                      {editingExercise ? 'Mettre à jour' : 'Créer l\'exercice'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default ExerciseBankPage; 