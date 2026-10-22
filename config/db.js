const mysql = require("mysql2");
require("dotenv").config(); // Permet d'utiliser un fichier .env plus tard pour la sécurité

// Création de la connexion à la base de données 
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Établir la connexion
db.connect((err) => {
    if (err) {
        console.error("🚨 DÉTAIL DE L'ERREUR MYSQL :", err);
        return;
    }
    console.log("Connecté à MySQL avec succès !");
});

// Exporter l'objet db pour l'utiliser dans nos routes/models
module.exports = db;
