import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ScoutThemeToggle } from './components/layout/ScoutThemeToggle';
import './index.css';
import { dynamicManifestService } from './services/dynamicManifestService';

// Initialize dynamic customer-owned PWA branding (Req 36-37)
dynamicManifestService.initDynamicManifest();

createRoot(document.getElementById('root')!).render(<><App /><ScoutThemeToggle /></>);
