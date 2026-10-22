/**
 * Studio API client for communicating with the dev-server plugin endpoints.
 */

export async function fetchContent() {
  const res = await fetch('/__studio/content');
  if (!res.ok) throw new Error('Failed to fetch content from studio server');
  return res.json();
}

export async function saveContent(content) {
  const res = await fetch('/__studio/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save content');
  }
  return res.json();
}

export async function uploadPhoto(file, type = 'memory') {
  const res = await fetch(`/__studio/upload-photo?type=${type}`, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload photo');
  }
  return res.json();
}
