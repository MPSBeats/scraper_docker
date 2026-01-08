const request = require("supertest");
const app = require("../src/app.js");
const mongoose = require("mongoose");
const MongoMemoryServer = require("mongodb-memory-server").MongoMemoryServer;

let mongoServer;
let accessToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  // Setup Postgres for auth
  const db = require("../src/db/db-postgres");
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM roles');
  await db.query("INSERT INTO roles(name) VALUES ($1)", ['user']);
  const r = await db.query("SELECT id FROM roles WHERE name = $1", ['user']);
  const roleId = r.rows[0].id;

  // Create user and login
  await request(app).post('/api/users').send({
    lastname: 'Test', firstname: 'User', email: 'test@example.com', password: 'password', role_id: roleId
  });
  const res = await request(app).post('/auth/login').send({
    email: 'test@example.com', password: 'password'
  });
  accessToken = res.body.accessToken;

  await mongoose.connection.dropDatabase();
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  await mongoose.connection.close();
});
test("POST /api/restaurants => 201", async () => {
  // Crée un nouveau restaurant
  const res = await request(app)
    .post("/api/restaurants")
    .send({
      title: "Monalisa",
      address: "54 Rue du Val, 77160 Provins, France",
      website: "http://monalisa-provins.fr/",
      phone: "+33 1 60 58 10 83",
      latitude: 48.5609513,
      longitude: 3.2960427,
      rating: 4.6,
      reviews: 122,
      type: "Italian restaurant",
      price: "$$",
      thumbnail:
        "https://lh3.googleusercontent.com/gps-cs-s/AG0ilSzk8hLzWUOMPke3_wgru5sTD0vQVONH3UkgC3eLqWC4KINqIrtrWgA0A2CPLFeYsSiXhuPVjzTtibsmwU3ON3pOq0gQ7KyHnuHRvWcfbheI8CJGvk_XArTCwEEtCTo_QrBIkY4r=w163-h92-k-no",
      description:
        "Restaurant italien convivial au cœur de Provins, offrant une cuisine authentique et un service chaleureux.",
      openState: "Open",
      serviceOptions: ["Dine-in", "Takeout", "Delivery"],
      keyword: ["Italian", "Pasta", "Pizza"],
      googleMapsRank: 32.0,
      dataId: "0x47ef31e9e31022d1:0x9e53a000454a5329",
      placeId: "ChIJ0SIQ4-kx70cRKVNKRQCgU54",
      mainEmail: "contact@monalisa-provins.fr",
      otherEmails: ["info@monalisa-provins.fr", "support@monalisa-provins.fr"],
    });

  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty("title", "Monalisa");
  expect(res.body).toHaveProperty(
    "address",
    "54 Rue du Val, 77160 Provins, France"
  );
  expect(res.body).toHaveProperty("website", "http://monalisa-provins.fr/");
  expect(res.body).toHaveProperty("phone", "+33 1 60 58 10 83");
  expect(res.body).toHaveProperty("latitude", 48.5609513);
  expect(res.body).toHaveProperty("longitude", 3.2960427);
  expect(res.body).toHaveProperty("rating", 4.6);
  expect(res.body).toHaveProperty("reviews", 122);
  expect(res.body).toHaveProperty("type", "Italian restaurant");
  expect(res.body).toHaveProperty("price", "$$");
  expect(res.body).toHaveProperty(
    "thumbnail",
    "https://lh3.googleusercontent.com/gps-cs-s/AG0ilSzk8hLzWUOMPke3_wgru5sTD0vQVONH3UkgC3eLqWC4KINqIrtrWgA0A2CPLFeYsSiXhuPVjzTtibsmwU3ON3pOq0gQ7KyHnuHRvWcfbheI8CJGvk_XArTCwEEtCTo_QrBIkY4r=w163-h92-k-no"
  );
  expect(res.body).toHaveProperty(
    "description",
    "Restaurant italien convivial au cœur de Provins, offrant une cuisine authentique et un service chaleureux."
  );
  expect(res.body).toHaveProperty("openState", "Open");
  expect(res.body).toHaveProperty("serviceOptions", [
    "Dine-in",
    "Takeout",
    "Delivery",
  ]);
  expect(res.body).toHaveProperty("keyword", ["Italian", "Pasta", "Pizza"]);
  expect(res.body).toHaveProperty("googleMapsRank", 32.0);
  expect(res.body).toHaveProperty(
    "dataId",
    "0x47ef31e9e31022d1:0x9e53a000454a5329"
  );
  expect(res.body).toHaveProperty("placeId", "ChIJ0SIQ4-kx70cRKVNKRQCgU54");
  expect(res.body).toHaveProperty("mainEmail", "contact@monalisa-provins.fr");
  expect(res.body).toHaveProperty("otherEmails", [
    "info@monalisa-provins.fr",
    "support@monalisa-provins.fr",
  ]);
});

