// Minimal Google Drive client: refresh-token OAuth + list/download only.
// No `googleapis` package needed for this scope — plain fetch calls.
//
// Setup (one-time, manual): create a Google Cloud project, enable the Drive
// API, create OAuth client credentials, run the consent flow once as the
// account that owns the Drive folder to mint a refresh token. Then set
// GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN.

interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN ?? "",
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Drive token refresh failed: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

export async function listFilesInFolder(folderId: string): Promise<DriveFile[]> {
  const token = await getAccessToken();
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id,name,modifiedTime)",
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive list failed: ${res.status}`);
  const data = await res.json();
  return data.files as DriveFile[];
}

export async function downloadFile(fileId: string): Promise<Buffer> {
  const token = await getAccessToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
