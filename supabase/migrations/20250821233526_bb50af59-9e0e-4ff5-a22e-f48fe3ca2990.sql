-- Create portfolio table
CREATE TABLE portfolio (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profile_picture table (one per user)
CREATE TABLE profile_picture (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_picture ENABLE ROW LEVEL SECURITY;

-- Portfolio RLS policies
CREATE POLICY "Users can insert own portfolio" ON portfolio
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own portfolio" ON portfolio
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio" ON portfolio
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio" ON portfolio
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Profile picture RLS policies
CREATE POLICY "Users can insert own profile picture" ON profile_picture
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own profile picture" ON profile_picture
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile picture" ON profile_picture
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile picture" ON profile_picture
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);