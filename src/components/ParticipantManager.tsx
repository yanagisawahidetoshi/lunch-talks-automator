import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Trash2, UserPlus, Upload, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Participant, BulkImportData } from '../types';
import { useToast } from '../hooks/use-toast';

export const ParticipantManager: React.FC = () => {
  const { state, addParticipant, removeParticipant, bulkAddParticipants, isLoadingParticipants } = useApp();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [bulkData, setBulkData] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  const handleAddParticipant = async () => {
    if (!name.trim()) {
      toast({
        title: "エラー",
        description: "名前を入力してください。",
        variant: "destructive",
      });
      return;
    }

    const trimmedName = name.trim();

    // 重複チェック（既存の参加者データから判定）
    const isDuplicate = state.participants.some(
      participant => participant.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      toast({
        title: "重複エラー",
        description: `「${trimmedName}」は既に登録されています。`,
        variant: "destructive",
      });
      return;
    }

    const participant: Omit<Participant, 'id'> = {
      name: trimmedName,
    };

    setIsAdding(true);
    try {
      await addParticipant(participant);
      setName('');
      
      toast({
        title: "参加者を追加しました",
        description: `${participant.name} を追加しました。`,
      });
    } catch (error) {
      toast({
        title: "追加エラー",
        description: "参加者の追加に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkData.trim()) {
      toast({
        title: "エラー",
        description: "データを入力してください。",
        variant: "destructive",
      });
      return;
    }

    try {
      const lines = bulkData.trim().split('\n');
      const importData: BulkImportData[] = [];
      const duplicates: string[] = [];
      const existingNamesLower = state.participants.map(p => p.name.toLowerCase());

      for (const line of lines) {
        const name = line.trim();
        if (name) {
          // 重複チェック
          if (existingNamesLower.includes(name.toLowerCase())) {
            duplicates.push(name);
          } else {
            importData.push({
              name: name,
            });
          }
        }
      }

      // 重複があった場合の警告
      if (duplicates.length > 0) {
        toast({
          title: "重複データを検出",
          description: `以下の参加者は既に登録されているためスキップされます: ${duplicates.join(', ')}`,
          variant: "destructive",
        });
      }

      if (importData.length === 0) {
        toast({
          title: "エラー",
          description: duplicates.length > 0 
            ? "すべてのデータが重複のためインポートできませんでした。"
            : "有効なデータが見つかりません。1行に1つの名前を入力してください。",
          variant: "destructive",
        });
        return;
      }

      setIsBulkImporting(true);
      await bulkAddParticipants(importData);
      setBulkData('');
      setShowBulkImport(false);
      
      const successMessage = duplicates.length > 0 
        ? `${importData.length}人の参加者を追加しました。${duplicates.length}人の重複をスキップしました。`
        : `${importData.length}人の参加者を追加しました。`;

      toast({
        title: "一括インポート完了",
        description: successMessage,
      });
    } catch (error) {
      toast({
        title: "インポートエラー",
        description: "データの処理中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsBulkImporting(false);
    }
  };

  const handleRemoveParticipant = async (id: string, name: string) => {
    try {
      await removeParticipant(id);
      toast({
        title: "参加者を削除しました",
        description: `${name} を削除しました。`,
      });
    } catch (error) {
      toast({
        title: "削除エラー",
        description: "参加者の削除に失敗しました。",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          参加者管理
        </CardTitle>
        <CardDescription>
          ライトニングトークの参加者を管理します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Single Participant */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">名前</Label>
            <Input
              id="name"
              placeholder="田中太郎"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button onClick={handleAddParticipant} className="w-full" disabled={isAdding || isLoadingParticipants}>
            {isAdding ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                追加中...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                参加者を追加
              </>
            )}
          </Button>
        </div>

        {/* Bulk Import */}
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            一括インポート
          </Button>
          
          {showBulkImport && (
            <div className="space-y-2">
              <Label htmlFor="bulkData">一括データ (1行に1名ずつ)</Label>
              <Textarea
                id="bulkData"
                placeholder="田中太郎&#10;佐藤花子&#10;山田次郎"
                value={bulkData}
                onChange={(e) => setBulkData(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button onClick={handleBulkImport} size="sm" disabled={isBulkImporting}>
                  {isBulkImporting ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      インポート中...
                    </>
                  ) : (
                    'インポート'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowBulkImport(false)}
                  size="sm"
                >
                  キャンセル
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Participants List */}
        <div className="space-y-2">
          <Label>参加者一覧 ({state.participants.length}人)</Label>
          {isLoadingParticipants ? (
            <div className="text-center py-4">
              <div className="h-6 w-6 mx-auto mb-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">読み込み中...</p>
            </div>
          ) : state.participants.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              参加者が登録されていません
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {state.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{participant.name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveParticipant(participant.id, participant.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
