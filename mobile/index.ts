// Purpose: Mobile application entry point that registers the root component with Expo runtime.
// Imported by: none (mobile application entry point)

import { registerRootComponent } from 'expo';
import App from './App';

// Registers App component so it loads properly in Expo Go and native Android environments
registerRootComponent(App);
