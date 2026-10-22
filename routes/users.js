const express = require("express");
const bcrypt = require("bcrypt"); // Importation de bcrypt pour hacher les mots de passe
const router = express.Router();
const db = require("../config/db"); 


// GET /api/users : Lister tous les utilisateurs

router.get("/", (req, res) => {
    db.query("SELECT id, nom, prenom, email, role, actif FROM users", (err, results) => {
        if (err) {
            console.error("Erreur de récupération", err);
            res.status(500).json({ erreur: "Erreur lors de la récupération des utilisateurs" });
        } else {
            res.status(200).json(results);
        }
    });
});


// POST /api/users : Créer un utilisateur (Register)

router.post("/", async (req, res) => {
    // 1. On récupère les données envoyées par le client (Postman/Navigateur)
    const { nom, prenom, email, password, role } = req.body;

    // 2. Vérification que les champs obligatoires sont présents
    if (!nom || !email || !password) {
        return res.status(400).json({ erreur: "Veuillez fournir un nom, email et mot de passe." });
    }

    try {
        // 3. Hachage du mot de passe (10 est la "force" du hachage standard)
        const passwordHash = await bcrypt.hash(password, 10);

        // 4. Rôle par défaut si non précisé
        const userRole = role || 'client';

        // 5. Requête SQL pour insérer
        const query = "INSERT INTO users (nom, prenom, email, password_hash, role) VALUES (?, ?, ?, ?, ?)";
        
        db.query(query, [nom, prenom, email, passwordHash, userRole], (err, result) => {
            if (err) {
                console.error("Erreur lors de l'insertion :", err);
                // Gérer le cas où l'email existe déjà dans la base
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ erreur: "Cet email est déjà utilisé." });
                }
                return res.status(500).json({ erreur: "Erreur serveur lors de la création de l'utilisateur." });
            }

            // 6. Succès ! On renvoie une réponse
            res.status(201).json({
                message: "Utilisateur créé avec succès !",
                userId: result.insertId,
                email: email,
                role: userRole
            });
        });
    } catch (error) {
        console.error("Erreur bcrypt :", error);
        res.status(500).json({ erreur: "Erreur lors du hachage du mot de passe." });
    }
});


// PUT /api/users/:id : Modifier un utilisateur existant

router.put("/:id", (req, res) => {
    const userId = req.params.id; // On récupère l'ID dans l'URL
    const { nom, prenom, email } = req.body;

    // Requête SQL 
    const query = "UPDATE users SET nom=?, prenom=?, email=? WHERE id=?";
    
    db.query(query, [nom, prenom, email, userId], (err, result) => {
        if (err) {
            console.error("Erreur de modification :", err);
            return res.status(500).json({ erreur: "Erreur lors de la modification" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ erreur: "Utilisateur introuvable" });
        }
        res.status(200).json({ message: "Utilisateur modifié avec succès !" });
    });
});


// DELETE /api/users/:id : Supprimer un utilisateur

router.delete("/:id", (req, res) => {
    const userId = req.params.id; // On récupère l'ID dans l'URL

    // Requête SQL 
    db.query("DELETE FROM users WHERE id=?", [userId], (err, result) => {
        if (err) {
            console.error("Erreur de suppression :", err);
            return res.status(500).json({ erreur: "Erreur lors de la suppression" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ erreur: "Utilisateur introuvable" });
        }
        res.status(200).json({ message: "Utilisateur supprimé avec succès !" });
    });
});

module.exports = router;
