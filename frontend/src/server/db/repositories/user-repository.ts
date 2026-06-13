// =============================================================================
// Felix Snack POS — User Repository
// Data-access layer for User model. Pure Prisma queries — no business logic.
// =============================================================================

import prisma from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserFilters {
  search?: string;
  role?: string;
  is_active?: boolean;
  page: number;
  per_page: number;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Find users with optional filters and pagination.
 * Returns users sorted by created_at descending.
 */
export async function findMany(filters: UserFilters) {
  const { search, role, is_active, page, per_page } = filters;

  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = role as Prisma.EnumUserRoleFilter["equals"];
  }

  if (is_active !== undefined) {
    where.is_active = is_active;
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * per_page,
      take: per_page,
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total };
}

/**
 * Find a single user by ID.
 */
export async function findById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      is_active: true,
      password: true,
      created_at: true,
      updated_at: true,
    },
  });
}

/**
 * Find a user by email (for uniqueness check).
 */
export async function findByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
}

/**
 * Create a new user.
 */
export async function create(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role as "owner" | "cashier" | "staff",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      is_active: true,
      created_at: true,
      updated_at: true,
    },
  });
}

/**
 * Update a user by ID.
 */
export async function update(id: string, data: Record<string, unknown>) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      is_active: true,
      created_at: true,
      updated_at: true,
    },
  });
}

/**
 * Set user active/inactive status.
 */
export async function toggleActive(id: string, isActive: boolean) {
  return prisma.user.update({
    where: { id },
    data: { is_active: isActive },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      is_active: true,
      created_at: true,
      updated_at: true,
    },
  });
}
