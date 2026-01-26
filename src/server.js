const express = require("express");
const dotenv = require("dotenv");
const db = require("./db/db-postgres");
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Remarque : frontend statique hérité supprimé. Le frontend est servi séparément (ex. serveur dev Vite ou client compilé).

// Configuration CORS
const cors = require('cors');
if (process.env.CORS_ALLOW_ALL === 'true') {
	app.use(cors());
} else if (process.env.CORS_ALLOWED_ORIGINS) {
	const origins = process.env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim());
	app.use(cors({ origin: function(origin, cb) {
		if (!origin) return cb(null, true);
		if (origins.indexOf(origin) !== -1) return cb(null, true);
		cb(new Error('Origin not allowed by CORS'));
	}}));
} else {
	app.use(cors());
}

// Limitateur de débit (global)
const { defaultLimiter } = require('./middlewares/rateLimiter');
app.use(defaultLimiter);

// Swagger UI (base definition, à compléter selon les routes)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// Montage des routes
const userRoutes = require("./routes/users.routes");
app.use("/api/users", userRoutes);

const restaurantsRoutes = require("./routes/restaurants.routes");
app.use("/api/restaurants", restaurantsRoutes);
// Routes d'authentification
const authRoutes = require('./routes/auth.routes');
app.use('/auth', authRoutes);
// Routes utilisateur-restaurants (lier les utilisateurs Postgres aux restaurants Mongo)
const userRestaurantsRoutes = require('./routes/userRestaurants.routes');
app.use('/api/user-restaurants', userRestaurantsRoutes);

// Point de santé / statut
app.get("/api/status", (req, res) => {
	res.json({ status: "ok", time: new Date().toISOString() });
});

// Health check endpoint for Kubernetes probes
app.get("/health", async (req, res) => {
	try {
		// Vérification de base : l'application répond
		const healthStatus = {
			status: "healthy",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			checks: {}
		};

		// Vérification optionnelle de la connexion PostgreSQL
		try {
			const pgOk = await db.testConnection();
			healthStatus.checks.postgres = pgOk ? "ok" : "unavailable";
		} catch (err) {
			healthStatus.checks.postgres = "error";
		}

		// Vérification optionnelle de la connexion MongoDB
		try {
			if (mongoose.connection.readyState === 1) {
				healthStatus.checks.mongodb = "ok";
			} else {
				healthStatus.checks.mongodb = "unavailable";
			}
		} catch (err) {
			healthStatus.checks.mongodb = "error";
		}

		// Retourner 200 si l'application est en vie (même si les DBs sont down)
		res.status(200).json(healthStatus);
	} catch (err) {
		// En cas d'erreur critique, retourner 500
		res.status(500).json({ 
			status: "unhealthy", 
			error: err.message,
			timestamp: new Date().toISOString()
		});
	}
});

// 404
app.use((req, res) => res.status(404).json({ error: "Route inconnue" }));

// Gestionnaire d'erreurs (logge l'erreur complète hors production pour faciliter le debug)
app.use((err, req, res, next) => {
	console.error('Erreur serveur:', err);
	const isProd = process.env.NODE_ENV === 'production';
	if (!isProd) {
		return res.status(500).json({ error: err.message || 'Erreur interne serveur', stack: err.stack });
	}
	return res.status(500).json({ error: 'Erreur interne serveur' });
});

// Gestionnaires globaux pour erreurs inattendues afin d'aider le debug en développement
process.on('unhandledRejection', (reason) => {
	console.error('Unhandled Rejection at:', reason);
});
process.on('uncaughtException', (err) => {
	console.error('Uncaught Exception:', err);
});

// Teste la connexion à la BD au démarrage (non bloquant)
(async () => {
	const ok = await db.testConnection();
	if (ok) console.log('Connected to Postgres');
	else console.log('Postgres not connected (check DATABASE_URL)');
})();

// Se connecte à MongoDB si MONGO_URI est fourni
if (process.env.MONGO_URI) {
	mongoose.connect(process.env.MONGO_URI)
		.then(() => console.log('Connected to MongoDB'))
		.catch(err => console.error('MongoDB connection error:', err.message));
} else {
	console.warn('MONGO_URI not set in environment; MongoDB features will fail');
}

// Démarre le serveur seulement si ce fichier est exécuté directement (node src/server.js)
// Cela empêche des tests qui font `require('./src/server')` d'ouvrir un serveur TCP à l'écoute
if (require.main === module) {
	app.listen(PORT, () => console.log(`API prête sur http://localhost:${PORT}`));
}

module.exports = app;