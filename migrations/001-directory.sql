CREATE SCHEMA IF NOT EXISTS mylesenhub;
CREATE TABLE IF NOT EXISTS mylesenhub.accounts (
 id text PRIMARY KEY, name text NOT NULL, email text NOT NULL,
 role text NOT NULL DEFAULT 'instructor' CHECK (role IN ('admin','instructor','institut')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS mylesenhub.submissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL REFERENCES mylesenhub.accounts(id),
 kind text NOT NULL CHECK(kind IN ('instructor','institut','program','media','correction','affiliation')),
 status text NOT NULL CHECK(status IN ('draft','semakan','pengesahan','diterbitkan','pembetulan')),
 payload jsonb NOT NULL, note text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS submission_owner_time ON mylesenhub.submissions(user_id,updated_at DESC);
CREATE TABLE IF NOT EXISTS mylesenhub.listings (
 id text PRIMARY KEY, user_id text NOT NULL REFERENCES mylesenhub.accounts(id),
 kind text NOT NULL, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS mylesenhub.media (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL REFERENCES mylesenhub.accounts(id),
 mime text NOT NULL, bytes bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS mylesenhub.messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, email text NOT NULL, subject text NOT NULL,
 message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
