# Attribution d'exercices aux programmes - Documentation

## Introduction

Cette documentation explique la fonctionnalité d'attribution d'exercices aux programmes dans l'application MoHero Backoffice. Elle permet d'attribuer des exercices spécifiques à chaque jour d'un programme de fitness.

## Structure de la base de données

- **programmes**: Table principale contenant les informations de base du programme
- **jours**: Table de relation entre programmes et exercices
  - `programme_id`: ID du programme
  - `numero_jour`: Numéro du jour du programme
  - `exercise_id`: ID de l'exercice associé
- **exercises**: Table contenant les exercices disponibles
- **banque_exercices**: Nouvelle table contenant un référentiel d'exercices réutilisables

## Fonctionnalités ajoutées

1. **Page d'attribution d'exercices** (`/program/:id/exercises`)
   - Interface dédiée pour attribuer des exercices à chaque jour du programme
   - Sélection du jour à éditer
   - Visualisation des exercices déjà attribués
   - Recherche et ajout d'exercices
   - Gestion de la banque d'exercices

2. **Banque d'exercices**
   - Catalogue d'exercices prédéfinis pour faciliter l'attribution
   - Filtrage par type d'exercice
   - Recherche par nom d'exercice

3. **Modifications de l'interface utilisateur**
   - Bouton d'attribution d'exercices dans la liste des programmes
   - Compteur d'exercices par jour dans la vue résumée

## Utilisation

### Accéder à l'attribution d'exercices
1. Aller à la page des programmes (`/programmes`)
2. Cliquer sur le bouton avec l'icône d'haltère à côté d'un programme

### Attribuer des exercices à un jour
1. Sélectionner le jour dans le menu déroulant
2. Utiliser la banque d'exercices ou la recherche pour trouver des exercices
3. Cliquer sur le bouton "Ajouter" pour attribuer un exercice au jour sélectionné

### Supprimer des exercices d'un jour
1. Sélectionner le jour contenant l'exercice
2. Cliquer sur le bouton de suppression à côté de l'exercice à retirer

## Détails techniques

### Services
- `programService.updateProgramExercises()`: Met à jour tous les exercices d'un programme
- `bankExercisesService`: Service dédié à la gestion de la banque d'exercices

### SQL
Un script SQL (`create_banque_exercices.sql`) est fourni pour créer la table `banque_exercices` et configurer les permissions appropriées.

## Installation

1. Exécuter le script SQL `create_banque_exercices.sql` dans la console Supabase pour créer la table nécessaire
2. Exécuter la fonction SQL `import_exercices_to_banque()` pour peupler la banque d'exercices avec les exercices existants

# Solution au problème d'ajout d'exercices dans le backoffice Mo Hero

## Problème initial

Le backoffice Mo Hero rencontrait un problème lors de l'ajout d'exercices aux programmes d'entraînement: l'ajout fonctionnait correctement pour le jour 1 mais échouait pour les autres jours du programme.

### Causes identifiées

Après analyse approfondie du code source, plusieurs causes ont été identifiées:

1. **Gestion incomplète des jours**: Les jours n'étaient pas systématiquement créés pour tous les programmes.
   
2. **Vérification insuffisante des IDs de jour**: Lors de l'ajout d'exercices, le service ne validait pas correctement si le jour existait.
   
3. **Structure des données incohérente**: Certains jours pouvaient exister dans la table `jours` mais n'étaient pas associés correctement aux exercices.
   
4. **Absence de mécanisme de récupération**: Lorsqu'un problème était rencontré, l'application ne proposait pas de solution alternative.

## Solutions implémentées

### 1. Amélioration du service `exerciceService.ts`

- Ajout de logs détaillés pour faciliter le diagnostic
- Amélioration de la validation des IDs de jour
- Création de méthodes dédiées pour vérifier l'existence des jours
- Implémentation d'un mécanisme pour copier la structure des exercices qui fonctionnent (jour 1) vers les autres jours

