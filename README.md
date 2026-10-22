# 📚 livresgourmands.net - API Backend (Étape 02)


## 📋 Présentation du projet

Ce projet est l'API RESTful backend pour la boutique en ligne **livresgourmands.net**, spécialisée dans la vente de livres de cuisine. L'API permet la gestion complète d'un site e-commerce : catalogue de livres, paniers, commandes sécurisées (transactions SQL), gestion des utilisateurs avec authentification (JWT), avis, commentaires modérés, et listes de cadeaux.

## 👥 Équipe et répartition des tâches

- **Ayman Samlali** 
- **El Mehdi Mouftakhir** 
## 🛠️ Instructions d'installation et d'exécution (Local)

### 1. Prérequis

- Node.js installé
- XAMPP 

### 2. Base de données

1. Allumez votre serveur MySQL via XAMPP.
2. Ouvrez **phpMyAdmin**.
3. Créez une nouvelle base de données nommée `livresgourmands_db`.
4. Importez le fichier `database/schema.sql` fourni à la racine de ce dépôt pour créer toutes les tables.

### 3. Configuration du Backend

1. Ouvrez un terminal dans le dossier du projet.
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. _Note:_ La connexion MySQL est configurée dans `config/db.js`. Modifiez le port (ex: 3306, 3307 ou 8889) ou le mot de passe selon votre environnement (XAMPP/MAMP).
4. Lancez le serveur en mode développement (Nodemon) :
   ```bash
   npm run dev
   ```
5. L'API sera accessible sur : `http://localhost:3000`

---

## 🚀 Endpoints disponibles et documentation

_(⚠️ Les routes marquées d'un cadenas 🔒 nécessitent un Token JWT dans l'en-tête `Authorization: Bearer <token>`)_

### Authentification & Utilisateurs

- `POST /api/auth/login` : Connexion et récupération du JWT.
- `POST /api/users` : Inscription d'un nouvel utilisateur (Mot de passe haché avec bcrypt).
- `GET /api/users` : Liste des utilisateurs.
- `PUT /api/users/:id` : 🔒 Modifier son profil.
- `DELETE /api/users/:id` : 🔒 Supprimer un compte.

### Catalogue (Catégories & Ouvrages)

- `GET /api/categories` : Liste des catégories.
- `POST /api/categories` : 🔒 Créer une catégorie (Éditeur/Gestionnaire).
- `GET /api/ouvrages` : Liste des livres (Règle métier : n'affiche que ceux avec `stock > 0`).
- `POST /api/ouvrages` : 🔒 Ajouter un livre au catalogue.

### Paniers & Commandes

- `GET /api/panier` : 🔒 Voir son panier actif.
- `POST /api/panier/items` : 🔒 Ajouter un livre à son panier.
- `POST /api/commandes` : 🔒 Valider le panier. **(Exécute une transaction SQL, décrémente le stock et renvoie une URL de paiement).**

### Interactions (Avis & Commentaires)

- `POST /api/ouvrages/:id/avis` : 🔒 Laisser une note de 1 à 5. (Règle métier : le client doit avoir acheté le livre).
- `POST /api/ouvrages/:id/commentaires` : 🔒 Soumettre un texte. (Règle métier : `valide=false` par défaut).
- `PUT /api/commentaires/:id/valider` : 🔒 Approuver un commentaire (Seulement Rôle: Éditeur).

### Listes de Cadeaux

- `POST /api/listes` : 🔒 Créer une nouvelle liste (génère un `code_partage`).
- `GET /api/listes/:code` : Consulter la liste de cadeaux d'un ami via son code secret.

---

## Exemple de requête (Postman / cURL)

**Exemple : Ajouter un livre au panier (POST)**

```json
// URL: http://localhost:3000/api/panier/items
// Header: Authorization: Bearer eyJhbGci...
// Body (JSON):
{
  "ouvrage_id": 1,
  "quantite": 2
}
```
