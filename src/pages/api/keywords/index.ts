import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'server/db';
import { authorizationValidationMiddleware, errorHandlerMiddleware } from 'server/middlewares';
import { keywordValidationSchema } from 'validationSchema/keywords';
import { convertQueryToPrismaUtil } from 'server/utils';
import { getServerSession } from '@roq/nextjs';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { roqUserId, user } = await getServerSession(req);
  switch (req.method) {
    case 'GET':
      return getKeywords();
    case 'POST':
      return createKeyword();
    default:
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  async function getKeywords() {
    const data = await prisma.keyword
      .withAuthorization({
        roqUserId,
        tenantId: user.tenantId,
        roles: user.roles,
      })
      .findMany(convertQueryToPrismaUtil(req.query, 'keyword'));
    return res.status(200).json(data);
  }

  async function createKeyword() {
    await keywordValidationSchema.validate(req.body);
    const body = { ...req.body };

    const data = await prisma.keyword.create({
      data: body,
    });
    return res.status(200).json(data);
  }
}

export default function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  return errorHandlerMiddleware(authorizationValidationMiddleware(handler))(req, res);
}
