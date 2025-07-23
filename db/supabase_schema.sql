-- Supabase schema for Union Law Firm

-- Enum type for user roles
CREATE TYPE user_role AS ENUM ('client', 'admin');

-- Users table
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    role user_role NOT NULL DEFAULT 'client',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Cases table
CREATE TABLE cases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Case updates table
CREATE TABLE case_updates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    status text NOT NULL,
    message text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Documents table
CREATE TABLE documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    file_url text NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Appointments table
CREATE TABLE appointments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    datetime timestamp with time zone NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Videos table
CREATE TABLE videos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    url text NOT NULL,
    language text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
