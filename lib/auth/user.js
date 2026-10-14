export const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  avatarUrl: true,
  role: true,
  emailVerifiedAt: true,
};

export function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
  };
}
