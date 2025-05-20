-- Fonction de mise à jour directe pour un programme
-- À exécuter dans l'éditeur SQL de la console Supabase

CREATE OR REPLACE FUNCTION update_program_direct(program_id UUID, new_name TEXT)
RETURNS SETOF programmes AS $$
BEGIN
  RETURN QUERY
  UPDATE programmes
  SET nom = new_name
  WHERE id = program_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql; 