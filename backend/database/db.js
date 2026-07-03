const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'marketbf.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('client','merchant','admin')),
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT,
      address TEXT,
      latitude REAL DEFAULT 12.3647,
      longitude REAL DEFAULT -1.5337,
      category TEXT DEFAULT 'Général',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','active','rejected')),
      logo_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT DEFAULT 'Général',
      image_url TEXT,
      is_available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 5,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('entry','exit')),
      quantity INTEGER NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES users(id),
      shop_id INTEGER NOT NULL REFERENCES shops(id),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','ready','delivered','cancelled')),
      payment_method TEXT DEFAULT 'cash_on_delivery' CHECK(payment_method IN ('orange_money','moov_money','wave','cash_on_delivery')),
      total_amount REAL NOT NULL,
      notes TEXT,
      delivery_address TEXT,
      delivery_latitude REAL,
      delivery_longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES users(id),
      shop_id INTEGER NOT NULL REFERENCES shops(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(client_id, shop_id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','completed','failed')),
      transaction_ref TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  runMigrations(db);
  seedData(db);
  return db;
}

// Migrations idempotentes pour les bases existantes
function runMigrations(db) {
  const userCols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (!userCols.includes('google_id')) {
    db.exec('ALTER TABLE users ADD COLUMN google_id TEXT');
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL');
  }

  const orderCols = db.prepare('PRAGMA table_info(orders)').all().map((c) => c.name);
  if (!orderCols.includes('delivery_address')) {
    db.exec('ALTER TABLE orders ADD COLUMN delivery_address TEXT');
    db.exec('ALTER TABLE orders ADD COLUMN delivery_latitude REAL');
    db.exec('ALTER TABLE orders ADD COLUMN delivery_longitude REAL');
  }
}

function seedData(db) {
  const existing = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existing.count > 0) return;

  const hash = (pwd) => bcrypt.hashSync(pwd, 10);

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)'
  );

  // Utilisateurs avec numéros Burkina Faso (+226)
  const adminId = insertUser.run('Admin Market BF', 'admin@marketbf.com', hash('Admin123!'), 'admin', '+22620000000').lastInsertRowid;
  const m1Id = insertUser.run('Ouédraogo Issouf', 'merchant1@marketbf.com', hash('Merchant1!'), 'merchant', '+22670111111').lastInsertRowid;
  const m2Id = insertUser.run('Compaoré Aminata', 'merchant2@marketbf.com', hash('Merchant2!'), 'merchant', '+22675222222').lastInsertRowid;
  const c1Id = insertUser.run('Sawadogo Mamadou', 'client@marketbf.com', hash('Client123!'), 'client', '+22660333333').lastInsertRowid;
  insertUser.run('Traoré Rasmata', 'client2@marketbf.com', hash('Client123!'), 'client', '+22665444444');

  const insertShop = db.prepare(
    'INSERT INTO shops (owner_id, name, description, address, latitude, longitude, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  // Boutiques à Ouagadougou
  const shop1Id = insertShop.run(
    m1Id,
    'Épicerie Wend-Kuni',
    'Épicerie traditionnelle burkinabè - produits locaux de qualité',
    'Secteur 15, Hamdallaye, Ouagadougou',
    12.3712, -1.5148,
    'Alimentation', 'active'
  ).lastInsertRowid;

  const shop2Id = insertShop.run(
    m2Id,
    'Boutique Laafi Mode',
    'Vêtements et pagnes traditionnels du Burkina Faso',
    'Avenue Kwame N\'Krumah, Ouaga 2000, Ouagadougou',
    12.3350, -1.5210,
    'Mode & Vêtements', 'active'
  ).lastInsertRowid;

  // Boutique en attente de validation
  insertShop.run(
    m2Id,
    'Pharma Naturelle BF',
    'Produits naturels et plantes médicinales du Sahel',
    'Marché de Zogona, Ouagadougou',
    12.3815, -1.5062,
    'Santé & Beauté', 'pending'
  );

  const insertProduct = db.prepare(
    'INSERT INTO products (shop_id, name, description, price, category, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  // Produits typiques du Burkina Faso - Épicerie
  const products1 = [
    ['Mil local 5kg',          'Mil du Yatenga, récolte fraîche de qualité supérieure',     2500,  'Céréales',            'https://picsum.photos/seed/mil-bf/400/400'],
    ['Sorgho rouge 5kg',       'Sorgho rouge du Sahel, idéal pour le tô et la dolo',        2200,  'Céréales',            'https://picsum.photos/seed/sorgho-bf/400/400'],
    ['Beurre de karité pur 500g','Karité naturel non raffiné de la région de Dédougou',     3500,  'Corps & Beauté',      'https://picsum.photos/seed/karite-bf/400/400'],
    ['Soumbala 200g',           'Condiment traditionnel burkinabè à base de néré',           800,   'Épices & Condiments', 'https://picsum.photos/seed/soumbala-bf/400/400'],
    ['Haricots niébé 2kg',      'Niébé blanc du Burkina, riche en protéines',               1500,  'Légumineuses',        'https://picsum.photos/seed/niebe-bf/400/400'],
    ['Huile de coton 1L',       'Huile végétale pure produite au Burkina Faso',             1200,  'Huiles',              'https://picsum.photos/seed/huile-bf/400/400'],
    ['Maïs séché 5kg',          'Maïs local du Centre-Ouest, idéal pour le tô blanc',       1800,  'Céréales',            'https://picsum.photos/seed/mais-bf/400/400'],
    ['Farine de fonio 1kg',     'Farine de fonio biologique, sans gluten',                  2000,  'Céréales',            'https://picsum.photos/seed/fonio-bf/400/400'],
  ];

  // Produits typiques - Mode & Pagnes
  const products2 = [
    ['Pagne bazin riche bleu royal',   'Bazin riche grade A, 5 mètres, teint local',                   18000, 'Pagnes & Tissus', 'https://picsum.photos/seed/pagne-bazin/400/400'],
    ['Boubou bogolan homme',           'Boubou en bogolan authentique du Mali, taille L',               25000, 'Boubous',         'https://picsum.photos/seed/boubou-bogolan/400/400'],
    ['Robe en wax africain',           'Robe confectionnée en wax hollandais, taille M',                12000, 'Robes',           'https://picsum.photos/seed/robe-wax-bf/400/400'],
    ['Sandales artisanales en cuir',   'Sandales fabriquées à Ouagadougou, cuir de vache',              5500,  'Chaussures',      'https://picsum.photos/seed/sandales-cuir/400/400'],
    ['Sac à main en bogolan',          'Sac artisanal en tissu bogolan, fait main',                     6000,  'Accessoires',     'https://picsum.photos/seed/sac-bogolan/400/400'],
    ['Chapeau de paille traditionnel', 'Chapeau tressé à la main, protection solaire naturelle',        2500,  'Accessoires',     'https://picsum.photos/seed/chapeau-paille/400/400'],
  ];

  const insertStock = db.prepare(
    'INSERT INTO stock (product_id, quantity, low_stock_threshold) VALUES (?, ?, ?)'
  );
  const insertMovement = db.prepare(
    'INSERT INTO stock_movements (product_id, type, quantity, note) VALUES (?, ?, ?, ?)'
  );

  const stockQtys1 = [50, 40, 4, 25, 35, 30, 45, 3];
  products1.forEach(([name, desc, price, cat, imageUrl], i) => {
    const pid = insertProduct.run(shop1Id, name, desc, price, cat, imageUrl, 1).lastInsertRowid;
    const qty = stockQtys1[i];
    insertStock.run(pid, qty, 5);
    insertMovement.run(pid, 'entry', qty + 10, 'Stock initial');
    insertMovement.run(pid, 'exit', 10, 'Ventes de la semaine');
  });

  const stockQtys2 = [6, 3, 8, 4, 10, 15];
  products2.forEach(([name, desc, price, cat, imageUrl], i) => {
    const pid = insertProduct.run(shop2Id, name, desc, price, cat, imageUrl, 1).lastInsertRowid;
    const qty = stockQtys2[i];
    insertStock.run(pid, qty, 4);
    insertMovement.run(pid, 'entry', qty + 5, 'Stock initial');
    insertMovement.run(pid, 'exit', 5, 'Ventes');
  });

  // Commandes de démonstration
  const allProducts = db.prepare('SELECT id, price FROM products WHERE shop_id = ?').all(shop1Id);
  if (allProducts.length > 0) {
    const insertOrder = db.prepare(
      'INSERT INTO orders (client_id, shop_id, status, payment_method, total_amount, notes) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
    );

    const ordersData = [
      { status: 'delivered', method: 'orange_money', amount: 5000 },
      { status: 'delivered', method: 'moov_money', amount: 7200 },
      { status: 'confirmed', method: 'cash_on_delivery', amount: 2500 },
      { status: 'pending', method: 'orange_money', amount: 3800 },
    ];

    ordersData.forEach(({ status, method, amount }, i) => {
      const oid = insertOrder.run(c1Id, shop1Id, status, method, amount, null).lastInsertRowid;
      const p = allProducts[i % allProducts.length];
      insertItem.run(oid, p.id, 1, p.price);
      db.prepare('INSERT INTO payments (order_id, amount, method, status) VALUES (?, ?, ?, ?)').run(
        oid, amount, method, status === 'delivered' ? 'completed' : 'pending'
      );
    });
  }

  // Avis
  db.prepare('INSERT INTO reviews (client_id, shop_id, rating, comment) VALUES (?, ?, ?, ?)')
    .run(c1Id, shop1Id, 5, 'Excellent ! Produits locaux de très bonne qualité. Le mil est frais et le beurre de karité est pur. Je recommande vivement !');

  db.prepare('INSERT INTO reviews (client_id, shop_id, rating, comment) VALUES (?, ?, ?, ?)')
    .run(c1Id, shop2Id, 4, 'Belle sélection de pagnes et boubous. Le bazin est de bonne qualité. Livraison rapide à Ouagadougou.');

  console.log('✅ Base de données Market BF initialisée (contexte Burkina Faso)');
  console.log('   Admin:       admin@marketbf.com      / Admin123!');
  console.log('   Commerçant1: merchant1@marketbf.com  / Merchant1!');
  console.log('   Commerçant2: merchant2@marketbf.com  / Merchant2!');
  console.log('   Client:      client@marketbf.com     / Client123!');
}

module.exports = { getDb, initDb };
