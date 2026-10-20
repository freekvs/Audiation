import { registerRootComponent } from 'expo';
import { AppRegistry, Platform } from 'react-native';

import App from './App';

registerRootComponent(App);

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const rootTag = document.getElementById('root');
  if (rootTag && rootTag.childElementCount === 0) {
    AppRegistry.runApplication('main', { rootTag });
  }
}
