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
  const { state, addParticipant, removeParticipant, bulkAddParticipants } = useApp();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [bulkData, setBulkData] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);

  const handleAddParticipant = () => {
    if (!name.trim()) {
      toast({
        title: "エラー",
        description: "名前を入力してください。",
        variant: "destructive",
      });
      return;
    }

    const participant: Omit<Participant, 'id'> = {
      name: name.trim(),
    };

    addParticipant(participant);
    setName('');
    
    toast({
      title: "参加者を追加しました",
      description: `${participant.name} を追加しました。`,
    });
  };

  const handleBulkImport = () => {
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

      for (const line of lines) {
        const name = line.trim();
        if (name) {
          importData.push({
            name: name,
          });
        }
      }

      if (importData.length === 0) {
        toast({
          title: "エラー",
          description: "有効なデータが見つかりません。1行に1つの名前を入力してください。",
          variant: "destructive",
        });
        return;
      }

      bulkAddParticipants(importData);
      setBulkData('');
      setShowBulkImport(false);
      
      toast({
        title: "一括インポート完了",
        description: `${importData.length}人の参加者を追加しました。`,
      });
    } catch (error) {
      toast({
        title: "インポートエラー",
        description: "データの処理中にエラーが発生しました。",
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
          <Button onClick={handleAddParticipant} className="w-full">
            <UserPlus className="h-4 w-4 mr-2" />
            参加者を追加
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
                <Button onClick={handleBulkImport} size="sm">
                  インポート
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
          {state.participants.length === 0 ? (
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
                    onClick={() => removeParticipant(participant.id)}
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
