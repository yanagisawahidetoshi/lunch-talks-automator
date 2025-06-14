
import React, { useState } from 'react';
import { Calendar, Users, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, addDays, addWeeks } from 'date-fns';
import { useApp } from '../context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { ScheduleSession, Participant } from '../types';

// Simple Japanese holidays for 2024-2025 (can be expanded)
const japaneseHolidays = [
  new Date('2024-01-01'), // New Year's Day
  new Date('2024-01-08'), // Coming of Age Day
  new Date('2024-02-11'), // National Foundation Day
  new Date('2024-02-23'), // Emperor's Birthday
  new Date('2024-03-20'), // Vernal Equinox Day
  new Date('2024-04-29'), // Showa Day
  new Date('2024-05-03'), // Constitution Memorial Day
  new Date('2024-05-04'), // Greenery Day
  new Date('2024-05-05'), // Children's Day
  new Date('2024-07-15'), // Marine Day
  new Date('2024-08-11'), // Mountain Day
  new Date('2024-09-16'), // Respect for the Aged Day
  new Date('2024-09-23'), // Autumnal Equinox Day
  new Date('2024-10-14'), // Sports Day
  new Date('2024-11-03'), // Culture Day
  new Date('2024-11-23'), // Labor Thanksgiving Day
  // 2025 holidays
  new Date('2025-01-01'), // New Year's Day
  new Date('2025-01-13'), // Coming of Age Day
  new Date('2025-02-11'), // National Foundation Day
  new Date('2025-02-23'), // Emperor's Birthday
  new Date('2025-03-20'), // Vernal Equinox Day
  new Date('2025-04-29'), // Showa Day
  new Date('2025-05-03'), // Constitution Memorial Day
  new Date('2025-05-04'), // Greenery Day
  new Date('2025-05-05'), // Children's Day
  new Date('2025-07-21'), // Marine Day
  new Date('2025-08-11'), // Mountain Day
  new Date('2025-09-15'), // Respect for the Aged Day
  new Date('2025-09-23'), // Autumnal Equinox Day
  new Date('2025-10-13'), // Sports Day
  new Date('2025-11-03'), // Culture Day
  new Date('2025-11-23'), // Labor Thanksgiving Day
];

function isHoliday(date: Date): boolean {
  return japaneseHolidays.some(holiday => 
    holiday.getFullYear() === date.getFullYear() &&
    holiday.getMonth() === date.getMonth() &&
    holiday.getDate() === date.getDate()
  );
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export function ScheduleGenerator() {
  const { state, setSchedule } = useApp();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const canGenerate = state.config && state.participants.length >= state.config.presentersPerSession;

  const generateSchedule = async () => {
    if (!state.config || !canGenerate) return;

    setIsGenerating(true);
    console.log('Starting schedule generation...');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing

      const schedule: ScheduleSession[] = [];
      const participantQueue = [...state.participants];
      let currentDate = new Date(state.config.startDate);
      let weekNumber = 1;

      // Shuffle participants for fair rotation
      for (let i = participantQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [participantQueue[i], participantQueue[j]] = [participantQueue[j], participantQueue[i]];
      }

      let participantIndex = 0;
      
      // Generate schedule until everyone has presented at least once
      while (participantIndex < participantQueue.length) {
        // Find next valid date
        while (isWeekend(currentDate) || isHoliday(currentDate) || currentDate.getDay() !== state.config.dayOfWeek) {
          currentDate = addDays(currentDate, 1);
        }

        // Select presenters for this session
        const presenters: Participant[] = [];
        for (let i = 0; i < state.config.presentersPerSession && participantIndex < participantQueue.length; i++) {
          presenters.push(participantQueue[participantIndex]);
          participantIndex++;
        }

        schedule.push({
          date: new Date(currentDate),
          presenters,
          weekNumber,
        });

        // Move to next session date
        currentDate = addDays(currentDate, state.config.frequency * 7);
        weekNumber++;
      }

      setSchedule(schedule);
      console.log('Schedule generated:', schedule);
      
      toast({
        title: "Schedule Generated",
        description: `Created ${schedule.length} sessions for ${state.participants.length} participants`,
      });
    } catch (error) {
      console.error('Schedule generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate schedule. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToCsv = () => {
    if (state.schedule.length === 0) return;

    const csvData = [
      ['Date', 'Week', 'Presenters', 'Slack IDs'],
      ...state.schedule.map(session => [
        format(session.date, 'yyyy-MM-dd'),
        session.weekNumber.toString(),
        session.presenters.map(p => p.name).join('; '),
        session.presenters.map(p => p.slackId).join('; '),
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `LT_Schedule_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV Exported",
      description: "Schedule has been downloaded as CSV file",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!canGenerate && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {!state.config 
                ? "Please configure the schedule settings first."
                : `Need at least ${state.config.presentersPerSession} participants to generate schedule.`
              }
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={generateSchedule}
            disabled={!canGenerate || isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Schedule'}
          </Button>
          
          {state.schedule.length > 0 && (
            <Button variant="outline" onClick={exportToCsv}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        {state.schedule.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Generated Schedule</h4>
              <Badge variant="secondary">
                {state.schedule.length} sessions
              </Badge>
            </div>
            
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Week</TableHead>
                    <TableHead>Presenters</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.schedule.map((session, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">
                        {format(session.date, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{session.weekNumber}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {session.presenters.map((presenter) => (
                            <Badge key={presenter.id} variant="outline">
                              <Users className="h-3 w-3 mr-1" />
                              {presenter.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {state.lastGenerated && (
              <p className="text-sm text-muted-foreground">
                Last generated: {format(state.lastGenerated, 'PPpp')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
