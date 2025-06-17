import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

// CSVファイルのパス
const csvPath = process.argv[2];

if (!csvPath) {
  console.error('使用方法: npm run seed:csv <csvファイルパス>');
  process.exit(1);
}

async function main() {
  try {
    // CSVファイルを読み込む
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    
    // CSVをパース
    const records = parse(fileContent, {
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    });

    // 登壇者を抽出
    const presentersSet = new Set<string>();
    const scheduleData: Array<{
      date: string;
      presenters: string[];
    }> = [];

    records.forEach((row: any[]) => {
      // 日付の形式（YYYY/MM/DD）をチェック
      const dateStr = row[0];
      if (dateStr && typeof dateStr === 'string' && dateStr.match(/^\d{4}\/\d{1,2}\/\d{1,2}$/)) {
        const presenter1 = row[1]; // B列
        const presenter2 = row[4]; // E列

        const presenters: string[] = [];

        // 有効な登壇者のみ追加
        if (presenter1 && presenter1.trim() && !['??', '?', '未定'].includes(presenter1.trim())) {
          presentersSet.add(presenter1.trim());
          presenters.push(presenter1.trim());
        }
        if (presenter2 && presenter2.trim() && !['??', '?', '未定', '???????'].includes(presenter2.trim())) {
          presentersSet.add(presenter2.trim());
          presenters.push(presenter2.trim());
        }

        if (presenters.length > 0) {
          scheduleData.push({
            date: dateStr,
            presenters,
          });
        }
      }
    });

    console.log(`抽出された登壇者: ${presentersSet.size}名`);
    console.log(`スケジュール: ${scheduleData.length}件`);

    // 1. 登壇者をデータベースに登録
    const presenterRecords = await Promise.all(
      Array.from(presentersSet).map(async (name) => {
        return await prisma.participant.upsert({
          where: { name },
          update: {},
          create: { name },
        });
      })
    );

    console.log(`登壇者を登録しました: ${presenterRecords.length}名`);

    // 登壇者名からIDへのマップを作成
    const presenterMap = new Map(
      presenterRecords.map(p => [p.name, p.id])
    );

    // 2. スケジュールを登録
    for (const schedule of scheduleData) {
      const [year, month, day] = schedule.date.split('/').map(Number);
      const date = new Date(year, month - 1, day, 12, 0, 0); // 12:00に設定

      await prisma.schedule.create({
        data: {
          title: `ランチLT - ${schedule.date}`,
          date,
          duration: 60, // 60分
          location: 'オフィス',
          description: `登壇者: ${schedule.presenters.join(', ')}`,
          participants: {
            create: schedule.presenters.map((presenterName, index) => ({
              participantId: presenterMap.get(presenterName)!,
              role: 'speaker',
              order: index,
            })),
          },
        },
      });
    }

    console.log(`スケジュールを登録しました: ${scheduleData.length}件`);
    console.log('インポートが完了しました！');

  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
