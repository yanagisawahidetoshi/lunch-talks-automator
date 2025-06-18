import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../lib/prisma';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'GET') {
    try {
      const talks = await prisma.talk.findMany({
        include: {
          speaker: true,
        },
        orderBy: {
          date: 'desc',
        },
      });
      return res.status(200).json(talks);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch talks' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, description, speakerId, date, duration } = req.body;
      const talk = await prisma.talk.create({
        data: {
          title,
          description,
          speakerId,
          date: new Date(date),
          duration,
        },
        include: {
          speaker: true,
        },
      });
      return res.status(201).json(talk);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create talk' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
