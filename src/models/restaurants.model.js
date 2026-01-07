const mongoose = require('mongoose');

const { Schema } = mongoose;


// On définit le schéma de la collection. La collection Mongo utilisée par l'application
// s'appelle `orium_agence_scrapper_nosql`, on la fixe explicitement pour éviter
// les confusions entre différentes bases/collections (voir issue recent).
const RestaurantSchema = new Schema({
    title: {type : String, required: true},
    address: {type: String, required: true},
    website: {type: String},
    phone: {type: String},
    latitude: {type: Number, required: true},
    longitude: {type: Number, required: true},
    rating: {type: Number, required: true},
    reviews: {type: Number, required: true},
    type: {type: String, required: true},
    price: {type: String},
    thumbnail: {type: String, required: true},
    description: {type: String},
    openState: {type: String},
    serviceOptions: {type: [String]},
    keyword: {type: [String], required: true},
    googleMapsRank: {type: Number},
    dataId: {type: String, required: true},
    placeId: {type: String, required: true},
    mainEmail: {type: String},
    otherEmails: {type: [String]}
}, { collection: 'restaurants' });

module.exports = mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);

