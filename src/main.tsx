import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SettingsForm } from './components/SettingsForm';
import type { SettingsFormValues } from './types/settings';
import './index.css';

function App() {
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleSubmit = async (values: SettingsFormValues) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    console.info('Settings saved:', values);
    setSavedMessage('Settings saved successfully.');
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      {savedMessage && (
        <div className="mx-auto mb-6 max-w-2xl rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {savedMessage}
        </div>
      )}
      <SettingsForm onSubmit={handleSubmit} onCancel={() => setSavedMessage(null)} />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
