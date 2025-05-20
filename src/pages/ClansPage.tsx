import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { Users, RefreshCw, CheckCircle } from 'lucide-react';
import PageContainer from '../components/Layout/PageContainer';

const ClansPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [normalizing, setNormalizing] = useState(false);
  const [usersByClan, setUsersByClan] = useState<Record<string, { count: number, users: Array<{ id: string, email?: string }> }>>({});
  const [result, setResult] = useState<{ success?: boolean; message?: string; updatedCount?: number }>({});

  // Mappage des IDs de clan vers des noms conviviaux
  const CLAN_NAMES: Record<string, string> = {
    '29214484-ec80-450b-8ef5-2137fddbe18a': 'Onotka',
    '203a6951-edca-4663-a9a5-407554a0032f': 'Ekloa',
    '8b4e7b2a-fdcc-42c5-a5c9-cb87d05e6e0c': 'Okwáho',
  };

  // Couleurs pour les clans
  const CLAN_COLORS: Record<string, string> = {
    'Onotka': 'bg-blue-100 border-blue-300 text-blue-700',
    'Ekloa': 'bg-green-100 border-green-300 text-green-700',
    'Okwáho': 'bg-amber-100 border-amber-300 text-amber-700',
  };

  const fetchUsersByClan = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsersByClan();
      setUsersByClan(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs par clan:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeClans = async () => {
    setNormalizing(true);
    setResult({});
    
    try {
      const result = await userService.normalizeAllUserClans();
      
      if (result.success) {
        setResult({
          success: true,
          message: `Normalisation réussie. ${result.updatedCount} profils mis à jour.`,
          updatedCount: result.updatedCount
        });
        
        // Rafraîchir les données
        await fetchUsersByClan();
      } else {
        setResult({
          success: false,
          message: 'Erreur lors de la normalisation des clans.',
          updatedCount: result.updatedCount
        });
      }
    } catch (error) {
      console.error('Erreur lors de la normalisation des clans:', error);
      setResult({
        success: false,
        message: 'Erreur lors de la normalisation des clans.',
        updatedCount: 0
      });
    } finally {
      setNormalizing(false);
    }
  };

  useEffect(() => {
    fetchUsersByClan();
  }, []);

  // Formater le nom du clan à partir de l'ID
  const formatClanName = (clanId: string): string => {
    return CLAN_NAMES[clanId] || `Clan ${clanId.substring(0, 8)}...`;
  };

  // Déterminer les couleurs du clan
  const getClanColors = (clanId: string): string => {
    const clanName = formatClanName(clanId);
    return CLAN_COLORS[clanName] || 'bg-gray-100 border-gray-300 text-gray-700';
  };

  return (
    <PageContainer 
      title="Gestion des Clans" 
      action={
        <div className="flex space-x-2">
          <button
            onClick={fetchUsersByClan}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={normalizeClans}
            disabled={normalizing}
            className="flex items-center px-4 py-2 bg-mohero-accent hover:bg-mohero-accent-hover rounded-lg text-white transition-colors shadow-sm disabled:opacity-50"
          >
            <CheckCircle size={16} className="mr-2" />
            Normaliser les clans
          </button>
        </div>
      }
    >
      {result.message && (
        <div className={`mb-6 p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700'}`}>
          {result.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
          <Users className="mr-2 text-mohero-accent" size={20} />
          Distribution des utilisateurs par clan
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw size={36} className="text-mohero-accent animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(usersByClan).map(([clanId, { count, users }]) => (
              <div key={clanId} className={`rounded-lg border p-5 ${getClanColors(clanId)}`}>
                <h3 className="text-xl font-bold mb-3">{formatClanName(clanId)}</h3>
                <div className="flex items-center mb-4">
                  <Users size={18} className="mr-2" />
                  <span className="text-lg font-semibold">{count} utilisateurs</span>
                </div>
                
                <div className="mt-3">
                  <h4 className="font-medium mb-2">ID du clan:</h4>
                  <code className="text-xs bg-white/50 p-2 rounded block overflow-x-auto">
                    {clanId}
                  </code>
                </div>
                
                {users.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium mb-2">Liste des utilisateurs:</h4>
                    <div className="max-h-40 overflow-y-auto bg-white/50 rounded p-2">
                      <ul className="text-sm">
                        {users.map(user => (
                          <li key={user.id} className="mb-1">
                            {user.email || user.id}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {Object.keys(usersByClan).length === 0 && (
              <div className="col-span-3 text-center py-8 text-gray-500">
                Aucun utilisateur avec un clan n'a été trouvé.
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ClansPage; 