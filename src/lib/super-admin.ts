export function isSuperAdmin(email?: string | null): boolean {
  return (
    !!email &&
    !!process.env.SUPER_ADMIN_EMAIL &&
    email === process.env.SUPER_ADMIN_EMAIL
  );
}
