import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Download, Play, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useToast } from '../hooks/use-toast';
import { ScheduleSession, Participant } from '../types';
import { generateSchedule as generateScheduleUtil } from '../utils/scheduleGenerator';
import { saveScheduleToSupabase, getLatestScheduleWithSessions } from '../lib/scheduleService';

export const ScheduleGenerator: React.FC = () => {
  const { state, setSchedule } = useApp();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingFromSupabase, setIsLoadingFromSupabase] = useState(true);

  const canGenerate = state.participants.length > 0 && state.config?.startDate;

  // 初期描画時にSupabaseから最新のスケジュールを取得
  useEffect(() => {
    const loadLatestSchedule = async () => {
      try {
        const result = await getLatestScheduleWithSessions();
        
        if (result.success && result.sessions.length > 0) {
          // Supabaseのデータを変換してAppStateの形式に合わせる
          const convertedSessions: ScheduleSession[] = result.sessions.map((session, index) => ({
            date: parseISO(session.date),
            presenters: session.presenters.map((p: any) => ({
              id: p.participant_id,
              name: p.participant_name,
              slackId: p.slack_id
            } as Participant)),
            weekNumber: index + 1 // 仮の週番号（実際の計算が必要な場合は後で修正）
          }));
          
          setSchedule(convertedSessions);
          
          toast({
            title: "スケジュール読み込み完了",
            description: `保存されたスケジュール（${convertedSessions.length}回分）を読み込みました。`,
          });
        }
      } catch (error) {
        console.error('Error loading schedule from Supabase:', error);
        // エラーが発生してもアプリの動作は継続
      } finally {
        setIsLoadingFromSupabase(false);
      }
    };
    
    loadLatestSchedule();
  }, []); // 依存配列を空にして初回のみ実行

  const generateSchedule = (): ScheduleSession[] => {
    if (!state.config || state.participants.length === 0) {
      return [];
    }

    return generateScheduleUtil(state.participants, state.config);
  };

  const handleGenerate = async () => {
    if (!canGenerate || !state.config) {
      toast({
        title: "エラー",
        description: "参加者とスケジュール設定を完了してください。",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const newSchedule = generateSchedule();
      
      if (newSchedule.length === 0) {
        toast({
          title: "警告",
          description: "スケジュールが生成されませんでした。設定を確認してください。",
          variant: "destructive",
        });
        return;
      }
      
      setSchedule(newSchedule);
      
      // Supabaseに自動保存
      const scheduleName = `LTスケジュール ${format(new Date(), 'yyyy年MM月dd日')}`;
      const result = await saveScheduleToSupabase(
        scheduleName,
        state.config,
        newSchedule
      );

      if (result.success) {
        toast({
          title: "スケジュール生成・保存完了",
          description: `${newSchedule.length}回分のスケジュールを生成し、Supabaseに保存しました。`,
        });
      } else {
        toast({
          title: "スケジュール生成完了（保存エラー）",
          description: `スケジュールは生成されましたが、保存中にエラーが発生しました。`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "生成エラー",
        description: "スケジュールの生成中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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

    // ヘッダー行を動的に生成
    const maxPresenters = Math.max(...state.schedule.map(s => s.presenters.length));
    const headers = ['日付', '週番号'];
    
    for (let i = 1; i <= maxPresenters; i++) {
      headers.push(`ユーザ名${i}`);
    }
    
    const csvContent: string[][] = [headers];
    
    // 各セッションを1行として追加
    state.schedule.forEach(session => {
      const row = [
        format(session.date, 'yyyy-MM-dd'),
        session.weekNumber.toString()
      ];
      
      // 各発表者の情報を横に展開
      session.presenters.forEach(presenter => {
        row.push(presenter.name);
      });
      
      // 空のセルを埋める（発表者数が最大数に満たない場合）
      const remainingCells = maxPresenters - session.presenters.length;
      for (let i = 0; i < remainingCells; i++) {
        row.push('');
      }
      
      csvContent.push(row);
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
          disabled={!canGenerate || isGenerating || isLoadingFromSupabase}
          className="w-full"
          size="lg"
        >
          {isLoadingFromSupabase ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              読み込み中...
            </>
          ) : isGenerating ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              生成中...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              スケジュール生成
            </>
          )}
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
        {state.schedule.length === 0 && !isLoadingFromSupabase && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              スケジュールを生成すると、ここに表示されます
            </p>
          </div>
        )}
        
        {/* Loading State */}
        {isLoadingFromSupabase && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="h-8 w-8 mx-auto mb-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm">
              保存されたスケジュールを読み込み中...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
