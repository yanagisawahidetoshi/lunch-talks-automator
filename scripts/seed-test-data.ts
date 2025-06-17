import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// テスト用のデータ
const testParticipants = [
  '山田太郎',
  '鈴木花子',
  '佐藤一郎',
  '田中美香',
  '高橋健太',
];

const testSchedules = [
  { date: '2024/11/22', presenters: ['山田太郎', '鈴木花子'] },
  { date: '2024/11/29', presenters: ['佐藤一郎', '田中美香'] },
  { date: '2024/12/6', presenters: ['高橋健太', '山田太郎'] },
  { date: '2024/12/13', presenters: ['鈴木花子'] },
  { date: '2024/12/20', presenters: ['佐藤一郎', '田中美香'] },
];

async function main() {
  try {
    console.log('テストデータの作成を開始します...');

    // 1. 参加者を登録
    const participants = await Promise.all(
      testParticipants.map((name) =>
        prisma.participant.upsert({
          where: { name },
          update: {},
          create: { name },
        })
      )
    );
    console.log(`参加者を登録しました: ${participants.length}名`);

    // 参加者名からIDへのマップを作成
    const participantMap = new Map(
      participants.map((p) => [p.name, p.id])
    );

    // 2. スケジュールを登録
    for (const schedule of testSchedules) {
      const [year, month, day] = schedule.date.split('/').map(Number);
      const date = new Date(year, month - 1, day, 12, 0, 0);

      await prisma.schedule.create({
        data: {
          title: `ランチLT - ${schedule.date}`,
          date,
          duration: 60,
          location: 'オフィス',
          description: `登壇者: ${schedule.presenters.join(', ')}`,
          participants: {
            create: schedule.presenters.map((presenterName, index) => ({
              participantId: participantMap.get(presenterName)!,
              role: 'speaker',
              order: index,
            })),
          },
        },
      });
      console.log(`スケジュールを作成: ${schedule.date}`);
    }

    console.log('テストデータの作成が完了しました！');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
