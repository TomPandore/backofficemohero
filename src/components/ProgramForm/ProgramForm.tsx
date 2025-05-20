import React, { useState, useEffect } from 'react';
import { Plus, X, Upload, Image as ImageIcon } from 'lucide-react';
import { Program, ProgramType, Phase } from '../../types';
import { clans } from '../../data/mockData';
import Button from '../UI/Button';
import PhasesEditor from './PhasesEditor';

const PROGRAM_TYPES: { value: ProgramType; label: string }[] = [
  { value: 'Découverte', label: 'Découverte' },
  { value: 'premium', label: 'Premium' },
  { value: 'premium_clan', label: 'Premium Clan' },
];

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Facile' },
  { value: 'medium', label: 'Moyen' },
  { value: 'hard', label: 'Difficile' },
];

interface ProgramFormProps {
  program: Program | null;
  onSubmit: (formData: Omit<Program, 'id'>) => Promise<void>;
  onClose: () => void;
  isSubmitting?: boolean;
}

const ProgramForm: React.FC<ProgramFormProps> = ({ 
  program, 
  onSubmit, 
  onClose,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<Omit<Program, 'id'>>({
    name: '',
    description: '',
    duration: 28,
    type: 'Découverte',
    clan_id: null,
    tags: [],
    results: [],
    summary: [],
    image_url: '',
    niveau_difficulte: 'medium',
    exercises: {}
  });
  
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newResult, setNewResult] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialiser le formulaire avec les données du programme
  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name,
        description: program.description || '',
        duration: program.duration,
        type: program.type,
        clan_id: program.clan_id,
        tags: program.tags || [],
        results: program.results || [],
        summary: Array.isArray(program.summary) ? program.summary : [],
        image_url: program.image_url || '',
        niveau_difficulte: program.niveau_difficulte || 'medium',
        exercises: program.exercises || {}
      });
    }
  }, [program]);

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Effacer les erreurs pour ce champ
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Gérer le changement d'image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dans un vrai contexte, il faudrait uploader l'image vers un service de stockage
      setFormData(prev => ({
        ...prev,
        image_url: URL.createObjectURL(file),
      }));
      setShowImageUpload(false);
    }
  };

  // Ajouter un tag
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  // Supprimer un tag
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  // Ajouter un résultat
  const addResult = () => {
    if (newResult.trim() && !formData.results.includes(newResult.trim())) {
      setFormData(prev => ({
        ...prev,
        results: [...prev.results, newResult.trim()],
      }));
      setNewResult('');
    }
  };

  // Supprimer un résultat
  const removeResult = (resultToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      results: prev.results.filter(result => result !== resultToRemove),
    }));
  };

  // Gérer les changements dans les phases
  const handlePhasesChange = (phases: Phase[]) => {
    setFormData(prev => ({
      ...prev,
      summary: phases,
    }));
  };

  // Valider le formulaire
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    
    if (formData.duration <= 0) {
      newErrors.duration = 'La durée doit être supérieure à 0';
    }
    
    if (formData.tags.length === 0) {
      newErrors.tags = 'Ajoutez au moins un tag';
    }
    
    if (formData.results.length === 0) {
      newErrors.results = 'Ajoutez au moins un résultat';
    }
    
    if (!formData.summary || formData.summary.length === 0) {
      newErrors.summary = 'Ajoutez au moins une phase';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      // Scroll vers la première erreur
      const firstErrorElement = document.querySelector('.border-red-500');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    try {
      await onSubmit(formData);
      setSuccessMessage('Programme enregistré avec succès!');
      
      // Effacer le message après 3 secondes
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Message de succès */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {successMessage}
        </div>
      )}
      
      {/* Image du programme */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image du programme
        </label>
        {formData.image_url && !showImageUpload ? (
          <div className="relative">
            <img
              src={formData.image_url}
              alt="Programme"
              className="h-48 w-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-lg">
              <Button
                type="button"
                onClick={() => setShowImageUpload(true)}
                variant="secondary"
                className="bg-white bg-opacity-90"
              >
                <ImageIcon size={16} className="mr-2" />
                Changer l'image
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="image"
                  className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Télécharger une image</span>
                  <input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG jusqu'à 10MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Nom du programme */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nom du programme
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.name ? 'border-red-500' : ''
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {/* Durée et Type */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            Durée (jours)
          </label>
          <input
            type="number"
            id="duration"
            name="duration"
            min="1"
            value={formData.duration}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.duration ? 'border-red-500' : ''
            }`}
          />
          {errors.duration && (
            <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
          )}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Type de programme
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {PROGRAM_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clan et Difficulté */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="clan_id" className="block text-sm font-medium text-gray-700">
            Clan
          </label>
          <select
            id="clan_id"
            name="clan_id"
            value={formData.clan_id || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Aucun</option>
            {clans.map(clan => (
              <option key={clan.id} value={clan.id}>
                {clan.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="niveau_difficulte" className="block text-sm font-medium text-gray-700">
            Niveau de difficulté
          </label>
          <select
            id="niveau_difficulte"
            name="niveau_difficulte"
            value={formData.niveau_difficulte || 'medium'}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {DIFFICULTY_LEVELS.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 inline-flex items-center p-0.5 hover:bg-blue-200 rounded-full"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Ajouter un tag"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <Button type="button" onClick={addTag}>
            <Plus size={16} />
          </Button>
        </div>
        {errors.tags && (
          <p className="mt-1 text-sm text-red-600">{errors.tags}</p>
        )}
      </div>

      {/* Résultats */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Résultats attendus
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.results.map(result => (
            <span
              key={result}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800"
            >
              {result}
              <button
                type="button"
                onClick={() => removeResult(result)}
                className="ml-1 inline-flex items-center p-0.5 hover:bg-green-200 rounded-full"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newResult}
            onChange={(e) => setNewResult(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addResult())}
            placeholder="Ajouter un résultat"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <Button type="button" onClick={addResult}>
            <Plus size={16} />
          </Button>
        </div>
        {errors.results && (
          <p className="mt-1 text-sm text-red-600">{errors.results}</p>
        )}
      </div>

      {/* Phases */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phases du programme
        </label>
        <PhasesEditor
          phases={Array.isArray(formData.summary) ? formData.summary : []}
          onChange={handlePhasesChange}
        />
        {errors.summary && (
          <p className="mt-1 text-sm text-red-600">{errors.summary}</p>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="flex justify-between pt-5">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? 'Enregistrement...' 
            : program 
              ? 'Mettre à jour' 
              : 'Créer le programme'
          }
        </Button>
      </div>
    </form>
  );
};

export default ProgramForm;