
import React, { useState, useEffect } from 'react';
import { Calendar, Settings, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useApp } from '../context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { ScheduleConfig as ScheduleConfigType } from '../types';

const daysOfWeek = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
];

const frequencyOptions = [
  { value: 1, label: 'Weekly' },
  { value: 2, label: 'Bi-weekly' },
  { value: 3, label: 'Every 3 weeks' },
  { value: 4, label: 'Monthly' },
];

export function ScheduleConfig() {
  const { state, setConfig } = useApp();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ScheduleConfigType>({
    startDate: new Date(),
    dayOfWeek: 3, // Wednesday
    frequency: 1, // Weekly
    presentersPerSession: 2,
  });

  useEffect(() => {
    if (state.config) {
      setFormData(state.config);
    }
  }, [state.config]);

  const handleSave = () => {
    if (formData.presentersPerSession > state.participants.length) {
      toast({
        title: "Invalid Configuration",
        description: `Presenters per session (${formData.presentersPerSession}) cannot exceed total participants (${state.participants.length})`,
        variant: "destructive",
      });
      return;
    }

    // Ensure start date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (formData.startDate < today) {
      toast({
        title: "Invalid Start Date",
        description: "Start date cannot be in the past",
        variant: "destructive",
      });
      return;
    }

    setConfig(formData);
    toast({
      title: "Configuration Saved",
      description: "Schedule configuration has been updated",
    });
  };

  const isConfigValid = () => {
    return (
      formData.startDate &&
      formData.dayOfWeek &&
      formData.frequency > 0 &&
      formData.presentersPerSession > 0 &&
      formData.presentersPerSession <= state.participants.length
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Schedule Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {state.participants.length === 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Please add participants before configuring the schedule.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.startDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={formData.startDate}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, startDate: date }))}
                  disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Day of Week */}
          <div className="space-y-2">
            <Label>Day of Week</Label>
            <Select
              value={formData.dayOfWeek.toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map((day) => (
                  <SelectItem key={day.value} value={day.value.toString()}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select
              value={formData.frequency.toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value.toString()}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Presenters per Session */}
          <div className="space-y-2">
            <Label>Presenters per Session</Label>
            <Input
              type="number"
              min="1"
              max={state.participants.length || 10}
              value={formData.presentersPerSession}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                presentersPerSession: Math.max(1, parseInt(e.target.value) || 1)
              }))}
            />
            <p className="text-sm text-muted-foreground">
              Maximum: {state.participants.length} (total participants)
            </p>
          </div>
        </div>

        {/* Summary */}
        {isConfigValid() && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Configuration Summary
            </h4>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>Start: {format(formData.startDate, "PPP")}</p>
              <p>Day: {daysOfWeek.find(d => d.value === formData.dayOfWeek)?.label}</p>
              <p>Frequency: {frequencyOptions.find(f => f.value === formData.frequency)?.label}</p>
              <p>Presenters: {formData.presentersPerSession} per session</p>
            </div>
          </div>
        )}

        <Button 
          onClick={handleSave} 
          disabled={!isConfigValid() || state.participants.length === 0}
          className="w-full"
        >
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  );
}
