
import { ParticipantManager } from '../components/ParticipantManager';
import { ScheduleConfig } from '../components/ScheduleConfig';
import { ScheduleGenerator } from '../components/ScheduleGenerator';
import { AppProvider } from '../context/AppContext';

const Index = () => {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Lunch Lightning Talk Scheduler
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Automate your lunch lightning talk scheduling with smart rotation, holiday awareness, and Slack integration.
            </p>
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
          <div className="text-center mt-12 text-slate-400">
            <p className="text-sm">
              Built with ❤️ for productive lunch sessions
            </p>
          </div>
        </div>
      </div>
    </AppProvider>
  );
};

export default Index;
