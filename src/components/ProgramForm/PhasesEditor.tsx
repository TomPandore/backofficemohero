import React, { useState } from 'react';
import { Plus, GripVertical, X } from 'lucide-react';
import Button from '../UI/Button';

interface Phase {
  titre: string;
  sous_titre: string;
  texte: string;
}

interface PhasesEditorProps {
  phases: Phase[];
  onChange: (phases: Phase[]) => void;
}

const PhasesEditor: React.FC<PhasesEditorProps> = ({ phases, onChange }) => {
  const [newPhase, setNewPhase] = useState<Phase>({
    titre: '',
    sous_titre: '',
    texte: '',
  });

  const handlePhaseChange = (index: number, field: keyof Phase, value: string) => {
    const updatedPhases = [...phases];
    updatedPhases[index] = { ...updatedPhases[index], [field]: value };
    onChange(updatedPhases);
  };

  const addPhase = () => {
    if (newPhase.titre.trim() && newPhase.sous_titre.trim()) {
      onChange([...phases, { ...newPhase }]);
      setNewPhase({ titre: '', sous_titre: '', texte: '' });
    }
  };

  const removePhase = (index: number) => {
    const updatedPhases = phases.filter((_, i) => i !== index);
    onChange(updatedPhases);
  };

  const movePhase = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= phases.length) return;
    
    const updatedPhases = [...phases];
    const [movedPhase] = updatedPhases.splice(fromIndex, 1);
    updatedPhases.splice(toIndex, 0, movedPhase);
    onChange(updatedPhases);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {phases.map((phase, index) => (
          <div
            key={index}
            className="relative flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center self-stretch text-gray-400 cursor-move">
              <GripVertical size={20} />
            </div>
            
            <div className="flex-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Titre de la phase
                </label>
                <input
                  type="text"
                  value={phase.titre}
                  onChange={(e) => handlePhaseChange(index, 'titre', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="ex: Phase 1: Fluidité"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Période
                </label>
                <input
                  type="text"
                  value={phase.sous_titre}
                  onChange={(e) => handlePhaseChange(index, 'sous_titre', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="ex: Jour 1-7"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={phase.texte}
                  onChange={(e) => handlePhaseChange(index, 'texte', e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Description de la phase"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => movePhase(index, index - 1)}
                disabled={index === 0}
              >
                ↑
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => movePhase(index, index + 1)}
                disabled={index === phases.length - 1}
              >
                ↓
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => removePhase(index)}
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Ajouter une nouvelle phase</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <input
              type="text"
              value={newPhase.titre}
              onChange={(e) => setNewPhase(prev => ({ ...prev, titre: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Titre de la phase"
            />
          </div>
          <div>
            <input
              type="text"
              value={newPhase.sous_titre}
              onChange={(e) => setNewPhase(prev => ({ ...prev, sous_titre: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Période (ex: Jour 1-7)"
            />
          </div>
          <div className="sm:col-span-2">
            <textarea
              value={newPhase.texte}
              onChange={(e) => setNewPhase(prev => ({ ...prev, texte: e.target.value }))}
              rows={2}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Description de la phase"
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              type="button"
              onClick={addPhase}
              disabled={!newPhase.titre.trim() || !newPhase.sous_titre.trim()}
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              Ajouter la phase
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhasesEditor;