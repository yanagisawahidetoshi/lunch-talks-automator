
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';

export const ScheduleConfig: React.FC = () => {
  const { config, updateConfig } = useAppContext();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      updateConfig({ startDate: date });
    }
  };

  const handleDayOfWeekChange = (value: string) => {
    updateConfig({ dayOfWeek: parseInt(value) });
  };

  const handleFrequencyChange = (value: string) => {
    updateConfig({ frequency: parseInt(value) });
  };

  const handlePresentersChange = (value: string) => {
    const num = parseInt(value);
    if (num > 0) {
      updateConfig({ presentersPerSession: num });
    }
  };

  const dayNames = [
    '日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          スケジュール設定
        </CardTitle>
        <CardDescription>
          ライトニングトークのスケジュール設定を行います
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Start Date */}
        <div className="space-y-2">
          <Label>開始日</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !config?.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {config?.startDate ? (
                  format(config.startDate, "PPP", { locale: ja })
                ) : (
                  <span>日付を選択</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={config?.startDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Day of Week */}
        <div className="space-y-2">
          <Label>実施曜日</Label>
          <Select
            value={config?.dayOfWeek?.toString()}
            onValueChange={handleDayOfWeekChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="曜日を選択" />
            </SelectTrigger>
            <SelectContent>
              {dayNames.map((day, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Frequency */}
        <div className="space-y-2">
          <Label>頻度</Label>
          <Select
            value={config?.frequency?.toString()}
            onValueChange={handleFrequencyChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="頻度を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">毎週</SelectItem>
              <SelectItem value="2">隔週</SelectItem>
              <SelectItem value="3">3週間ごと</SelectItem>
              <SelectItem value="4">月1回</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Presenters per Session */}
        <div className="space-y-2">
          <Label htmlFor="presenters">1回あたりの発表者数</Label>
          <Input
            id="presenters"
            type="number"
            min="1"
            max="10"
            value={config?.presentersPerSession || 2}
            onChange={(e) => handlePresentersChange(e.target.value)}
          />
        </div>

        {/* Summary */}
        {config?.startDate && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">設定サマリー</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>開始日: {format(config.startDate, "PPP", { locale: ja })}</li>
              <li>実施曜日: {dayNames[config.dayOfWeek || 1]}</li>
              <li>頻度: {config.frequency === 1 ? '毎週' : `${config.frequency}週間ごと`}</li>
              <li>発表者数: {config.presentersPerSession || 2}人/回</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
