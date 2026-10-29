/** Pastas estruturais do Drive — não são cidade/local */
export function isStructuralFolderName(name: string | null | undefined): boolean {
  if (!name) return true;
  const n = name.trim().toLowerCase();
  return n === 'arquivos' || n.startsWith('arquivos ');
}

/**
 * Define o local da foto a partir da hierarquia:
 * - tag manual tem prioridade
 * - senão, pasta pai imediata se for cidade (ex.: Wall Ferraz)
 * - senão, pasta sincronizada se for cidade
 */
export function resolvePhotoLocation(options: {
  manualLocation?: string | null;
  syncFolderId: string;
  syncFolderName?: string | null;
  parentFolderId?: string | null;
  parentFolderName?: string | null;
}): string | null {
  const manual = options.manualLocation?.trim();
  if (manual) return manual;

  const parentId = options.parentFolderId || null;
  const parentName = options.parentFolderName?.trim() || null;
  const syncName = options.syncFolderName?.trim() || null;

  // Foto dentro de subpasta-cidade (sync na mãe "Arquivos Piauí")
  if (
    parentName &&
    parentId &&
    parentId !== options.syncFolderId &&
    !isStructuralFolderName(parentName)
  ) {
    return parentName;
  }

  // Sync direto na pasta da cidade
  if (syncName && !isStructuralFolderName(syncName)) {
    return syncName;
  }

  if (parentName && !isStructuralFolderName(parentName)) {
    return parentName;
  }

  return null;
}
