-- Mettre à jour les exercices existants avec le type 'animal_flow' vers 'Animal Flow'
UPDATE exercices
SET type = 'Animal Flow'
WHERE type = 'animal_flow';
 
-- Mettre à jour la banque d'exercices
UPDATE banque_exercices
SET type = 'Animal Flow'
WHERE type = 'animal_flow'; 