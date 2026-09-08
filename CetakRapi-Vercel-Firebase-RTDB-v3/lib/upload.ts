const MIME_BY_EXTENSION: Record<string, string[]> = {
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'],
};

export type UploadMetadata = {
  extension: string;
  mime: string;
  safeName: string;
  size: number;
};

export function validateUploadMetadata(name: string, declaredMime: string, size: number, allowedTypes: string[], maxFileMb: number): UploadMetadata {
  const extension = name.split('.').pop()?.toLowerCase() || '';
  if (!allowedTypes.includes(extension) || !MIME_BY_EXTENSION[extension]) throw new Error('Format file tidak didukung.');
  if (!Number.isInteger(size) || size <= 0) throw new Error('File kosong tidak dapat diunggah.');
  if (size > maxFileMb * 1024 * 1024) throw new Error(`Ukuran file melebihi batas ${maxFileMb} MB.`);
  if (declaredMime && !MIME_BY_EXTENSION[extension].includes(declaredMime)) throw new Error('Tipe file tidak sesuai dengan ekstensi.');
  return { extension, mime: canonicalMime(extension), safeName: safeFileName(name), size };
}

export function signatureMatches(extension: string, bytes: Uint8Array) {
  if (extension === 'png') return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (extension === 'jpg' || extension === 'jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (extension === 'pdf') return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  return bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07) && (bytes[3] === 0x04 || bytes[3] === 0x06 || bytes[3] === 0x08);
}

export function safeFileName(name: string) {
  return name.normalize('NFKC').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-120) || 'dokumen';
}

function canonicalMime(extension: string) {
  if (extension === 'png') return 'image/png';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
}
