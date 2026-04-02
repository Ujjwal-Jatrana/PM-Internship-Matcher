import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, Platform, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useEffect } from 'react';

// The URL to your web app hosted via GitHub Pages or local dev
// For production: deploy your dist/ folder to GitHub Pages and use that URL
// For development: use your local IP (find it with ipconfig)
const WEB_APP_URL = 'https://ujjwal-jatrana.github.io/PM-Internship-Matcher/';
// Fallback for local development (replace with your PC's local IP):
// const WEB_APP_URL = 'http://192.168.X.X:5173/';

export default function App() {
  const webViewRef = useRef<WebView>(null);

  // Handle Android back button to navigate back in WebView
  useEffect(() => {
    if (Platform.OS === 'android') {
      const onBackPress = () => {
        if (webViewRef.current) {
          webViewRef.current.goBack();
          return true; // Prevent app from closing
        }
        return false;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_APP_URL }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsBackForwardNavigationGestures={true}
        // Allow mixed content for development
        mixedContentMode="compatibility"
        // Custom user agent to identify mobile app
        userAgent="InternMatch-Mobile/1.0"
        // Inject CSS to handle mobile viewport properly
        injectedJavaScript={`
          const meta = document.createElement('meta');
          meta.setAttribute('name', 'viewport');
          meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
          document.head.appendChild(meta);
          true;
        `}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  webview: {
    flex: 1,
  },
});
