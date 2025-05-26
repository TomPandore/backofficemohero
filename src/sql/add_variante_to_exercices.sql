-- Ajouter la colonne variante à la table exercices
ALTER TABLE exercices
ADD COLUMN IF NOT EXISTS variante TEXT; 