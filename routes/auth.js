const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();

// Clé secrète pour signer les "bracelets" JWT chargée depuis le .env
const JWT_SECRET = process.env.JWT_SECRET; 

// POST /api/auth/login : Se connecter

router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ erreur: "Veuillez fournir un email et un mot de passe." });
    }

    // 1. Chercher l'utilisateur dans la base de données
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err) return res.status(500).json({ erreur: "Erreur serveur" });
        
        // Si aucun utilisateur n'a cet email
        if (results.length === 0) {
            return res.status(401).json({ erreur: "Email ou mot de passe incorrect." });
        }

        const user = results[0];

        // 2. Comparer le mot de passe tapé avec le hachage dans la BDD
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ erreur: "Email ou mot de passe incorrect." });
        }

        // 3. Générer le Token JWT (le "bracelet VIP")
        // On y glisse l'ID et le rôle pour les réutiliser plus tard
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: "24h" } // Expire dans 24 heures
        );

        // 4. On renvoie le token au client
        res.status(200).json({
            message: "Connexion réussie !",
            token: token,
            user: {
                id: user.id,
                nom: user.nom,
                prenom: user.prenom,
                role: user.role
            }
        });
    });
});

module.exports = router;
