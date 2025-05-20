import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { statsService, AppStats } from '../services/statsService';
import { RefreshCw, Users, Activity, Award, UserPlus, CheckCircle, Zap, BarChart, TrendingUp, User, Package, Layers } from 'lucide-react';
import PageContainer from '../components/Layout/PageContainer';

// Enregistrer les composants ChartJS nécessaires
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Mappage des IDs de clan vers des noms de clan
const CLAN_NAMES: Record<string, string> = {
  '29214484-ec80-450b-8ef5-2137fddbe18a': 'Onotka',
  '203a6951-edca-4663-a9a5-407554a0032f': 'Ekloa',
  '2976ae91-538d-49a1-9d9d-2106b8d7360d': 'Okwáho',
  // Ajoutez d'autres mappages selon vos besoins
};

// Liste des noms de clan officiels
const OFFICIAL_CLAN_NAMES = ['Onotka', 'Ekloa', 'Okwáho'];

// Mappage inversé des noms vers des IDs
const CLAN_NAMES_TO_IDS: Record<string, string> = {
  'Onotka': '29214484-ec80-450b-8ef5-2137fddbe18a',
  'Ekloa': '203a6951-edca-4663-a9a5-407554a0032f',
  'Okwáho': '2976ae91-538d-49a1-9d9d-2106b8d7360d'
};

// Mappage des noms de clan vers des images (utiliser des URLs d'avatar générés)
const CLAN_IMAGES: Record<string, string> = {
  'Onotka': 'https://ui-avatars.com/api/?name=Onotka&background=4B7BF5&color=FFFFFF&size=200&bold=true',
  'Ekloa': 'https://ui-avatars.com/api/?name=Ekloa&background=2BB673&color=FFFFFF&size=200&bold=true',
  'Okwáho': 'https://ui-avatars.com/api/?name=Okwaho&background=F59E0B&color=FFFFFF&size=200&bold=true'
};

// Fonction pour formater les noms de clan
const formatClanName = (clanId: string, defaultName?: string): string => {
  // Si l'ID est directement dans notre mappage, c'est le cas le plus simple
  if (CLAN_NAMES[clanId]) {
    return CLAN_NAMES[clanId];
  }
  
  // Si le nom par défaut est l'un de nos noms officiels, l'utiliser
  if (defaultName && OFFICIAL_CLAN_NAMES.includes(defaultName)) {
    return defaultName;
  }
  
  // Si le nom par défaut ressemble à l'un de nos noms officiels (ignorer la casse)
  if (defaultName) {
    for (const name of OFFICIAL_CLAN_NAMES) {
      if (name.toLowerCase() === defaultName.toLowerCase()) {
        return name; // Retourner le nom avec la casse correcte
      }
    }
  }
  
  // Vérifier si l'ID ressemble à l'un de nos IDs connus (en ignorant la casse)
  for (const [knownId, name] of Object.entries(CLAN_NAMES)) {
    if (knownId.toLowerCase() === clanId.toLowerCase() || 
        clanId.includes(knownId) || 
        knownId.includes(clanId)) {
      console.log(`Correspondance approximative d'ID: ${clanId} -> ${knownId} (${name})`);
      return name;
    }
  }
  
  // Vérifier si le clanId est en fait un nom de clan (peut arriver avec certaines données)
  for (const name of OFFICIAL_CLAN_NAMES) {
    if (clanId.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(clanId.toLowerCase())) {
      console.log(`L'ID semble être un nom: ${clanId} -> ${name}`);
      return name;
    }
  }
  
  // Si nous avons un nom par défaut qui n'est pas un UUID, l'utiliser
  if (defaultName && !defaultName.includes('Clan ') && !defaultName.match(/^[0-9a-f]{8}-/i)) {
    return defaultName;
  }
  
  // Créer un nom par défaut basé sur l'ID (dernier recours)
  const shortId = clanId.length > 8 ? clanId.substring(0, 8) + '...' : clanId;
  return `Clan ${shortId}`;
};

