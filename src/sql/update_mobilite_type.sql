-- Mettre à jour les exercices existants avec le type 'mobilité' vers 'mobilite'
UPDATE exercices
SET type = 'mobilite'
WHERE type = 'mobilité';
 
-- Mettre à jour la banque d'exercices
UPDATE banque_exercices
SET type = 'mobilite'
WHERE type = 'mobilité'; 