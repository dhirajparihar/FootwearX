INSERT INTO "Shop" (id, name, "updatedAt") VALUES ('DEFAULT', 'Default Shop', NOW()) ON CONFLICT (id) DO NOTHING;
