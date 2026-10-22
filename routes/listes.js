const express = require("express");
const router = express.Router();
const db = require("../config/db");
const crypto = require("crypto"); // Pour générer un code aléatoire
const { verifierToken } = require("../middlewares/authMiddleware");

// POST /api/listes : Créer une liste de cadeaux

router.post("/", verifierToken, (req, res) => {
    const clientId = req.user.id;
    const { nom } = req.body;

    if (!nom) return res.status(400).json({ erreur: "Le nom de la liste est obligatoire." });

    // Générer un code de partage unique 
    const codePartage = crypto.randomBytes(4).toString("hex");

    db.query("INSERT INTO listes_cadeaux (nom, proprietaire_id, code_partage) VALUES (?, ?, ?)", 
    [nom, clientId, codePartage], (err, result) => {
        if (err) return res.status(500).json({ erreur: "Erreur serveur" });
        
        res.status(201).json({ 
            message: "Liste créée !", 
            id: result.insertId,
            code_partage: codePartage 
        });
    });
});

// GET /api/listes/:code : Un ami consulte la liste

router.get("/:code", (req, res) => {
    const code = req.params.code;

    // Jointure pour récupérer la liste ET le nom du propriétaire
    const query = `
        SELECT l.id, l.nom as nom_liste, u.nom as nom_createur, l.date_creation 
        FROM listes_cadeaux l
        JOIN users u ON l.proprietaire_id = u.id
        WHERE l.code_partage = ?
    `;

    db.query(query, [code], (err, listResult) => {
        if (err) return res.status(500).json({ erreur: "Erreur serveur" });
        if (listResult.length === 0) return res.status(404).json({ erreur: "Code invalide." });
        res.status(200).json(listResult[0]);
    });
});

module.exports = router;