test("GET /api/restaurants => 200", async () => {
  // Récupère tous les restaurants
  const res = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
  expect(res.body[0]).toHaveProperty("title", "Monalisa");
});

test("GET /api/restaurants/:id => 200", async () => {
  // Récupère un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app).get(`/api/restaurants/${restaurantId}`).set('Authorization', `Bearer ${accessToken}`);
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("title", "Monalisa");
});

test("GET /api/restaurants/type/:type => 200", async () => {
  // Récupère les restaurants par type
  const res = await request(app).get(
    "/api/restaurants/type/Italian restaurant"
  ).set('Authorization', `Bearer ${accessToken}`);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
  expect(res.body[0]).toHaveProperty("type", "Italian restaurant");
});

test("GET /api/restaurants/rating/min/:minRating => 200", async () => {
  // Récupère les restaurants par note minimale
  const res = await request(app).get("/api/restaurants/rating/min/4.0").set('Authorization', `Bearer ${accessToken}`);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
  expect(res.body[0]).toHaveProperty("rating");
  expect(res.body[0].rating).toBeGreaterThanOrEqual(4.0);
});

test("GET /api/restaurants/rating/max/:maxRating => 200", async () => {
  // Récupère les restaurants par note maximale
  const res = await request(app).get("/api/restaurants/rating/max/5.0").set('Authorization', `Bearer ${accessToken}`);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
  expect(res.body[0]).toHaveProperty("rating");
  expect(res.body[0].rating).toBeLessThanOrEqual(5.0);
});

test("GET /api/restaurants/reviews/min/:minReviews => 200", async () => {
  // Récupère les restaurants par nombre minimal d'avis
  const res = await request(app).get("/api/restaurants/reviews/min/100").set('Authorization', `Bearer ${accessToken}`);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
  expect(res.body[0]).toHaveProperty("reviews");
  expect(res.body[0].reviews).toBeGreaterThanOrEqual(100);
});

test("GET /api/restaurants/reviews/max/:maxReviews => 200", async () => {
  // Récupère les restaurants par nombre maximal d'avis
  const res = await request(app).get("/api/restaurants/reviews/max/200").set('Authorization', `Bearer ${accessToken}`);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
  expect(res.body[0]).toHaveProperty("reviews");
  expect(res.body[0].reviews).toBeLessThanOrEqual(200);
});

test("GET /api/restaurants/GoogleMapsRank/:rank => 200", async () => {
  // Récupère les restaurants par classement Google Maps
  const res = await request(app).get("/api/restaurants/GoogleMapsRank/32").set('Authorization', `Bearer ${accessToken}`);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
  expect(res.body[0]).toHaveProperty("googleMapsRank", 32);
});

test("GET /api/restaurants/serviceOptions/:option => 200", async () => {
  // Récupère les restaurants par option de service
  const res = await request(app).get("/api/restaurants/serviceOptions/Takeout").set('Authorization', `Bearer ${accessToken}`);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
  expect(res.body[0]).toHaveProperty("serviceOptions");
  expect(res.body[0].serviceOptions).toContain("Takeout");
});

test("PUT /api/restaurants/:id => 200", async () => {
  // Met à jour un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .put(`/api/restaurants/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      title: "Monalisa Updated",
      address: "54 Rue du Val, 77160 Provins, France",
      website: "http://monalisa-provins.fr/",
      phone: "+33 1 60 58 10 83",
      latitude: 48.5609513,
      longitude: 3.2960427,
      rating: 4.7,
      reviews: 130,
      type: "Italian restaurant",
      price: "$$",
      thumbnail:
        "https://lh3.googleusercontent.com/gps-cs-s/AG0ilSzk8hLzWUOMPke3_wgru5sTD0vQVONH3UkgC3eLqWC4KINqIrtrWgA0A2CPLFeYsSiXhuPVjzTtibsmwU3ON3pOq0gQ7KyHnuHRvWcfbheI8CJGvk_XArTCwEEtCTo_QrBIkY4r=w163-h92-k-no",
      description:
        "Restaurant italien convivial au cœur de Provins, offrant une cuisine authentique et un service chaleureux.",
      openState: "Open",
      serviceOptions: ["Dine-in", "Takeout", "Delivery"],
      keyword: ["Italian", "Pasta", "Pizza"],
      googleMapsRank: 32.0,
      dataId: "0x47ef31e9e31022d1:0x9e53a000454a5329",
      placeId: "ChIJ0SIQ4-kx70cRKVNKRQCgU54",
      mainEmail: "monalisa@provins.fr",
      otherEmails: ["info@monalisa-provins.fr", "contact@monalisa-provins.fr"],
    });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("title", "Monalisa Updated");
  expect(res.body).toHaveProperty("rating", 4.7);
  expect(res.body).toHaveProperty("reviews", 130);
  expect(res.body).toHaveProperty("mainEmail", "monalisa@provins.fr");
  expect(res.body).toHaveProperty("otherEmails", [
    "info@monalisa-provins.fr",
    "contact@monalisa-provins.fr",
  ]);
});

