require("dotenv").config(); //  Charge les variables du fichier .env
const express = require("express");
const cors = require("cors");
const db = require("./config/db"); // Test de la connexion à la DB au démarrage

const app = express();

// Middlewares globaux
app.use(cors());
// Permet de lire automatiquement le JSON envoyé dans les requêtes
app.use(express.json());

// --- IMPORTATION DES ROUTES ---
const usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const categoriesRouter = require("./routes/categories");
const ouvragesRouter = require("./routes/ouvrages");
const panierRouter = require("./routes/panier");
const commandesRouter = require("./routes/commandes");
const commentairesRouter = require("./routes/commentaires"); 
const listesRouter = require("./routes/listes"); 

// --- UTILISATION DES ROUTES ---
app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/ouvrages", ouvragesRouter);
app.use("/api/panier", panierRouter);
app.use("/api/commandes", commandesRouter);
app.use("/api/commentaires", commentairesRouter); 
app.use("/api/listes", listesRouter); 

// Définir une route de test (Racine)
app.get("/", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.status(200).send("<h1>Bienvenue sur l'API de livresgourmands.net</h1>");
});

// Lancer le serveur avec la variable d'environnement
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
    console.log(`Testez via : http://localhost:${PORT}`);
});
