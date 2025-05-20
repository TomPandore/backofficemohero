import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Program } from '../../types';
import Button from '../UI/Button';
import { Plus, X, Check, Edit2 } from 'lucide-react';

interface FieldEditorProps {
  program: Program;
  fieldName: string;
  label: string;
  value: any;
  type?: 'text' | 'number' | 'textarea' | 'select' | 'tags';
  options?: { value: string; label: string }[];
  onUpdate: () => void;
  dbFieldName?: string;
}

const ProgramFieldEditor: React.FC<FieldEditorProps> = ({
  program,
  fieldName,
  label,
  value,
  type = 'text',
  options = [],
  onUpdate,
  dbFieldName
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fieldValue, setFieldValue] = useState(value);
  const [newTag, setNewTag] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Mapper les noms de champs frontend vers les noms de champs Supabase
  const getDbFieldName = () => {
    if (dbFieldName) return dbFieldName;
    
    const fieldMapping: Record<string, string> = {
      'name': 'nom',
      'description': 'description',
      'duration': 'duree_jours',
      'type': 'type',
      'clan_id': 'clan_id',
      'tags': 'tags',
      'results': 'resultats',
      'summary': 'parcours_resume',
      'image_url': 'image_url',
      'niveau_difficulte': 'niveau_difficulte'
    };
    
    // Si c'est un champ qui n'est pas dans la table (comme exercises), empêcher la mise à jour
    if (fieldName === 'exercises') {
      throw new Error('La modification des exercices n\'est pas supportée dans ce composant');
    }
    
    return fieldMapping[fieldName] || fieldName;
  };

  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
    setFieldValue(value);
    setError(null);
    setSuccess(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFieldValue(e.target.value);
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldValue(Number(e.target.value));
  };

  const addTag = () => {
    if (newTag.trim() && !fieldValue.includes(newTag.trim())) {
      setFieldValue([...fieldValue, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFieldValue(fieldValue.filter((tag: string) => tag !== tagToRemove));
  };

  const handleUpdateField = async () => {
    setIsUpdating(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Préparer les données pour la mise à jour
      const updateData = {
        [getDbFieldName()]: fieldValue
      };
      
      console.log(`Mise à jour du champ ${fieldName} (${getDbFieldName()}) pour le programme ${program.id}:`, updateData);
      
      // Effectuer la mise à jour directe avec Supabase
      const { data, error } = await supabase
        .from('programmes')
        .update(updateData)
        .eq('id', program.id)
        .select('*');
      
      if (error) {
        console.error('Erreur lors de la mise à jour:', error);
        setError(`Erreur: ${error.message}`);
        return;
      }
      
      console.log('Mise à jour réussie:', data);
      setSuccess(true);
      setIsEditing(false);
      
      // Notifier le parent pour qu'il rafraîchisse les données
      onUpdate();
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Erreur inattendue:', err);
      setError(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderEditor = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={fieldValue}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={fieldValue}
            onChange={handleNumberChange}
            min={1}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        );
      
      case 'select':
        return (
          <select
            value={fieldValue}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {options && options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'tags':
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {fieldValue.map((tag: string) => (
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
              <Button type="button" onClick={addTag} size="sm">
                <Plus size={16} />
              </Button>
            </div>
          </div>
        );
      
      default: // 'text'
        return (
          <input
            type="text"
            value={fieldValue}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        );
    }
  };

  const renderValue = () => {
    if (type === 'tags' && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1 py-1">
          {value.length > 0 ? value.map((tag: string) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {tag}
            </span>
          )) : <span className="text-gray-500 italic">Aucun élément</span>}
        </div>
      );
    }
    
    if (type === 'select' && options) {
      const option = options.find(opt => opt.value === value);
      return option ? option.label : value;
    }

    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-500 italic">Non défini</span>;
    }

    return (
      <div className="flex items-center">
        <span className="mr-2">{value}</span>
        {success && (
          <span className="inline-flex items-center justify-center w-4 h-4 bg-green-500 text-white rounded-full animate-pulse transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-md p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">{label}</h3>
        
        {isEditing ? (
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleToggleEdit}
              disabled={isUpdating}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdateField}
              disabled={isUpdating}
            >
              {isUpdating ? 'Mise à jour...' : 'Enregistrer'}
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleToggleEdit}
          >
            <Edit2 size={16} className="mr-1" /> Modifier
          </Button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-2 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded mb-2 text-sm flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Mise à jour réussie - Valeur enregistrée avec succès
        </div>
      )}
      
      <div className="mt-1">
        {isEditing ? renderEditor() : (
          <div className="py-1">
            {renderValue()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramFieldEditor; 