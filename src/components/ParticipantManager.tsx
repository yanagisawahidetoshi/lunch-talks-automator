
import React, { useState } from 'react';
import { Plus, Trash2, Upload, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '../context/AppContext';
import { useToast } from '@/hooks/use-toast';

export function ParticipantManager() {
  const { state, addParticipant, removeParticipant, bulkAddParticipants } = useApp();
  const { toast } = useToast();
  const [newParticipant, setNewParticipant] = useState({ name: '', slackId: '' });
  const [bulkData, setBulkData] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipant.name.trim() || !newParticipant.slackId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both name and Slack ID",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate Slack ID
    const duplicate = state.participants.find(p => p.slackId === newParticipant.slackId);
    if (duplicate) {
      toast({
        title: "Duplicate Slack ID",
        description: "This Slack ID is already registered",
        variant: "destructive",
      });
      return;
    }

    addParticipant(newParticipant);
    setNewParticipant({ name: '', slackId: '' });
    toast({
      title: "Participant Added",
      description: `${newParticipant.name} has been added to the list`,
    });
  };

  const handleBulkImport = () => {
    if (!bulkData.trim()) return;

    const lines = bulkData.trim().split('\n');
    const participants = [];
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(/[,\t]/).map(part => part.trim());
      if (parts.length !== 2) {
        errors.push(`Line ${i + 1}: Invalid format`);
        continue;
      }

      const [name, slackId] = parts;
      if (!name || !slackId) {
        errors.push(`Line ${i + 1}: Missing name or Slack ID`);
        continue;
      }

      // Check for duplicate Slack ID
      const duplicate = state.participants.find(p => p.slackId === slackId);
      if (duplicate) {
        errors.push(`Line ${i + 1}: Slack ID ${slackId} already exists`);
        continue;
      }

      participants.push({ name, slackId });
    }

    if (errors.length > 0) {
      toast({
        title: "Import Errors",
        description: errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    if (participants.length > 0) {
      bulkAddParticipants(participants);
      setBulkData('');
      setShowBulkImport(false);
      toast({
        title: "Bulk Import Successful",
        description: `${participants.length} participants added`,
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participants ({state.participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Single Participant */}
        <form onSubmit={handleAddParticipant} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newParticipant.name}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter participant name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="slackId">Slack ID</Label>
              <Input
                id="slackId"
                value={newParticipant.slackId}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, slackId: e.target.value }))}
                placeholder="@username or U123456789"
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Add Participant
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBulkImport(!showBulkImport)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
          </div>
        </form>

        {/* Bulk Import */}
        {showBulkImport && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="bulkData">Bulk Import Data</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Paste data with one participant per line, separated by comma or tab (Name, SlackID)
              </p>
              <Textarea
                id="bulkData"
                value={bulkData}
                onChange={(e) => setBulkData(e.target.value)}
                placeholder="John Doe, @johndoe&#10;Jane Smith, @janesmith"
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleBulkImport} disabled={!bulkData.trim()}>
                Import Participants
              </Button>
              <Button variant="outline" onClick={() => setShowBulkImport(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Participants List */}
        {state.participants.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Current Participants:</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {state.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{participant.name}</p>
                    <p className="text-sm text-muted-foreground">{participant.slackId}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParticipant(participant.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.participants.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No participants added yet</p>
            <p className="text-sm">Add participants to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
