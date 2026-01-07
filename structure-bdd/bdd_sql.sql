CREATE TABLE roles ( /* Table pour les rôles des utilisateurs (administrateurs, éditeurs, lecteurs) */
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE users ( /* Table pour les utilisateurs */
    id SERIAL PRIMARY KEY,
    lastname text NOT NULL,
    firstname text NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_restaurant_status ( /* Table pour enregistrer les status entre utilisateurs et restaurants */
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    restaurant_mongo_id VARCHAR(40) NOT NULL, /* dataId du restaurant */
    status TEXT[] DEFAULT '{}' CHECK (status IS NULL OR status <@ ARRAY['contacté','consulté','favori']::text[]),
    PRIMARY KEY (user_id, restaurant_mongo_id)
);

/* Initial Seed Data */
INSERT INTO roles (name) VALUES ('admin'), ('editor'), ('viewer') ON CONFLICT DO NOTHING;

/* Admin User (Password: password123) - Using BCrypt hash placeholder for example */
/* Note: In production, passwords should be properly hashed. This is a placeholder or dev hash */
INSERT INTO users (lastname, firstname, email, password_hash, role_id) 
VALUES ('Admin', 'User', 'admin@example.com', '$2b$10$YourHashedPasswordHere...', 1) 
ON CONFLICT DO NOTHING;
