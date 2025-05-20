import React, { useState } from 'react';
import { Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Program } from '../../types';
import { usePrograms } from '../../context/ProgramContext';
import ClanBadge from '../UI/ClanBadge';
import Button from '../UI/Button';
import Modal from '../UI/Modal';

const ProgramTable: React.FC = () => {
  const { programs, deleteProgram, loading, error } = usePrograms();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setProgramToDelete(id);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    if (programToDelete) {
      try {
        await deleteProgram(programToDelete);
        setProgramToDelete(null);
        setShowDeleteModal(false);
      } catch (error) {
        console.error('Error deleting program:', error);
      }
    }
  };
  
  const handleEdit = (program: Program) => {
    navigate(`/programs/${program.id}/edit`);
  };
  
  const handleAddNew = () => {
    navigate('/programs/new');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Une erreur est survenue: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleAddNew}>
          <Plus size={16} className="mr-1" />
          Nouveau programme
        </Button>
      </div>
      
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clan
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durée (jours)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {programs.map((program) => (
              <tr key={program.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{program.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {program.clan_id && <ClanBadge clanId={program.clan_id} />}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{program.type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{program.duration}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {program.tags?.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="mr-2"
                    onClick={() => handleEdit(program)}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => handleDelete(program.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))}
            {programs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucun programme trouvé. Créez votre premier programme!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
        footer={
          <>
            <Button 
              variant="danger" 
              onClick={confirmDelete}
              className="ml-3"
            >
              Supprimer
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setShowDeleteModal(false)}
            >
              Annuler
            </Button>
          </>
        }
      >
        <p>Êtes-vous sûr de vouloir supprimer ce programme ? Cette action est irréversible.</p>
      </Modal>
    </div>
  );
};

export default ProgramTable;