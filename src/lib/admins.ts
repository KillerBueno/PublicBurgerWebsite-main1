// Fallback list — add emails here OR set VITE_ADMIN_EMAILS in Vercel (comma-separated)
const FALLBACK_ADMIN_EMAILS = ['prrsmn91@gmail.com'];

function getAdminEmails(): string[] {
  const env = import.meta.env.VITE_ADMIN_EMAILS as string | undefined;
  if (env && env.trim()) {
    return env.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  }
  return FALLBACK_ADMIN_EMAILS.map(e => e.toLowerCase());
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
