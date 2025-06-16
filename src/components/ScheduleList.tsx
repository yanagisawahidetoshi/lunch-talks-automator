
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
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Calendar className="h-5 w-5" />
          生成されたスケジュール
        </CardTitle>
        <CardDescription className="text-green-700">
          全{state.schedule.length}回分のライトニングトークスケジュール
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg overflow-hidden border border-green-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-green-100">
                <TableHead className="font-semibold text-green-800">日付</TableHead>
                <TableHead className="font-semibold text-green-800">曜日</TableHead>
                <TableHead className="font-semibold text-green-800">週番号</TableHead>
                <TableHead className="font-semibold text-green-800">発表者</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.schedule.map((session, index) => (
                <TableRow 
                  key={index}
                  className="hover:bg-green-50 transition-colors"
                >
                  <TableCell className="font-medium">
                    {format(session.date, 'yyyy年M月d日', { locale: ja })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {format(session.date, 'EEEE', { locale: ja })}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>第{session.weekNumber}週</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <div className="flex flex-wrap gap-1">
                        {session.presenters.map((presenter, pIndex) => (
                          <Badge 
                            key={pIndex}
                            variant="secondary"
                            className="bg-purple-100 text-purple-800 border-purple-200"
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
            <p className="text-sm text-green-600">
              最終生成日時: {format(state.lastGenerated, 'yyyy年M月d日 HH:mm', { locale: ja })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
