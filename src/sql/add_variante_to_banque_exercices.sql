-- Ajouter la colonne variante à la table banque_exercices
ALTER TABLE banque_exercices
ADD COLUMN IF NOT EXISTS variante TEXT;
 
-- Commentaire sur la colonne
COMMENT ON COLUMN banque_exercices.variante IS 'Description de la variante plus facile de l''exercice'; 