import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrograms } from '../context/ProgramContext';
import PageContainer from '../components/Layout/PageContainer';
import ProgramForm from '../components/ProgramForm/ProgramForm';
import { Program } from '../types';
import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';

const CreateProgramPage: React.FC = () => {
  const { createProgram, error: contextError } = usePrograms();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  const handleCreateProgram = async (formData: Omit<Program, 'id'>) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      logger.log('Tentative de création de programme', formData);
      
      const newProgram = await createProgram(formData);
      logger.log('Programme créé avec succès:', newProgram);
      
      // Rediriger vers la page de gestion des jours du programme
      navigate(`/program/${newProgram.id}/days`);
    } catch (err) {
      console.error('Erreur lors de la création du programme:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const runDiagnostic = async () => {
    setDiagnosticResult(null);
    
    try {
      // 1. Vérifier la connexion à Supabase
      const connectionResult = await testSupabaseConnection();
      
      // 2. Tester la création d'un programme simple
      const testResult = await testCreateProgram();
      
      setDiagnosticResult({
        connection: connectionResult,
        creation: testResult,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Erreur lors du diagnostic:', err);
      setDiagnosticResult({
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      });
    }
  };
  
  const testSupabaseConnection = async () => {
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.from('programmes').select('count').limit(1);
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return { 
          success: false, 
          error: error.message,
          code: error.code,
          details: error.details,
          responseTime
        };
      }
      
      return { 
        success: true, 
        data,
        responseTime,
        supabaseUrl: (supabase as any).supabaseUrl
      };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : String(err)
      };
    }
  };
  
  const testCreateProgram = async () => {
    try {
      // Créer un programme de test minimal
      const testProgram = {
        name: `Test Program ${Date.now()}`,
        description: 'Programme de test automatique pour diagnostic',
        duration: 7,
        type: 'découverte' as const,
        clan_id: null,
        tags: ['test', 'diagnostic'],
        results: ['Test de fonctionnalité'],
        summary: [{
          name: 'Phase test',
          duration: 7,
          description: 'Phase unique de test'
        }],
        niveau_difficulte: 'easy' as const
      };
      
      // Essayer de créer directement via Supabase
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('programmes')
        .insert([{
          nom: testProgram.name,
          description: testProgram.description,
          duree_jours: testProgram.duration,
          type: testProgram.type,
          clan_id: testProgram.clan_id,
          tags: testProgram.tags,
          resultats: testProgram.results,
          parcours_resume: testProgram.summary,
          niveau_difficulte: testProgram.niveau_difficulte
        }])
        .select();
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
          testProgram,
          responseTime
        };
      }
      
      return {
        success: true,
        data,
        testProgram,
        responseTime
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  };

  return (
    <PageContainer 
      title="Nouveau programme"
      action={
        <button
          onClick={() => setShowDiagnostic(!showDiagnostic)}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 transition-colors"
        >
          {showDiagnostic ? "Masquer diagnostic" : "Diagnostic"}
        </button>
      }
    >
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Nouveau programme</h1>
        
        {showDiagnostic && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Diagnostic de création</h3>
            <button
              onClick={runDiagnostic}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            >
              Exécuter diagnostic
            </button>
            
            {diagnosticResult && (
              <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                <h4 className="font-medium mb-2">Résultats du diagnostic</h4>
                <pre className="text-xs overflow-auto max-h-60">
                  {JSON.stringify(diagnosticResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
        
        {(error || contextError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || contextError}
          </div>
        )}
        
        <ProgramForm
          program={null}
          onSubmit={handleCreateProgram}
          onClose={() => navigate('/')}
          isSubmitting={isSubmitting}
        />
      </div>
    </PageContainer>
  );
};

export default CreateProgramPage;