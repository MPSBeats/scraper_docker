#!/bin/bash
echo "Importing restaurants data..."
mongoimport --host localhost --db orium_agence_scrapper_nosql --collection restaurants --type json --file /data/restaurants.json --jsonArray --drop
echo "Import finished."
