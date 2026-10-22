const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware pour vérifier si l'utilisateur possède un Token valide
const verifierToken = (req, res, next) => {
    // Le token est généralement envoyé dans le header "Authorization"
    const authHeader = req.headers["authorization"];
    
    if (!authHeader) {
        return res.status(403).json({ erreur: "Accès refusé. Aucun token fourni." });
    }

    // Le format est souvent "Bearer TOKEN_ICI", on le découpe pour ne garder que le token
    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(403).json({ erreur: "Format du token invalide." });
    }

    // Vérification de la validité du token
    jwt.verify(token, JWT_SECRET, (err, userDecode) => {
        if (err) {
            return res.status(401).json({ erreur: "Token invalide ou expiré. Veuillez vous reconnecter." });
        }

        // Si c'est valide, on stocke les infos de l'utilisateur (id, role) dans "req.user"
        // pour que la route qui suit puisse les utiliser !
        req.user = userDecode;
        next(); // On laisse passer l'utilisateur !
    });
};

module.exports = { verifierToken };
