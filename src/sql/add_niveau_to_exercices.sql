-- Ajouter la colonne niveau à la table exercices
ALTER TABLE exercices
ADD COLUMN IF NOT EXISTS niveau INTEGER DEFAULT 1;
 
-- Mettre à jour les exercices existants qui n'ont pas de niveau
UPDATE exercices
SET niveau = 1
WHERE niveau IS NULL; 