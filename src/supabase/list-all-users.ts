const PAGE_SIZE = 1000;
// Guards against an endless loop if the admin API ever returns full pages forever.
const MAX_PAGES = 50;

export type AdminAuthUser = { id: string; email: string | null };

/** The slice of a service-role client this helper needs. */
export type AdminUsersClient = {
  auth: {
    admin: {
      listUsers(params: { page: number; perPage: number }): PromiseLike<{
        data: { users: { id: string; email?: string | null }[] };
        error: { message: string } | null;
      }>;
    };
  };
};

/**
 * `auth.admin.listUsers()` paginates; this fetches every page so a user past
 * the first 1000 is not silently missing. A partial page marks the last page.
 * Returns the `{ data, error }` shape of a single call.
 */
export async function listAllUsers(supabase: AdminUsersClient): Promise<{
  data: { users: AdminAuthUser[] } | null;
  error: { message: string } | null;
}> {
  const users: AdminAuthUser[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) return { data: null, error };
    users.push(...data.users.map((u) => ({ id: u.id, email: u.email ?? null })));
    if (data.users.length < PAGE_SIZE) return { data: { users }, error: null };
  }
  return { data: null, error: { message: "User list exceeded pagination safety limit" } };
}
