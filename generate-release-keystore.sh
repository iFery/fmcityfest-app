#!/bin/bash

# Nastavení parametrů
KEYSTORE_NAME="release.keystore"
ALIAS_NAME="festivalapp"
STORE_PASSWORD="Trubadur9876"
KEY_PASSWORD="Trubadur9876"
VALIDITY_DAYS=10000

echo "⏳ Generování release keystore..."
keytool -genkeypair \
  -v \
  -keystore $KEYSTORE_NAME \
  -alias $ALIAS_NAME \
  -keyalg RSA \
  -keysize 2048 \
  -validity $VALIDITY_DAYS \
  -storepass $STORE_PASSWORD \
  -keypass $KEY_PASSWORD \
  -dname "CN=FM CITY FEST, OU=Development, O=FM CITY, L=Frydek-Mistek, ST=Morava, C=CZ"

echo ""
echo "✅ Hotovo!"
echo "Soubor: $KEYSTORE_NAME"
echo "Alias: $ALIAS_NAME"
echo "Store Password: $STORE_PASSWORD"
echo "Key Password: $KEY_PASSWORD"