test("PATCH /api/restaurants/title/:id => 200", async () => {
  // Met à jour le titre d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/title/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ title: "Monalisa Patched" });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("title", "Monalisa Patched");
});

test("PATCH /api/restaurants/address/:id => 200", async () => {
  // Met à jour l'adresse d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/address/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ address: "New Address, 77160 Provins, France" });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty(
    "address",
    "New Address, 77160 Provins, France"
  );
});

test("PATCH /api/restaurants/website/:id => 200", async () => {
  // Met à jour le site web d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/website/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ website: "http://new-website.com" });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("website", "http://new-website.com");
});

test("PATCH /api/restaurants/phone/:id => 200", async () => {
  // Met à jour le téléphone d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/phone/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ phone: "+33 1 23 45 67 89" });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("phone", "+33 1 23 45 67 89");
});

test("PATCH /api/restaurants/latitude/:id => 200", async () => {
  // Met à jour la latitude d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/latitude/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ latitude: 48.123456 });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("latitude", 48.123456);
});

test("PATCH /api/restaurants/longitude/:id => 200", async () => {
  // Met à jour la longitude d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/longitude/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ longitude: 3.654321 });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("longitude", 3.654321);
});

test("PATCH /api/restaurants/rating/:id => 200", async () => {
  // Met à jour la note d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/rating/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ rating: 4.9 });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("rating", 4.9);
});

test("PATCH /api/restaurants/reviews/:id => 200", async () => {
  // Met à jour le nombre d'avis d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/reviews/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ reviews: 150 });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("reviews", 150);
});

test("PATCH /api/restaurants/type/:id => 200", async () => {
  // Met à jour le type d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/type/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ type: "Updated Type" });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("type", "Updated Type");
});

test("PATCH /api/restaurants/price/:id => 200", async () => {
  // Met à jour le prix d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/price/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ price: "$$$" });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("price", "$$$");
});

test("PATCH /api/restaurants/thumbnail/:id => 200", async () => {
  // Met à jour la miniature d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/thumbnail/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ thumbnail: "http://new-thumbnail.com/image.jpg" });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty(
    "thumbnail",
    "http://new-thumbnail.com/image.jpg"
  );
});

test("PATCH /api/restaurants/description/:id => 200", async () => {
  // Met à jour la description d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/description/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ description: "Updated description of the restaurant." });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty(
    "description",
    "Updated description of the restaurant."
  );
});

test("PATCH /api/restaurants/openState/:id => 200", async () => {
  // Met à jour l'état d'ouverture d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/openState/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ openState: "Closed" });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("openState", "Closed");
});

test("PATCH /api/restaurants/serviceOptions/:id => 200", async () => {
  // Met à jour les options de service d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/serviceOptions/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ serviceOptions: ["Dine-in", "Takeout"] });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("serviceOptions", ["Dine-in", "Takeout"]);
});

test("PATCH /api/restaurants/keyword/:id => 200", async () => {
  // Met à jour le mot-clé d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/keyword/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ keyword: ["Updated", "Keywords"] });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("keyword", ["Updated", "Keywords"]);
});

test("PATCH /api/restaurants/googleMapsRank/:id => 200", async () => {
  // Met à jour le classement Google Maps d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/googleMapsRank/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ googleMapsRank: 35.0 });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("googleMapsRank", 35.0);
});

test("PATCH /api/restaurants/dataId/:id => 200", async () => {
  // Met à jour l'ID de données d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/dataId/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ dataId: "newDataId12345" });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("dataId", "newDataId12345");
});

test("PATCH /api/restaurants/placeId/:id => 200", async () => {
  // Met à jour l'ID de lieu d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/placeId/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ placeId: "newPlaceId67890" });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("placeId", "newPlaceId67890");
});

test("PATCH /api/restaurants/mainEmail/:id => 200", async () => {
  // Met à jour l'email principal d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/mainEmail/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ mainEmail: "newemail@example.com" });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("mainEmail", "newemail@example.com");
});

test("PATCH /api/restaurants/otherEmails/:id => 200", async () => {
  // Met à jour les autres emails d'un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app)
    .patch(`/api/restaurants/otherEmails/${restaurantId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ otherEmails: ["newemail1@example.com", "newemail2@example.com"] });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("otherEmails", [
    "newemail1@example.com",
    "newemail2@example.com",
  ]);
});

test("DELETE /api/restaurants/:id => 200", async () => {
  // Supprime un restaurant par ID
  const restaurantsRes = await request(app).get("/api/restaurants").set('Authorization', `Bearer ${accessToken}`);
  const restaurantId = restaurantsRes.body[0]._id;
  const res = await request(app).delete(`/api/restaurants/${restaurantId}`).set('Authorization', `Bearer ${accessToken}`);
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("message", "Restaurant supprimé avec succès");
});
