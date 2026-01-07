#!/bin/bash
echo "Importing restaurants data..."
mongoimport --host localhost --db orium_agence_scrapper_nosql --collection restaurants --type json --file /data/restaurants.json --jsonArray --drop
if [ $? -eq 0 ]; then
  echo "Import finished successfully."
else
  echo "Import failed!"
  exit 1
fi
