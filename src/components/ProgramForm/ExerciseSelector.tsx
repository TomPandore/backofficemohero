import React, { useState } from 'react';
import { CheckCircle, Filter } from 'lucide-react';
import { exercises } from '../../data/mockData';
import { Exercise } from '../../types';

interface ExerciseSelectorProps {
  selectedExercises: string[];
  onChange: (selected: string[]) => void;
}

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ 
  selectedExercises, 
  onChange 
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  
  const exerciseTypes = [
    { value: 'all', label: 'Tous' },
    { value: 'push', label: 'Push' },
    { value: 'pull', label: 'Pull' },
    { value: 'squat', label: 'Squat' },
    { value: 'core', label: 'Core' },
    { value: 'animal_flow', label: 'Animal Flow' },
    { value: 'mobilite', label: 'Mobilité' },
    { value: 'respiration', label: 'Respiration' }
  ];
  
  const filteredExercises = filterType === 'all'
    ? exercises
    : exercises.filter(exercise => exercise.type === filterType);
  
  const handleSelect = (exerciseId: string) => {
    let newSelected;
    
    if (selectedExercises.includes(exerciseId)) {
      newSelected = selectedExercises.filter(id => id !== exerciseId);
    } else {
      newSelected = [...selectedExercises, exerciseId];
    }
    
    onChange(newSelected);
  };
  
  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1: return 'Débutant';
      case 2: return 'Intermédiaire';
      case 3: return 'Avancé';
      default: return 'Inconnu';
    }
  };
  
  return (
    <div>
      <div className="flex flex-wrap items-center mb-4 gap-2">
        <div className="flex items-center text-sm text-gray-500 mr-2">
          <Filter size={16} className="mr-1" />
          Filtrer:
        </div>
        {exerciseTypes.map(type => (
          <button
            key={type.value}
            onClick={() => setFilterType(type.value)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filterType === type.value
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto p-1">
        {filteredExercises.map(exercise => (
          <div
            key={exercise.id}
            onClick={() => handleSelect(exercise.id)}
            className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
              selectedExercises.includes(exercise.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-800">{exercise.name}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {exercise.zones.join(', ')}
                </p>
              </div>
              {selectedExercises.includes(exercise.id) && (
                <CheckCircle size={20} className="text-blue-500" />
              )}
            </div>
            <div className="flex mt-2 gap-2">
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                {exercise.type}
              </span>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                {getLevelLabel(exercise.level)}
              </span>
            </div>
          </div>
        ))}
        
        {filteredExercises.length === 0 && (
          <div className="col-span-full text-center py-4 text-gray-500">
            Aucun exercice trouvé pour ce filtre
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseSelector;