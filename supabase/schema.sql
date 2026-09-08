-- =========================================================================
-- SCHEMA OFFICIEL SUPABASE - KIABA RENCONTRE
-- =========================================================================

-- Activer l'extension pgcrypto si non déjà fait
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Table des utilisateurs (avec photo obligatoire, vérification âge)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Homme', 'Femme', 'Transgenre')),
    profile_photo_url TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    free_ad_eligible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table de liste noire des emails (interdiction définitive après suppression)
CREATE TABLE IF NOT EXISTS blacklisted_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    reason VARCHAR(100) DEFAULT 'ACCOUNT_DELETED_BY_USER',
    blacklisted_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blacklisted_emails_email ON blacklisted_emails(email);

-- 3. Table des codes OTP temporaires
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('REGISTRATION', 'PASSWORD_RESET', 'ACCOUNT_DELETION')),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email_code ON otp_codes(email, code);

-- 4. Table des annonces
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    contact_channels VARCHAR(20) NOT NULL CHECK (contact_channels IN ('WHATSAPP', 'CALL', 'BOTH')),
    accepted_clients VARCHAR(20) NOT NULL CHECK (accepted_clients IN ('HOMME', 'FEMME', 'TRANSGENRE', 'TOUS')),
    category VARCHAR(50) NOT NULL,
    subcategories TEXT[] NOT NULL DEFAULT '{}',
    formula VARCHAR(20) NOT NULL CHECK (formula IN ('STANDARD', 'PRO', 'PRO_PLUS', 'VIP')),
    status VARCHAR(20) DEFAULT 'ONLINE' CHECK (status IN ('PENDING_PAYMENT', 'ONLINE', 'OFFLINE', 'DELETED')),
    is_boosted BOOLEAN DEFAULT FALSE,
    boosted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    highlight_expires_at TIMESTAMPTZ,
    alert_2d_sent BOOLEAN DEFAULT FALSE,
    alert_1d_sent BOOLEAN DEFAULT FALSE,
    alert_1h_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index de performance extrême pour le feed et les filtres
CREATE INDEX IF NOT EXISTS idx_ads_status_boosted_created ON ads (status, is_boosted DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_city ON ads (city);
CREATE INDEX IF NOT EXISTS idx_ads_category ON ads (category);
CREATE INDEX IF NOT EXISTS idx_ads_expires_at ON ads (expires_at);
CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads (user_id);

-- 5. Table des photos d'annonces (1 à 5 photos)
CREATE TABLE IF NOT EXISTS ad_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    display_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ad_photos_ad_id ON ad_photos(ad_id);

-- 6. Table des transactions GeniusPay
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
    geniuspay_reference VARCHAR(100) UNIQUE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('NEW_AD', 'BOOST', 'EDIT', 'RENEWAL')),
    amount_fcfa INT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    payment_method VARCHAR(50),
    customer_phone VARCHAR(30),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(geniuspay_reference);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);

-- 7. Fonction d'expiration automatique des annonces
CREATE OR REPLACE FUNCTION check_expired_ads() RETURNS void AS $$
BEGIN
    UPDATE ads
    SET status = 'OFFLINE',
        updated_at = NOW()
    WHERE status = 'ONLINE' AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger de mise à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ads_modtime
    BEFORE UPDATE ON ads
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 9. Table de rate limiting best-effort (voir src/lib/rateLimit.ts)
-- Fenêtre fixe : une ligne par (clé, début de fenêtre arrondi).
CREATE TABLE IF NOT EXISTS rate_limits (
    key VARCHAR(255) NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    count INT NOT NULL DEFAULT 1,
    PRIMARY KEY (key, window_start)
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================================================
-- La clé "anon" publique (NEXT_PUBLIC_SUPABASE_ANON_KEY) est exposée au
-- navigateur. Toutes les ÉCRITURES applicatives passent exclusivement par
-- les routes API serveur (src/app/api/**), qui utilisent la clé
-- service_role via createAdminClient() — cette clé contourne RLS par
-- nature. RLS ne sert donc ici qu'à verrouiller ce que la clé anon peut lire
-- si elle est un jour utilisée directement depuis le navigateur (SSR public,
-- composants clients). Principe appliqué : tout est fermé par défaut, seules
-- les lectures publiques strictement nécessaires sont autorisées.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklisted_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- users, otp_codes, transactions, blacklisted_emails, rate_limits :
-- aucune policy créée pour anon/authenticated => RLS activée + zéro policy
-- signifie qu'aucune ligne n'est jamais visible via ces rôles. C'est
-- volontaire : ces tables contiennent des données sensibles (hash de mot
-- de passe, codes OTP, montants de transaction, emails bannis, compteurs
-- de rate limiting) qui ne doivent être lues/écrites que par le backend
-- via service_role.

-- ads : lecture publique uniquement des annonces publiées (ONLINE).
-- Les statuts PENDING_PAYMENT, OFFLINE et DELETED ne doivent jamais être
-- exposés via la clé anon (ex: annonce en attente de paiement, supprimée,
-- ou expirée mais pas encore purgée).
CREATE POLICY "ads_public_read_online" ON ads
    FOR SELECT
    USING (status = 'ONLINE');

-- ad_photos : lecture publique uniquement des photos dont l'annonce
-- parente est ONLINE. La table ad_photos n'a pas son propre statut, d'où
-- la sous-requête EXISTS qui réplique la même règle que ci-dessus.
CREATE POLICY "ad_photos_public_read_online" ON ad_photos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ads
            WHERE ads.id = ad_photos.ad_id
            AND ads.status = 'ONLINE'
        )
    );

-- =========================================================================
-- STOCKAGE (Supabase Storage) — photos de profil & photos d'annonces
-- =========================================================================
-- Bucket public : les photos servies sur le site (annonces, avatars) sont
-- par nature publiques une fois l'annonce en ligne. L'upload lui-même passe
-- exclusivement par POST /api/uploads (service_role, jamais directement
-- depuis le navigateur), donc aucune policy INSERT n'est nécessaire ici —
-- un bucket "public" sert les fichiers en lecture sans vérifier RLS.
INSERT INTO storage.buckets (id, name, public)
VALUES ('kiaba-uploads', 'kiaba-uploads', true)
ON CONFLICT (id) DO NOTHING;
