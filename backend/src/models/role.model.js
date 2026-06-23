import { prisma } from '../config/db.js';

function normalize(row) {
  if (!row) return null;
  return {
    slug: row.slug,
    name: row.name || '',
    isSystem: Boolean(row.isSystem),
    capabilities: Array.isArray(row.capabilities) ? row.capabilities : [],
    createdAt: row.createdAt ? row.createdAt.toISOString() : '',
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : '',
  };
}

export const RoleModel = {
  async findAll() {
    const rows = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map(normalize);
  },

  async findBySlug(slug) {
    const row = await prisma.role.findUnique({
      where: { slug },
    });
    return normalize(row);
  },

  async create(data) {
    const row = await prisma.role.create({
      data: {
        slug: data.slug,
        name: data.name,
        isSystem: Boolean(data.isSystem),
        capabilities: Array.isArray(data.capabilities) ? data.capabilities : [],
      },
    });
    return normalize(row);
  },

  async update(slug, data) {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.capabilities !== undefined) updateData.capabilities = Array.isArray(data.capabilities) ? data.capabilities : [];

    const row = await prisma.role.update({
      where: { slug },
      data: updateData,
    });
    return normalize(row);
  },

  async remove(slug) {
    await prisma.role.delete({
      where: { slug },
    });
    return true;
  },
};
