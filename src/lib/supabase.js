import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vpuieqkybrhiipetopxe.supabase.co';
const supabaseKey = 'sb_publishable_du4alj1DUOwc2le7aZVJjg_UxpyFD57';

export const supabase = createClient(supabaseUrl, supabaseKey);
