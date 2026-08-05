create extension if not exists vector;

create table documents (
    id uuid primary key default gen_random_uuid(),
    filename text not null,
    file_type text not null,
    size_bytes bigint not null,
    storage_path text,
    pages int,
    chunk_count int default 0,
    author text,
    status text not null default 'processing',
    stage text,
    error text,
    uploaded_at timestamptz default now()
);


create table chunks (
    id uuid primary key default gen_random_uuid(),
    document_id uuid not null references documents(id) on delete cascade,
    chunk_index int not null,
    content text not null,
    heading text,
    page_number int,
    embedding vector(768),
    fts tsvector generated always as (to_tsvector('english', content)) stored
);

create index on chunks using hnsw (embedding vector_cosine_ops);
create index on chunks using gin (fts);
create index on chunks (document_id);


create table chat_sessions (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    created_at timestamptz default now(),
    last_active_at timestamptz default now()
);


create table messages (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references chat_sessions(id) on delete cascade,
    role text not null,
    content text not null,
    created_at timestamptz default now()
);


create table queries (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references chat_sessions(id) on delete cascade,
    question text not null,
    answer text,
    latency_ms int,
    status text default 'completed',
    created_at timestamptz default now()
);

create table citations (
    id uuid primary key default gen_random_uuid(),
    query_id uuid not null references queries(id) on delete cascade,
    message_id uuid references messages(id) on delete cascade,
    chunk_id uuid references chunks(id) on delete set null,
    document_name text,
    page_number int,
    heading text,
    cited_text text
);

create index on citations (query_id);


create or replace function match_chunks(query_embedding vector(768), match_count int)
returns table (
    id uuid,
    document_id uuid,
    content text,
    heading text,
    page_number int,
    similarity float
)
language sql stable
as $$
    select
        c.id,
        c.document_id,
        c.content,
        c.heading,
        c.page_number,
        1 - (c.embedding <=> query_embedding) as similarity
    from chunks c
    where c.embedding is not null
    order by c.embedding <=> query_embedding
    limit match_count;
$$;

create or replace function search_chunks(query_text text, match_count int)
returns table (
    id uuid,
    document_id uuid,
    content text,
    heading text,
    page_number int,
    rank float
)
language sql stable
as $$
    select
        c.id,
        c.document_id,
        c.content,
        c.heading,
        c.page_number,
        ts_rank(c.fts, to_tsquery('english', query_text)) as rank
    from chunks c
    where c.fts @@ to_tsquery('english', query_text)
    order by rank desc
    limit match_count;
$$;
