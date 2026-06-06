import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null as any;

/**
 * Helper to convert Base64/DataURL to a Blob
 */
export function dataURLtoBlob(dataurl: string): Blob {
  try {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error('Failed to convert dataURL to Blob:', err);
    throw err;
  }
}

/**
 * Upload an artwork image to Supabase Storage and register it in 'artworks' table
 */
export async function uploadArtworkToSupabase(fileOrBlob: File | Blob, fileName: string): Promise<{ id: string; url: string }> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  // 1. Create unique path in storage
  const cleanFileName = fileName.replace(/[^A-Za-z0-9.]/g, '_');
  const path = `artworks/${Date.now()}_${cleanFileName}`;

  // 2. Upload to storage
  // Note: We use the 'mockups' bucket for simplicity. We will upsert buckets if they don't exist
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('mockups')
    .upload(path, fileOrBlob, {
      contentType: fileOrBlob.type || 'image/png',
      upsert: true
    });

  if (uploadError) {
    console.warn('Storage upload failed, attempting to create bucket first...');
    // Attempt block bucket creation in case it does not exist
    await supabase.storage.createBucket('mockups', { public: true }).catch(() => {});
    const { data: retryData, error: retryError } = await supabase.storage
      .from('mockups')
      .upload(path, fileOrBlob, {
        contentType: fileOrBlob.type || 'image/png',
        upsert: true
      });
    if (retryError) throw retryError;
  }

  // 3. Get Public URL
  const { data: publicUrlData } = supabase.storage.from('mockups').getPublicUrl(path);
  const publicUrl = publicUrlData.publicUrl;

  // 4. Register in 'artworks' table
  const artworkId = crypto.randomUUID();
  const { error: dbError } = await supabase.from('artworks').insert({
    id: artworkId,
    url: publicUrl,
    name: fileName,
    created_at: new Date().toISOString()
  });

  if (dbError) {
    console.warn('Error inserting into artworks table, continuing anyway with direct url', dbError);
  }

  return { id: artworkId, url: publicUrl };
}

/**
 * Save reference data (product, template, background) to ensure foreign integrity
 */
export async function saveReferenceData(
  product: { id: string; name: string; category?: string; code?: string; price?: number },
  templateId: string,
  background: { id: string; name: string; url: string }
) {
  if (!isSupabaseConfigured || !supabase) return;

  // Save product
  await supabase.from('products').upsert({
    id: product.id,
    product_name: product.name,
    category: product.category || 'Misto',
    code: product.code || 'S/N',
    current_price: product.price || 0
  }, { onConflict: 'id' }).catch(err => console.warn('Upsert products failed:', err));

  // Save template
  await supabase.from('templates').upsert({
    id: templateId,
    name: templateId.toUpperCase(),
    type: templateId
  }, { onConflict: 'id' }).catch(err => console.warn('Upsert templates failed:', err));

  // Save background
  await supabase.from('backgrounds').upsert({
    id: background.id,
    name: background.name,
    url: background.url
  }, { onConflict: 'id' }).catch(err => console.warn('Upsert backgrounds failed:', err));
}

/**
 * Save individual image export to 'exports' table
 */
export async function saveExportToSupabase(payload: {
  productId: string;
  templateId: string;
  backgroundId: string;
  artworkId: string | null;
  type: string;
  dataUrl?: string; // If provided, we will convert and upload it
  url?: string; // Or directly provide verified public URL
}) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  let finalUrl = payload.url || '';

  // If a dataUrl is provided, convert and upload to Supabase storage
  if (payload.dataUrl && !finalUrl) {
    try {
      const blob = dataURLtoBlob(payload.dataUrl);
      const path = `exports/${Date.now()}_${payload.productId}_${payload.type}.png`;
      const { error: uploadError } = await supabase.storage
        .from('mockups')
        .upload(path, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('mockups').getPublicUrl(path);
        finalUrl = publicUrlData.publicUrl;
      } else {
        console.error('Failed to upload export file:', uploadError);
      }
    } catch (err) {
      console.error('Error processing dataUrl upload:', err);
    }
  }

  const exportId = crypto.randomUUID();
  const { error: exportError } = await supabase.from('exports').insert({
    id: exportId,
    product_id: payload.productId,
    template_id: payload.templateId,
    background_id: payload.backgroundId,
    artwork_id: payload.artworkId,
    type: payload.type,
    url: finalUrl,
    created_at: new Date().toISOString()
  });

  if (exportError) {
    console.error('Failed to register export in Database:', exportError);
    throw exportError;
  }

  return { id: exportId, url: finalUrl };
}

/**
 * Fetch recent exports with relations from the database
 */
export async function fetchRecentExportsFromSupabase(filterProductId?: string) {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    let query = supabase
      .from('exports')
      .select(`
        id,
        type,
        url,
        created_at,
        product_id,
        products (product_name, code, category),
        artworks (url, name)
      `)
      .order('created_at', { ascending: false });

    if (filterProductId) {
      query = query.eq('product_id', filterProductId);
    }

    const { data, error } = await query.limit(40);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching recent exports:', err);
    return [];
  }
}

/**
 * SQL Setup string helper for users to setup their Supabase tables
 */
export const SUPABASE_SQL_SETUP = `-- Script de Configuração do Banco de Dados para o Mockup Studio
-- Execute este script no SQL Editor do seu projeto Supabase.

-- 1. Criação do Bucket de Storage para Imagens e Artes
-- Nota: Você também pode criar o bucket 'mockups' manualmente na aba "Storage" com acesso Público.

-- 2. Tabela de Produtos (Products)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  category TEXT,
  code TEXT,
  current_price NUMERIC DEFAULT 0
);

-- 3. Tabela de Templates
CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT
);

-- 4. Tabela de Fundos (Backgrounds)
CREATE TABLE IF NOT EXISTS public.backgrounds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT
);

-- 5. Tabela de Artes (Artworks)
CREATE TABLE IF NOT EXISTS public.artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabela de Exportações (Exports)
CREATE TABLE IF NOT EXISTS public.exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  template_id TEXT REFERENCES public.templates(id) ON DELETE SET NULL,
  background_id TEXT REFERENCES public.backgrounds(id) ON DELETE SET NULL,
  artwork_id UUID REFERENCES public.artworks(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- frente, frente-verso, frente-verso-plano, catalogo, instagram, story
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Configurações de Acesso Público RLS (Opcional - para simplificar em ambiente interno de teste)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso irrestrito para testes" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso irrestrito para testes" ON public.templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso irrestrito para testes" ON public.backgrounds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso irrestrito para testes" ON public.artworks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso irrestrito para testes" ON public.exports FOR ALL USING (true) WITH CHECK (true);
`;
