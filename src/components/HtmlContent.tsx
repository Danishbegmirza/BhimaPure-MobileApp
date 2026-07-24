import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View, type TextStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

type Props = {
  html: string;
  baseStyle?: TextStyle;
  /** Total horizontal space outside the HTML block (screen padding + card padding). */
  horizontalInset?: number;
};

function buildHtmlDocument(
  body: string,
  fontSize: number,
  color: string,
  lineHeight: number,
): string {
  const cleaned = body.replace(/\r\n/g, '\n').trim();
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: transparent;
      overflow: hidden !important;
      height: auto;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: ${fontSize}px;
      line-height: ${lineHeight}px;
      color: ${color};
      -webkit-text-size-adjust: 100%;
      touch-action: manipulation;
    }
    ul, ol {
      margin: 8px 0 12px;
      padding-left: 18px;
    }
    li {
      margin-bottom: 8px;
      text-align: left;
    }
    p {
      margin: 0 0 8px;
    }
    .scheme-details {
      width: 100%;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      max-width: 100%;
      margin: 12px auto;
      font-size: ${Math.max(fontSize - 1, 9)}px;
      table-layout: fixed;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px 4px;
      vertical-align: middle;
      text-align: center;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    th {
      font-weight: 700;
      background: #F8FAFC;
    }
    .table-scroll,
    div[style*="overflow-x"] {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
  </style>
</head>
<body>${cleaned}</body>
</html>`;
}

const HEIGHT_SCRIPT = `
(function() {
  function postHeight() {
    var height = Math.max(
      document.documentElement.scrollHeight || 0,
      document.body.scrollHeight || 0
    );
    window.ReactNativeWebView.postMessage(String(height));
  }
  postHeight();
  setTimeout(postHeight, 250);
})();
true;
`;

export function HtmlContent({ html, baseStyle, horizontalInset: _horizontalInset = 56 }: Props) {
  const [webViewHeight, setWebViewHeight] = useState(160);
  const lastHeightRef = useRef(0);
  const webViewRef = useRef<WebView>(null);

  const fontSize = baseStyle?.fontSize ?? 11;
  const color = baseStyle?.color ?? '#4B5563';
  const lineHeight = baseStyle?.lineHeight ?? 18;

  const source = useMemo(
    () => ({ html: buildHtmlDocument(html, fontSize, color, lineHeight) }),
    [html, fontSize, color, lineHeight],
  );

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    const nextHeight = Math.ceil(Number(event.nativeEvent.data)) + 4;
    if (
      !Number.isNaN(nextHeight)
      && nextHeight > 0
      && Math.abs(nextHeight - lastHeightRef.current) > 2
    ) {
      lastHeightRef.current = nextHeight;
      setWebViewHeight(nextHeight);
    }
  }, []);

  const measureHeight = useCallback(() => {
    webViewRef.current?.injectJavaScript(HEIGHT_SCRIPT);
  }, []);

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={source}
        style={[styles.webview, { height: webViewHeight }]}
        pointerEvents="none"
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={false}
        onLoadEnd={measureHeight}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        automaticallyAdjustContentInsets={false}
        setBuiltInZoomControls={false}
        scalesPageToFit={false}
        androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
  },
  webview: {
    width: '100%',
    backgroundColor: 'transparent',
    opacity: 0.99,
  },
});
