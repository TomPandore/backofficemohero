-- Création de la table banque_exercices pour stocker les exercices réutilisables
-- À exécuter dans l'éditeur SQL de la console Supabase

CREATE TABLE IF NOT EXISTS public.banque_exercices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('push', 'pull', 'squat', 'core', 'Animal Flow', 'mobilite', 'respiration')) NOT NULL,
    level INTEGER CHECK (level IN (1, 2, 3)) NOT NULL,
    zones TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    categorie TEXT,
    description TEXT,
    image_url TEXT,
    video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter des index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_banque_exercices_name ON public.banque_exercices (name);
CREATE INDEX IF NOT EXISTS idx_banque_exercices_type ON public.banque_exercices (type);
CREATE INDEX IF NOT EXISTS idx_banque_exercices_level ON public.banque_exercices (level);

-- Commentaire sur la table
COMMENT ON TABLE public.banque_exercices IS 'Banque d''exercices réutilisables pour les programmes';

-- Ajouter des permissions RLS (Row Level Security)
ALTER TABLE public.banque_exercices ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre l'accès en lecture à tous
CREATE POLICY banque_exercices_select_policy ON public.banque_exercices
    FOR SELECT USING (true);

-- Créer une politique pour permettre la modification aux utilisateurs authentifiés
CREATE POLICY banque_exercices_all_policy ON public.banque_exercices
    FOR ALL USING (auth.role() = 'authenticated');

-- Fonction pour importer des exercices de la table exercises vers banque_exercices
CREATE OR REPLACE FUNCTION import_exercices_to_banque()
RETURNS TEXT AS $$
DECLARE
    exercice_count INTEGER := 0;
BEGIN
    INSERT INTO public.banque_exercices (name, type, level, zones)
    SELECT name, type, level, zones
    FROM public.exercises
    ON CONFLICT DO NOTHING;
    
    GET DIAGNOSTICS exercice_count = ROW_COUNT;
    
    RETURN exercice_count || ' exercices importés dans la banque';
END;
$$ LANGUAGE plpgsql; 