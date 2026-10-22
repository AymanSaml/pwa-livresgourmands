const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifierToken } = require("../middlewares/authMiddleware");

// POST /api/commandes : Valider le panier et créer la commande
router.post("/", verifierToken, async (req, res) => {
    const clientId = req.user.id;
    const { adresse_livraison, mode_paiement } = req.body;

    if (!adresse_livraison || !mode_paiement) {
        return res.status(400).json({ erreur: "Veuillez fournir adresse_livraison et mode_paiement." });
    }

    //  On utilise la version "Promesse" de mysql2 pour faire une TRANSACTION SQL
    const promiseDb = db.promise();

    try {
        // 1. Début de la Transaction 
        await promiseDb.query("START TRANSACTION");

        // 2. Vérifier s'il y a un panier actif
        const [panierRes] = await promiseDb.query("SELECT id FROM panier WHERE client_id = ? AND actif = true", [clientId]);
        if (panierRes.length === 0) {
            await promiseDb.query("ROLLBACK"); // Annulation
            return res.status(400).json({ erreur: "Aucun panier actif trouvé." });
        }
        const panierId = panierRes[0].id;

        // 3. Récupérer les articles
        const [items] = await promiseDb.query("SELECT ouvrage_id, quantite, prix_unitaire FROM panier_items WHERE panier_id = ?", [panierId]);
        if (items.length === 0) {
            await promiseDb.query("ROLLBACK");
            return res.status(400).json({ erreur: "Votre panier est vide." });
        }

        let totalCommande = 0;

        // 4. Vérifier les stocks pour CHAQUE article
        for (let item of items) {
            totalCommande += item.quantite * parseFloat(item.prix_unitaire);

            // Le "FOR UPDATE" bloque temporairement la ligne pour éviter qu'un autre client achète le dernier livre en même temps
            const [stockRes] = await promiseDb.query("SELECT stock, titre FROM ouvrages WHERE id = ? FOR UPDATE", [item.ouvrage_id]);
            
            if (stockRes[0].stock < item.quantite) {
                await promiseDb.query("ROLLBACK"); // Annulation de tout !
                return res.status(400).json({ erreur: `Stock insuffisant pour le livre : ${stockRes[0].titre}` });
            }
        }

        // 5. Créer la ligne de Commande
        const [insertCmd] = await promiseDb.query(
            "INSERT INTO commandes (client_id, total, adresse_livraison, mode_paiement) VALUES (?, ?, ?, ?)",
            [clientId, totalCommande, adresse_livraison, mode_paiement]
        );
        const commandeId = insertCmd.insertId;

        // 6. Transférer les articles et décrémenter le vrai stock
        for (let item of items) {
            // Sauvegarder l'article dans la commande
            await promiseDb.query(
                "INSERT INTO commande_items (commande_id, ouvrage_id, quantite, prix_unitaire) VALUES (?, ?, ?, ?)",
                [commandeId, item.ouvrage_id, item.quantite, item.prix_unitaire]
            );
            
            // Décrémenter le stock dans la base !!
            await promiseDb.query("UPDATE ouvrages SET stock = stock - ? WHERE id = ?", [item.quantite, item.ouvrage_id]);
        }

        // 7. Clôturer le panier (il n'est plus actif)
        await promiseDb.query("UPDATE panier SET actif = false WHERE id = ?", [panierId]);

        // 8. Succès total ! On valide les requêtes dans la BDD
        await promiseDb.query("COMMIT");

        // Renvoyer la réponse demandée par le prof (URL de simulation)
        res.status(201).json({
            message: "Commande validée avec succès !",
            commande_id: commandeId,
            total_paye: totalCommande,
            statut: "en_cours",
            url_paiement: `https://paiement-simule.livresgourmands.net/checkout/${commandeId}`
        });

    } catch (error) {
        // En cas de bug serveur, on annule toutes les requêtes SQL en cours
        await promiseDb.query("ROLLBACK");
        console.error("Erreur critique (Transaction annulée) :", error);
        res.status(500).json({ erreur: "Erreur serveur, la commande a été annulée." });
    }
});

module.exports = router;
