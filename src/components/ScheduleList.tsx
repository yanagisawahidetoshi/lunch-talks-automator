
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Users, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

export const ScheduleList: React.FC = () => {
  const { state } = useApp();

  if (state.schedule.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
          <Calendar className="h-5 w-5 text-orange-500" />
          生成されたスケジュール
        </CardTitle>
        <CardDescription>
          全{state.schedule.length}回分のライトニングトークスケジュール
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg overflow-hidden border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">日付</TableHead>
                <TableHead className="font-semibold">曜日</TableHead>
                <TableHead className="font-semibold">週番号</TableHead>
                <TableHead className="font-semibold">発表者</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.schedule.map((session, index) => (
                <TableRow 
                  key={index}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    {format(session.date, 'yyyy年M月d日', { locale: ja })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {format(session.date, 'EEEE', { locale: ja })}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>第{session.weekNumber}週</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1">
                        {session.presenters.map((presenter, pIndex) => (
                          <Badge 
                            key={pIndex}
                            variant="secondary"
                          >
                            {presenter.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {state.lastGenerated && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              最終生成日時: {format(state.lastGenerated, 'yyyy年M月d日 HH:mm', { locale: ja })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
