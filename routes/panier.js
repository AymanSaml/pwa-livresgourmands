const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifierToken } = require("../middlewares/authMiddleware");


// GET /api/panier : Voir son panier actif

router.get("/", verifierToken, (req, res) => {
    //  Magie du JWT : on sait qui est l'utilisateur sans lui demander !
    const clientId = req.user.id; 

    db.query("SELECT * FROM panier WHERE client_id = ? AND actif = true", [clientId], (err, panierResult) => {
        if (err) return res.status(500).json({ erreur: "Erreur serveur" });
        
        if (panierResult.length === 0) {
            return res.status(200).json({ message: "Votre panier est vide.", items: [] });
        }

        const panierId = panierResult[0].id;
        
        // On récupère les articles contenus dans ce panier (avec une JOINTURE SQL)
        const queryItems = `
            SELECT pi.id, pi.quantite, pi.prix_unitaire, o.titre 
            FROM panier_items pi
            JOIN ouvrages o ON pi.ouvrage_id = o.id
            WHERE pi.panier_id = ?
        `;
        db.query(queryItems, [panierId], (err, itemsResult) => {
            if (err) return res.status(500).json({ erreur: "Erreur serveur lors de la lecture des articles." });
            res.status(200).json({
                panier_id: panierId,
                total_articles: itemsResult.length,
                items: itemsResult
            });
        });
    });
});


// POST /api/panier/items : Ajouter un livre au panier

router.post("/items", verifierToken, (req, res) => {
    const clientId = req.user.id; // L'ID vient du Token
    const { ouvrage_id, quantite } = req.body;

    if (!ouvrage_id || !quantite) {
        return res.status(400).json({ erreur: "Veuillez fournir ouvrage_id et quantite." });
    }

    // 1. Vérifier le stock de l'ouvrage
    db.query("SELECT prix, stock FROM ouvrages WHERE id = ?", [ouvrage_id], (err, ouvrageResult) => {
        if (err) return res.status(500).json({ erreur: "Erreur serveur" });
        if (ouvrageResult.length === 0) return res.status(404).json({ erreur: "Livre introuvable." });
        
        const livre = ouvrageResult[0];
        if (livre.stock < quantite) {
            return res.status(400).json({ erreur: "Stock insuffisant pour cette quantité." });
        }

        // Fonction locale pour ajouter l'article
        const ajouterArticle = (panierId) => {
            const queryInsertItem = "INSERT INTO panier_items (panier_id, ouvrage_id, quantite, prix_unitaire) VALUES (?, ?, ?, ?)";
            db.query(queryInsertItem, [panierId, ouvrage_id, quantite, livre.prix], (err, result) => {
                if (err) return res.status(500).json({ erreur: "Erreur lors de l'ajout au panier." });
                res.status(201).json({ message: "Livre ajouté au panier avec succès !" });
            });
        };

        // 2. Chercher si le client a un panier actif
        db.query("SELECT id FROM panier WHERE client_id = ? AND actif = true", [clientId], (err, panierResult) => {
            if (err) return res.status(500).json({ erreur: "Erreur serveur" });

            if (panierResult.length > 0) {
                // Un panier existe, on ajoute l'article dedans
                ajouterArticle(panierResult[0].id);
            } else {
                // Aucun panier actif, on le crée !
                db.query("INSERT INTO panier (client_id, actif) VALUES (?, true)", [clientId], (err, insertPanier) => {
                    if (err) return res.status(500).json({ erreur: "Erreur création panier." });
                    ajouterArticle(insertPanier.insertId); // On utilise le nouvel ID du panier
                });
            }
        });
    });
});

module.exports = router;
