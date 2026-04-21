import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hynwjtfiydfltxxsnecw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fjYlt4aMKpiLUarmdvE_Yg_c_wtYqYw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function guardarSesion({ fecha, rutina, nota, cardio, ejercicios }) {
  const { data: sesion, error } = await supabase
    .from('sesiones')
    .insert({ fecha, rutina, nota })
    .select()
    .single();

  if (error) throw error;

  if (cardio.length > 0) {
    await supabase.from('cardio').insert(
      cardio.map((c) => ({ sesion_id: sesion.id, ...c }))
    );
  }

  for (const ej of ejercicios) {
    const { data: ejData } = await supabase
      .from('ejercicios')
      .insert({ sesion_id: sesion.id, nombre: ej.nombre, es_extra: ej.esExtra || false })
      .select()
      .single();

    if (ej.series.length > 0) {
      await supabase.from('series').insert(
        ej.series.map((s, i) => ({
          ejercicio_id: ejData.id,
          numero_serie: i + 1,
          peso: parseFloat(s.peso) || null,
          reps: parseInt(s.reps) || null,
          completada: s.hecho,
        }))
      );
    }
  }

  return sesion;
}

export async function getUltimaSesion(rutina) {
  const { data } = await supabase
    .from('sesiones')
    .select(`*, ejercicios(*, series(*)), cardio(*)`)
    .eq('rutina', rutina)
    .order('fecha', { ascending: false })
    .limit(1)
    .single();

  return data;
}

export async function getHistorial() {
  const { data } = await supabase
    .from('sesiones')
    .select(`*, ejercicios(*, series(*)), cardio(*)`)
    .order('fecha', { ascending: false })
    .limit(20);

  return data || [];
}
