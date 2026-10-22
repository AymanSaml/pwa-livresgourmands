const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifierToken } = require("../middlewares/authMiddleware");

// PUT /api/commentaires/:id/valider : L'Editeur valide un commentaire

router.put("/:id/valider", verifierToken, (req, res) => {
    const editeurId = req.user.id;
    const role = req.user.role;
    const commentaireId = req.params.id;

    // Seul un éditeur (ou administrateur) a le droit de valider
    if (role !== 'editeur' && role !== 'administrateur') {
        return res.status(403).json({ erreur: "Accès refusé. Seul un éditeur peut valider un commentaire." });
    }

    const query = "UPDATE commentaires SET valide = true, valide_par = ?, date_validation = NOW() WHERE id = ?";
    db.query(query, [editeurId, commentaireId], (err, result) => {
        if (err) return res.status(500).json({ erreur: "Erreur serveur" });
        if (result.affectedRows === 0) return res.status(404).json({ erreur: "Commentaire introuvable" });
        
        res.status(200).json({ message: "Commentaire validé et publié avec succès !" });
    });
});

module.exports = router;
