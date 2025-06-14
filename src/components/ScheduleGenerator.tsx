
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Download, Play, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useToast } from '../hooks/use-toast';

export const ScheduleGenerator: React.FC = () => {
  const { participants, config, schedule, generateSchedule, lastGenerated } = useAppContext();
  const { toast } = useToast();

  const canGenerate = participants.length > 0 && config?.startDate;

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
      generateSchedule();
      toast({
        title: "スケジュール生成完了",
        description: `${schedule.length}回分のスケジュールを生成しました。`,
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
    if (schedule.length === 0) {
      toast({
        title: "エラー",
        description: "先にスケジュールを生成してください。",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ['日付', '週番号', '発表者', 'Slack ID'],
      ...schedule.map(session => [
        format(session.date, 'yyyy-MM-dd'),
        session.weekNumber.toString(),
        session.presenters.map(p => p.name).join('・'),
        session.presenters.map(p => p.slackId).join('・')
      ])
    ];

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
              参加者: {participants.length}人 | 
              設定: {config?.startDate ? "完了" : "未完了"}
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
        {schedule.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">生成されたスケジュール</h4>
              <Button onClick={handleExportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                CSV出力
              </Button>
            </div>
            
            <div className="max-h-80 overflow-y-auto space-y-2">
              {schedule.slice(0, 10).map((session, index) => (
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
              {schedule.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  他 {schedule.length - 10} 件...
                </p>
              )}
            </div>

            {lastGenerated && (
              <p className="text-xs text-muted-foreground">
                最終生成: {format(lastGenerated, 'yyyy-MM-dd HH:mm', { locale: ja })}
              </p>
            )}
          </div>
        )}

        {/* Empty State */}
        {schedule.length === 0 && (
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