const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      setRefreshing(true);
      
      const data = await statsService.getAppStats();
      
      // Déboguer les données des clans
      console.log('Données des clans brutes reçues de l\'API:', data.usersByClan);
      
      // Remplacer les noms de clan par des noms conviviaux
      if (data && data.usersByClan) {
        // Regrouper les entrées de clan qui font référence au même clan
        const clanGroups: Record<string, typeof data.usersByClan[0]> = {};
        
        data.usersByClan.forEach(item => {
          // Déterminer le nom officiel du clan
          const officialName = formatClanName(item.clan_id, item.clan_name);
          console.log(`Mappage ID -> Nom: ${item.clan_id} (${item.clan_name}) => ${officialName}`);
          
          // Déterminer l'ID canonique pour ce clan (à partir du nom)
          let canonicalId = CLAN_NAMES_TO_IDS[officialName] || item.clan_id;
          
          // Utiliser cet ID comme clé de regroupement
          if (clanGroups[canonicalId]) {
            clanGroups[canonicalId].count += item.count;
          } else {
            clanGroups[canonicalId] = {
              ...item,
              clan_id: canonicalId,
              clan_name: officialName,
              // Utiliser l'image du clan officiel si disponible
              image_url: CLAN_IMAGES[officialName] || item.image_url
            };
          }
        });
        
        // S'assurer que tous les clans officiels sont présents, même avec zéro utilisateur
        OFFICIAL_CLAN_NAMES.forEach(name => {
          const id = CLAN_NAMES_TO_IDS[name];
          if (id && !clanGroups[id]) {
            clanGroups[id] = {
              clan_id: id,
              clan_name: name,
              count: 0,
              image_url: CLAN_IMAGES[name]
            };
          }
        });
        
        // Convertir les groupes en tableau et trier par nom officiel (pour que l'ordre soit toujours constant)
        data.usersByClan = Object.values(clanGroups).sort((a, b) => {
          const aIndex = OFFICIAL_CLAN_NAMES.indexOf(a.clan_name);
          const bIndex = OFFICIAL_CLAN_NAMES.indexOf(b.clan_name);
          
          if (aIndex >= 0 && bIndex >= 0) {
            return aIndex - bIndex; // Trier par ordre dans la liste officielle
          } else if (aIndex >= 0) {
            return -1; // Les clans officiels en premier
          } else if (bIndex >= 0) {
            return 1;
          } else {
            return a.clan_name.localeCompare(b.clan_name); // Tri alphabétique pour les autres
          }
        });
        
        console.log('Données des clans après fusion et formatage:', data.usersByClan);
      }
      
      setStats(data);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Configuration du graphique de type de programme
  const programTypeChartData = {
    labels: stats?.programsByType.map(item => item.type === 'Découverte' ? 'Découverte' : 
                                      item.type === 'premium' ? 'Premium' : 
                                      item.type === 'premium_clan' ? 'Premium Clan' : item.type) || [],
    datasets: [
      {
        label: 'Programmes par type',
        data: stats?.programsByType.map(item => item.count) || [],
        backgroundColor: [
          'rgba(132, 204, 22, 0.7)',  // mohero-accent
          'rgba(132, 204, 22, 0.5)',  // mohero-accent plus léger
          'rgba(132, 204, 22, 0.3)',  // mohero-accent encore plus léger
        ],
        borderColor: [
          'rgba(132, 204, 22, 1)',
          'rgba(132, 204, 22, 0.8)',
          'rgba(132, 204, 22, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Configuration du graphique des programmes populaires
  const popularProgramsChartData = {
    labels: stats?.mostPopularPrograms.map(item => item.name) || [],
    datasets: [
      {
        label: 'Utilisateurs',
        data: stats?.mostPopularPrograms.map(item => item.users) || [],
        backgroundColor: 'rgba(132, 204, 22, 0.7)',
        borderColor: 'rgba(132, 204, 22, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(0, 0, 0, 0.8)'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)'
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)'
        }
      }
    }
  };

  // Actions pour les boutons d'actualisation
  const refreshAction = (
    <button
      onClick={fetchStats}
      disabled={refreshing}
      className="flex items-center px-4 py-2 bg-mohero-accent hover:bg-mohero-accent-hover rounded-lg text-white transition-colors shadow-sm disabled:opacity-50"
    >
      <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
      Actualiser
    </button>
  );

  // Rendu des cartes de statistiques
  const renderStatCard = (title: string, value: number | string, icon: React.ReactNode, color: string) => (
    <div className={`bg-white rounded-xl shadow-sm p-6 flex flex-col ${color} hover:shadow-md transition-shadow`}>
      <div className="flex items-center mb-3">
        <div className="p-2 rounded-full bg-gray-100 mr-3">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-gray-700">{title}</h3>
      </div>
      <p className="text-3xl font-bold mt-1 text-gray-800">{value}</p>
    </div>
  );

  // Formater le taux d'achèvement en pourcentage
  const formatCompletionRate = (rate: number): string => {
    return `${Math.round(rate * 100)}%`;
  };

  return (
    <PageContainer title="Statistiques" action={refreshAction}>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
          <p className="font-medium">Erreur</p>
          <p>{error}</p>
        </div>
      )}

      {loading && !stats ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw size={36} className="text-mohero-accent animate-spin" />
        </div>
      ) : (
        <>
          {/* Cartes de statistiques principales - KPIs utilisateurs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {renderStatCard(
              "Utilisateurs totaux",
              stats?.totalUsers || 0,
              <Users size={22} className="text-mohero-accent" />,
              "border-l-4 border-mohero-accent"
            )}
            {renderStatCard(
              "Utilisateurs actifs",
              stats?.activeUsers || 0,
              <Activity size={22} className="text-mohero-accent" />,
              "border-l-4 border-mohero-accent"
            )}
            {renderStatCard(
              "Nouveaux / jour",
              stats?.dailyRegistrations || 0,
              <UserPlus size={22} className="text-mohero-accent" />,
              "border-l-4 border-mohero-accent"
            )}
            {renderStatCard(
              "Taux d'achèvement",
              formatCompletionRate(stats?.programCompletionRate || 0),
              <CheckCircle size={22} className="text-mohero-accent" />,
              "border-l-4 border-mohero-accent"
            )}
          </div>

          {/* Analyses détaillées */}
          <div className="border-b border-gray-200 pb-2 mb-6">
            <h2 className="text-xl font-medium text-gray-800 flex items-center">
              <BarChart size={20} className="text-mohero-accent mr-2" />
              Analyses détaillées
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Programmes les plus populaires */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
                <TrendingUp size={18} className="text-mohero-accent mr-2" />
                Programmes les plus populaires
              </h3>
              <div className="h-80">
                <Bar 
                  data={popularProgramsChartData} 
                  options={chartOptions}
                />
              </div>
            </div>
            
            {/* Distribution par type de programme */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
                <Award size={18} className="text-mohero-accent mr-2" />
                Distribution par type de programme
              </h3>
              <div className="h-80">
                <Bar 
                  data={programTypeChartData} 
                  options={chartOptions}
                />
              </div>
            </div>
          </div>
          
          {/* Utilisateurs par clan - Version avec colonnes et images */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-6 flex items-center">
              <Zap size={18} className="text-mohero-accent mr-2" />
              Utilisateurs par clan
            </h3>
            
            {/* Colonnes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats?.usersByClan.map((clan) => (
                <div key={clan.clan_id} className="flex flex-col items-center bg-gray-50 rounded-lg p-6 hover:shadow-md transition-all hover:scale-105 border border-gray-100">
                  {/* Image du clan dans un cercle */}
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md mb-4">
                    <img 
                      src={clan.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(clan.clan_name)}&background=84CC16&color=27272A&size=100`} 
                      alt={`${clan.clan_name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback si l'image ne charge pas
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(clan.clan_name)}&background=84CC16&color=27272A&size=100`;
                      }}
                    />
                  </div>
                  
                  {/* Nom du clan */}
                  <h4 className="text-xl font-bold text-gray-800 mb-2">
                    {clan.clan_name}
                  </h4>
                  
                  {/* Nombre d'utilisateurs */}
                  <div className="flex items-center text-mohero-accent">
                    <User size={16} className="mr-1" />
                    <span className="text-lg font-semibold">{clan.count}</span>
                  </div>
                  
                  {/* Pourcentage */}
                  <div className="mt-3 text-sm text-gray-600">
                    {Math.round((clan.count / stats.totalUsers) * 100)}% des utilisateurs
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Actions rapides */}
          <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl shadow-sm p-4 mb-8 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800 flex items-center">
                <Zap size={18} className="text-mohero-accent mr-2" />
                Actions rapides
              </h3>
              <span className="text-xs text-gray-600">Quelles sont les prochaines étapes pour votre application ?</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button className="flex items-center justify-center p-3 bg-white hover:bg-gray-50 rounded-lg text-gray-800 transition-colors border border-gray-200">
                <UserPlus size={18} className="mr-2 text-mohero-accent" />
                <span>Ajouter un utilisateur</span>
              </button>
              
              <button className="flex items-center justify-center p-3 bg-white hover:bg-gray-50 rounded-lg text-gray-800 transition-colors border border-gray-200">
                <Package size={18} className="mr-2 text-mohero-accent" />
                <span>Créer un programme</span>
              </button>
              
              <button className="flex items-center justify-center p-3 bg-white hover:bg-gray-50 rounded-lg text-gray-800 transition-colors border border-gray-200">
                <Layers size={18} className="mr-2 text-mohero-accent" />
                <span>Ajouter un exercice</span>
              </button>
              
              <button className="flex items-center justify-center p-3 bg-white hover:bg-gray-50 rounded-lg text-gray-800 transition-colors border border-gray-200">
                <RefreshCw size={18} className="mr-2 text-mohero-accent" />
                <span>Actualiser</span>
              </button>
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
};

export default StatsPage; 