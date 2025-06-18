import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../lib/prisma';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'GET') {
    try {
      const participants = await prisma.participant.findMany({
        orderBy: {
          createdAt: 'asc',
        },
      });
      return res.status(200).json(participants);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch participants' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, slackId } = req.body;
      const participant = await prisma.participant.create({
        data: {
          name,
          slackId,
        },
      });
      return res.status(201).json(participant);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create participant' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, name, slackId } = req.body;
      const participant = await prisma.participant.update({
        where: { id },
        data: {
          name,
          slackId,
        },
      });
      return res.status(200).json(participant);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update participant' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      await prisma.participant.delete({
        where: { id: id as string },
      });
      return res.status(204).send('');
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete participant' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
