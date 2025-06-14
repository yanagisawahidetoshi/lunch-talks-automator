import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Download, Play, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, addWeeks, isSameDay, setDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useToast } from '../hooks/use-toast';
import { Participant, ScheduleSession } from '../types';

export const ScheduleGenerator: React.FC = () => {
  const { state, setSchedule } = useApp();
  const { toast } = useToast();

  const canGenerate = state.participants.length > 0 && state.config?.startDate;

  const generateSchedule = (): ScheduleSession[] => {
    if (!state.config || state.participants.length === 0) {
      return [];
    }

    const { startDate, dayOfWeek, frequency, presentersPerSession } = state.config;
    const participants = [...state.participants];
    const schedule: ScheduleSession[] = [];
    
    // 参加者をシャッフル
    const shuffledParticipants = participants.sort(() => Math.random() - 0.5);
    
    // 開始日を設定された曜日に調整
    let currentDate = new Date(startDate);
    const startDayOfWeek = currentDate.getDay();
    
    if (startDayOfWeek !== dayOfWeek) {
      // 次の指定曜日まで日付を進める
      const daysToAdd = (dayOfWeek - startDayOfWeek + 7) % 7;
      currentDate = addWeeks(currentDate, 0);
      currentDate.setDate(currentDate.getDate() + daysToAdd);
    }
    
    let weekNumber = 1;
    let participantIndex = 0;
    
    // 全員が発表するまでスケジュールを生成
    while (participantIndex < shuffledParticipants.length) {
      const presenters: Participant[] = [];
      
      // 1回あたりの発表者数分を選択
      for (let i = 0; i < presentersPerSession && participantIndex < shuffledParticipants.length; i++) {
        presenters.push(shuffledParticipants[participantIndex]);
        participantIndex++;
      }
      
      if (presenters.length > 0) {
        schedule.push({
          date: new Date(currentDate),
          presenters,
          weekNumber
        });
        
        // 次の開催日を計算
        currentDate = addWeeks(currentDate, frequency);
        weekNumber += frequency;
      }
    }
    
    return schedule;
  };

  const handleGenerate = () => {
    if (!canGenerate) {
      toast({
        title: "エラー",
        description: "参加者とスケジュール設定を完了してください。",
        variant: "destructive",
      });
      return;
    }

    try {
      const newSchedule = generateSchedule();
      
      setSchedule(newSchedule);
      toast({
        title: "スケジュール生成完了",
        description: `${newSchedule.length}回分のスケジュールを生成しました。`,
      });
    } catch (error) {
      toast({
        title: "生成エラー",
        description: "スケジュールの生成中にエラーが発生しました。",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    if (state.schedule.length === 0) {
      toast({
        title: "エラー",
        description: "先にスケジュールを生成してください。",
        variant: "destructive",
      });
      return;
    }

    // ヘッダー行
    const csvContent: string[][] = [
      ['日付', '週番号', 'ユーザ名', 'Slack ID']
    ];
    
    // 各セッションの発表者を個別の行として追加
    state.schedule.forEach(session => {
      session.presenters.forEach(presenter => {
        csvContent.push([
          format(session.date, 'yyyy-MM-dd'),
          session.weekNumber.toString(),
          presenter.name,
          presenter.slackId
        ]);
      });
    });

    const csvString = csvContent.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `LT_Schedule_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSVエクスポート完了",
      description: "スケジュールをCSVファイルでダウンロードしました。",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          スケジュール生成
        </CardTitle>
        <CardDescription>
          ライトニングトークのスケジュールを自動生成します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generation Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="font-medium">
              {canGenerate ? "生成準備完了" : "設定が不完全です"}
            </p>
            <p className="text-sm text-muted-foreground">
              参加者: {state.participants.length}人 | 
              設定: {state.config?.startDate ? "完了" : "未完了"}
            </p>
          </div>
          <Badge variant={canGenerate ? "default" : "secondary"}>
            {canGenerate ? "準備完了" : "設定中"}
          </Badge>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerate} 
          disabled={!canGenerate}
          className="w-full"
          size="lg"
        >
          <Play className="h-4 w-4 mr-2" />
          スケジュール生成
        </Button>

        {/* Schedule Preview */}
        {state.schedule.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">生成されたスケジュール</h4>
              <Button onClick={handleExportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                CSV出力
              </Button>
            </div>
            
            <div className="max-h-80 overflow-y-auto space-y-2">
              {state.schedule.slice(0, 10).map((session, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {format(session.date, 'M月d日 (EEEE)', { locale: ja })}
                    </span>
                    <Badge variant="outline">第{session.weekNumber}週</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {session.presenters.map(p => p.name).join(' ・ ')}
                    </span>
                  </div>
                </div>
              ))}
              {state.schedule.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  他 {state.schedule.length - 10} 件...
                </p>
              )}
            </div>

            {state.lastGenerated && (
              <p className="text-xs text-muted-foreground">
                最終生成: {format(state.lastGenerated, 'yyyy-MM-dd HH:mm', { locale: ja })}
              </p>
            )}
          </div>
        )}

        {/* Empty State */}
        {state.schedule.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              スケジュールを生成すると、ここに表示されます
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
