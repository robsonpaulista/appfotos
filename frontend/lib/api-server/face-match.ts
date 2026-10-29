import { supabase } from './supabase.config';
import { getLibrarySourceId } from './google.config';

export function euclideanDistance(a: number[], b: number[]): number {
  if (!a?.length || !b?.length || a.length !== b.length) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/** Distância euclidiana Face-API: menor = mais parecido. ~0.4 restrito, ~0.55–0.6 amplo. */
export const DEFAULT_LEADER_MATCH_THRESHOLD = 0.58;

export async function searchArchiveByDescriptor(
  targetDescriptor: number[],
  threshold = DEFAULT_LEADER_MATCH_THRESHOLD
) {
  const { data: allDescriptors, error } = await supabase
    .from('face_descriptors')
    .select('id, photo_id, face_vector, person_id');

  if (error) throw error;

  const { count } = await supabase
    .from('face_descriptors')
    .select('*', { count: 'exact', head: true });
  const indexedFaces = count || 0;

  if (!allDescriptors?.length) {
    return { matches: [], indexedFaces };
  }

  const matches = allDescriptors
    .map((desc) => ({
      id: desc.id as string,
      photo_id: desc.photo_id as string,
      person_id: desc.person_id as string | null,
      distance: euclideanDistance(targetDescriptor, desc.face_vector as number[]),
    }))
    .filter((m) => m.distance < threshold)
    .sort((a, b) => a.distance - b.distance);

  if (matches.length === 0) {
    return { matches: [], indexedFaces };
  }

  const bestByPhoto = new Map<string, (typeof matches)[number]>();
  for (const match of matches) {
    const existing = bestByPhoto.get(match.photo_id);
    if (!existing || match.distance < existing.distance) {
      bestByPhoto.set(match.photo_id, match);
    }
  }

  const photoIds = [...bestByPhoto.keys()];
  const libraryId = getLibrarySourceId();
  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('*')
    .in('id', photoIds)
    .eq('user_id', libraryId);

  if (photosError) throw photosError;

  const enriched = [...bestByPhoto.values()]
    .map((match) => {
      const photo = photos?.find((p) => p.id === match.photo_id);
      if (!photo) return null;
      const similarity = Math.max(0, Math.min(1, 1 - match.distance));
      return { ...match, similarity, photo };
    })
    .filter(Boolean)
    .sort((a, b) => (a!.distance - b!.distance));

  return { matches: enriched, indexedFaces };
}
