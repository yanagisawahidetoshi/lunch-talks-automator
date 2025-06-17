import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../lib/prisma';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'GET') {
    try {
      const schedules = await prisma.schedule.findMany({
        include: {
          participants: {
            include: {
              participant: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
      return res.status(200).json(schedules);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch schedules' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, date, duration, location, description, participants } = req.body;
      
      const schedule = await prisma.schedule.create({
        data: {
          title,
          date: new Date(date),
          duration,
          location,
          description,
          participants: {
            create: participants?.map((p: any, index: number) => ({
              participantId: p.participantId,
              role: p.role || 'speaker',
              order: index,
            })) || [],
          },
        },
        include: {
          participants: {
            include: {
              participant: true,
            },
          },
        },
      });
      return res.status(201).json(schedule);
    } catch (error) {
      console.error('Failed to create schedule:', error);
      return res.status(500).json({ error: 'Failed to create schedule' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, title, date, duration, location, description, status } = req.body;
      
      const schedule = await prisma.schedule.update({
        where: { id },
        data: {
          title,
          date: date ? new Date(date) : undefined,
          duration,
          location,
          description,
          status,
        },
        include: {
          participants: {
            include: {
              participant: true,
            },
          },
        },
      });
      return res.status(200).json(schedule);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update schedule' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      await prisma.schedule.delete({
        where: { id: id as string },
      });
      return res.status(204).send('');
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete schedule' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
