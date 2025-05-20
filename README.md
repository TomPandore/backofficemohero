# Backoffice MoHero

Ce backoffice permet la gestion des programmes d'entraînement et des exercices associés pour l'application MoHero.

## Architecture

L'application est construite avec React et TypeScript, utilisant une architecture orientée services avec les principales composantes suivantes :

### Services

- **programService** : Gère les opérations CRUD pour les programmes
- **exerciseService** : Gère les opérations CRUD pour les exercices

### Contextes React

- **ProgramContext** : Fournit un état global et des méthodes pour manipuler les programmes
- **ExerciseContext** : Fournit un état global et des méthodes pour manipuler les exercices

### Pages principales

- **ProgramsPage** : Liste tous les programmes
- **CreateProgramPage** : Permet la création de nouveaux programmes
- **EditProgramPage** : Permet l'édition des programmes existants et la gestion des exercices par jour

## Fonctionnalités

### Gestion des programmes

- Créer, modifier et supprimer des programmes
- Définir les métadonnées des programmes (nom, description, durée, etc.)
- Ajouter des images aux programmes
- Définir les résultats attendus et les tags
- Configurer les phases du programme

### Gestion des exercices

- Créer, modifier et supprimer des exercices
- Assigner des exercices à des jours spécifiques d'un programme
- Rechercher des exercices par nom ou type
- Gérer le calendrier d'exercices d'un programme

## Structure des données

### Programme

```typescript
interface Program {
  id: string;
  name: string;
  description: string;
  duration: number;
  type: 'découverte' | 'premium' | 'premium_clan';
  clan_id: string | null;
  tags: string[];
  results: string[];
  summary: Phase[];
  image_url?: string;
  exercises?: DailyExercises;
  niveau_difficulte?: 'easy' | 'medium' | 'hard';
}

interface DailyExercises {
  [day: number]: string[]; // Liste d'IDs d'exercices pour chaque jour
}
```

### Exercice

```typescript
interface Exercise {
  id: string;
  name: string;
  type: 'push' | 'pull' | 'squat' | 'core' | 'animal_flow' | 'mobilité' | 'respiration';
  level: 1 | 2 | 3;
  zones: string[];
}
```

## Configuration technique

L'application se connecte à une base de données Supabase. La configuration est stockée dans un fichier `.env` à la racine du projet :

```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon
```

## Démarrage

```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev
``` 