```typescript
// Exemple: Trouver un jour qui a déjà des exercices fonctionnels
findWorkingDay: async (programId: string, currentJourId: string) => {
  try {
    // Obtenir tous les jours du programme
    const { data: jours } = await supabase
      .from('jours')
      .select('id, numero_jour')
      .eq('programme_id', programId)
      .order('numero_jour', { ascending: true });
      
    // Pour chaque jour, vérifier s'il a des exercices
    for (const jour of jours) {
      // Ne pas vérifier le jour en cours
      if (jour.id === currentJourId) continue;
      
      const { data: exercices } = await supabase
        .from('exercices')
        .select('id')
        .eq('jour_id', jour.id)
        .limit(1);
        
      if (exercices && exercices.length > 0) {
        return { found: true, jourId: jour.id, numero_jour: jour.numero_jour };
      }
    }
    
    return { found: false, error: 'Aucun jour avec exercices trouvé' };
  } catch (error) {
    return { found: false, error };
  }
}
```

### 2. Amélioration du composant `ExerciseAddModal.tsx`

- Ajout d'un diagnostic avancé des problèmes
- Création d'un mécanisme de fallback automatique
- Connexion plus intelligente avec le service d'exercices
- Meilleure gestion des erreurs avec information claire à l'utilisateur

```typescript
// Diagnostic et réparation automatique
const runAutomaticRepair = async (programId: string) => {
  try {
    // 1. Vérifier si le jour existe réellement
    const { exists } = await exerciceService.verifyJourExists(jourId);
    
    if (!exists) {
      // Créer le jour manquant si nécessaire
      // ...
    }
    
    // 2. Vérifier si d'autres jours ont des exercices
    const { found, jourId: workingJourId } = 
      await exerciceService.findWorkingDay(programId, jourId);
    
    if (found) {
      return { fixed: true, message: `Un jour fonctionnel a été identifié` };
    }
    
    // 3. Créer un exercice test si nécessaire
    // ...
  } catch (err) {
    return { fixed: false, message: "Erreur lors du diagnostic" };
  }
}
```

### 3. Refonte du composant `ProgramExerciseManager.tsx`

- Ajout d'une navigation paginée entre les jours
- Implémentation d'une barre de progression
- Accès rapide à tous les jours avec raccourcis
- Vérification automatique et création des jours manquants
- Interface utilisateur plus intuitive et moderne

```typescript
// Vérifier et créer les jours manquants
const joursExistants = new Set(joursData.map(jour => jour.numero_jour));
const joursManquants = [];

// Trouver les jours manquants
for (let i = 1; i <= programDuration; i++) {
  if (!joursExistants.has(i)) {
    joursManquants.push({
      programme_id: programId,
      numero_jour: i
    });
  }
}

// Créer les jours manquants si nécessaire
if (joursManquants.length > 0) {
  const { data: newJours } = await supabase
    .from('jours')
    .insert(joursManquants)
    .select('id, numero_jour, programme_id');
    
  // Fusionner avec les jours existants
  if (newJours) {
    joursData.push(...newJours);
    joursData.sort((a, b) => a.numero_jour - b.numero_jour);
  }
}
```

### 4. Amélioration de la page `ProgramDaysPage.tsx`

- Interface dédiée à la gestion des jours
- Possibilité d'ajouter des jours spécifiques
- Option pour créer automatiquement tous les jours
- Visualisation claire des jours existants

## Résultat

Ces améliorations ont permis de résoudre le problème initial et d'offrir une expérience utilisateur bien plus fluide :

1. Les exercices peuvent maintenant être ajoutés à tous les jours d'un programme, pas seulement au jour 1.
2. L'interface est plus robuste et informe clairement l'utilisateur en cas de problème.
3. Le diagnostic automatique permet de corriger les problèmes de structure sans intervention manuelle.
4. La navigation entre les jours est plus intuitive avec la pagination et les raccourcis.

Cette résolution démontre l'importance d'une gestion cohérente des données et d'une interface utilisateur bien pensée pour garantir une expérience optimale dans un backoffice. 