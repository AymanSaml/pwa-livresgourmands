const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifierToken } = require("../middlewares/authMiddleware"); // On importe notre "videur"

// GET /api/categories : Voir toutes les catégories (Public)

router.get("/", (req, res) => {
    db.query("SELECT * FROM categories", (err, results) => {
        if (err) return res.status(500).json({ erreur: "Erreur serveur" });
        res.status(200).json(results);
    });
});

// POST /api/categories : Créer une catégorie (Protégé par Token !)

router.post("/", verifierToken, (req, res) => {
    
    const { nom, description } = req.body;
    
    if (!nom) return res.status(400).json({ erreur: "Le nom de la catégorie est obligatoire." });

    db.query("INSERT INTO categories (nom, description) VALUES (?, ?)", [nom, description], (err, result) => {
        if (err) {
            console.error("Erreur ajout catégorie :", err);
            return res.status(500).json({ erreur: "Erreur serveur." });
        }
        res.status(201).json({ message: "Catégorie créée avec succès !", id: result.insertId });
    });
});

// PUT et DELETE protégés de la même façon :
router.delete("/:id", verifierToken, (req, res) => {
    db.query("DELETE FROM categories WHERE id=?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ erreur: "Erreur serveur" });
        res.status(200).json({ message: "Catégorie supprimée" });
    });
});

module.exports = router;
