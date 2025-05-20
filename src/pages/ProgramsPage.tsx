import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, RefreshCw, Settings, Dumbbell, Eye } from 'lucide-react';
import { usePrograms } from '../context/ProgramContext';
import { Program } from '../types';
import PageContainer from '../components/Layout/PageContainer';
import Button from '../components/UI/Button';

const ProgramsPage: React.FC = () => {
  const { programs, loading, error, deleteProgram, refreshPrograms } = usePrograms();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Rafraîchir la liste des programmes
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPrograms();
    setIsRefreshing(false);
  };

  // Confirmer et supprimer un programme
  const handleDeleteProgram = async (id: string) => {
    if (deleteConfirm === id) {
      try {
        await deleteProgram(id);
      } catch (error) {
        console.error('Erreur lors de la suppression du programme:', error);
      } finally {
        setDeleteConfirm(null);
      }
    } else {
      setDeleteConfirm(id);
      // Réinitialiser après 5 secondes si l'utilisateur ne confirme pas
      setTimeout(() => {
        setDeleteConfirm(null);
      }, 5000);
    }
  };

  return (
    <PageContainer
      title="Programmes"
      action={
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/programs/new')}
          >
            <Plus size={16} className="mr-1" />
            Nouveau programme
          </Button>
        </div>
      }
    >
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading && !isRefreshing ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : programs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulté
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exercices
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {programs.map((program) => (
                <tr key={program.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {program.image_url ? (
                        <div className="flex-shrink-0 h-10 w-10 mr-4">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={program.image_url}
                            alt={program.name}
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                          <span className="text-gray-500 text-sm">{program.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {program.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {program.tags.join(', ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {program.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {program.duration} jours
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      program.niveau_difficulte === 'easy' 
                        ? 'bg-green-100 text-green-800' 
                        : program.niveau_difficulte === 'hard' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {program.niveau_difficulte === 'easy' 
                        ? 'Facile' 
                        : program.niveau_difficulte === 'hard' 
                          ? 'Difficile' 
                          : 'Moyen'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {program.exercises 
                      ? Object.keys(program.exercises).length 
                      : 0} jour(s) avec exercices
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="primary"
                        onClick={() => navigate(`/edit-program/${program.id}`)}
                        className="!p-1 bg-purple-600 hover:bg-purple-700 text-white"
                        title="Modifier le programme"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant={deleteConfirm === program.id ? "danger" : "secondary"}
                        onClick={() => handleDeleteProgram(program.id)}
                        className="!p-1"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun programme</h3>
          <p className="text-gray-500 mb-6">Commencez par créer un nouveau programme</p>
          <Button
            variant="primary"
            onClick={() => navigate('/programs/new')}
          >
            <Plus size={16} className="mr-1" />
            Nouveau programme
          </Button>
        </div>
      )}
    </PageContainer>
  );
};

export default ProgramsPage;