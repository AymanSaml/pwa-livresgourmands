const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifierToken } = require("../middlewares/authMiddleware");

// GET /api/ouvrages : Voir le catalogue

router.get("/", (req, res) => {
    db.query("SELECT * FROM ouvrages WHERE stock > 0", (err, results) => {
        if (err) return res.status(500).json({ erreur: "Erreur serveur" });
        res.status(200).json(results);
    });
});


// POST /api/ouvrages : Ajouter un livre (Protégé par Token)

router.post("/", verifierToken, (req, res) => {
    const { titre, auteur, isbn, description, prix, stock, categorie_id } = req.body;

    // Vérification des données
    if (!titre || !auteur || !isbn || !prix || !categorie_id) {
        return res.status(400).json({ erreur: "Veuillez fournir titre, auteur, isbn, prix et categorie_id." });
    }

    const query = `
        INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    // Par défaut, si on n'envoie pas de stock, on met 0
    db.query(query, [titre, auteur, isbn, description, prix, stock || 0, categorie_id], (err, result) => {
        if (err) {
            console.error("Erreur ajout livre :", err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ erreur: "Un livre avec cet ISBN existe déjà." });
            }
            return res.status(500).json({ erreur: "Erreur serveur." });
        }
        res.status(201).json({ message: "Livre ajouté avec succès !", id: result.insertId });
    });
});


// POST /api/ouvrages/:id/avis : Ajouter un avis (Note sur 5)

router.post("/:id/avis", verifierToken, async (req, res) => {
    const ouvrageId = req.params.id;
    const clientId = req.user.id;
    const { note } = req.body;

    if (!note || note < 1 || note > 5) return res.status(400).json({ erreur: "La note doit être entre 1 et 5." });

    const promiseDb = db.promise();
    try {
        //  REGLE MÉTIER : Vérifier que le client a bien ACHETÉ ce livre avant de le noter
        const [achats] = await promiseDb.query(`
            SELECT c.id FROM commandes c
            JOIN commande_items ci ON c.id = ci.commande_id
            WHERE c.client_id = ? AND ci.ouvrage_id = ?
        `, [clientId, ouvrageId]);

        if (achats.length === 0) {
            return res.status(403).json({ erreur: "Vous devez acheter ce livre pour pouvoir laisser un avis." });
        }

        // Si l'achat est confirmé, on insère l'avis
        await promiseDb.query("INSERT INTO avis (client_id, ouvrage_id, note) VALUES (?, ?, ?)", [clientId, ouvrageId, note]);
        res.status(201).json({ message: "Merci pour votre avis !" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ erreur: "Vous avez déjà noté ce livre." });
        res.status(500).json({ erreur: "Erreur serveur" });
    }
});

// POST /api/ouvrages/:id/commentaires 
router.post("/:id/commentaires", verifierToken, (req, res) => {
    const ouvrageId = req.params.id;
    const clientId = req.user.id;
    const { contenu } = req.body;

    if (!contenu) return res.status(400).json({ erreur: "Le contenu est obligatoire." });

    //  REGLE MÉTIER : 'valide' est à FALSE par défaut (attente de modération)
    db.query("INSERT INTO commentaires (client_id, ouvrage_id, contenu, valide) VALUES (?, ?, ?, false)", 
    [clientId, ouvrageId, contenu], (err) => {
        if (err) return res.status(500).json({ erreur: "Erreur serveur" });
        res.status(201).json({ message: "Commentaire soumis. En attente de validation par un éditeur." });
    });
});

module.exports = router;
