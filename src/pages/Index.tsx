
import { ParticipantManager } from '../components/ParticipantManager';
import { ScheduleConfig } from '../components/ScheduleConfig';
import { ScheduleGenerator } from '../components/ScheduleGenerator';
import { ScheduleList } from '../components/ScheduleList';
import { AppProvider } from '../context/AppContext';

const Index = () => {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
              ランチライトニングトーク スケジューラー
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto">
              スマートなローテーション、祝日認識、Slack連携により、ランチライトニングトークのスケジューリングを自動化します。
            </p>
          </div>

          {/* Schedule List - 一番上に表示 */}
          <div className="mb-8 max-w-7xl mx-auto">
            <ScheduleList />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* Left Column */}
            <div className="space-y-8">
              <div className="animate-fade-in">
                <ParticipantManager />
              </div>
              <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <ScheduleConfig />
              </div>
            </div>

            {/* Right Column */}
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <ScheduleGenerator />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-slate-500">
            <p className="text-sm">
              生産的なランチセッションのために ❤️ で作られました
            </p>
          </div>
        </div>
      </div>
    </AppProvider>
  );
};

export default Index;
