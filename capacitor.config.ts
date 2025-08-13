import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.digitalbinderpro.app',
  appName: 'Digital Binder Pro',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
