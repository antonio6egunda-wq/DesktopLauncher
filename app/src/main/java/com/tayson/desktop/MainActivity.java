package com.tayson.desktop;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.net.wifi.WifiManager;
import android.bluetooth.BluetoothAdapter;
import android.provider.Settings;
import android.content.Context;
import android.os.Build;
import android.content.pm.ResolveInfo;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Atividade principal do launcher. Aloja uma WebView com a interface em
 * assets/ e expõe à página a ponte "Desktop" (ver DesktopBridge).
 */
public class MainActivity extends Activity {
    private static final int ICON_PX = 96;
    private static final String ICON_NAME_PATTERN = "[a-z0-9_]+";

    private WebView webView;
    /** Cache de ícones já convertidos para data URI. Chaves: "app:<pacote>" e "res:<nome>". */
    private final Map<String, String> iconCache = new ConcurrentHashMap<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enterImmersiveMode();

        webView = new WebView(this);
        webView.setBackgroundColor(0xFF101820);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setHapticFeedbackEnabled(false);
        // Impede a seleção de texto e o menu de contexto nativo com toque longo.
        webView.setOnLongClickListener(v -> true);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true); // Apenas assets locais; não carregar conteúdo remoto nesta WebView.
        settings.setAllowContentAccess(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient());
        webView.addJavascriptInterface(new DesktopBridge(), "Desktop");
        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("Desktop");
            webView.destroy();
        }
        super.onDestroy();
    }

    @SuppressWarnings("deprecation")
    private void enterImmersiveMode() {
        View decor = getWindow().getDecorView();
        decor.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) enterImmersiveMode();
    }

    /** Num launcher, o botão Voltar só fecha painéis abertos (a página decide). */
    @Override
    public void onBackPressed() {
        if (webView != null) {
            webView.evaluateJavascript("window.desktopBack && window.desktopBack()", null);
        }
    }

    /** Converte um Drawable num PNG 96×96 codificado em data URI para a WebView. */
    private static String toDataUri(Drawable drawable) {
        Bitmap bitmap = Bitmap.createBitmap(ICON_PX, ICON_PX, Bitmap.Config.ARGB_8888);
        try {
            Canvas canvas = new Canvas(bitmap);
            drawable.setBounds(0, 0, ICON_PX, ICON_PX);
            drawable.draw(canvas);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out);
            return "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
        } finally {
            bitmap.recycle();
        }
    }

    /** Métodos chamados a partir de js/desktop.js através de window.Desktop. */
    private class DesktopBridge {

        /** Lista JSON das aplicações lançáveis, ordenada pelo nome, sem o próprio launcher. */
        @JavascriptInterface
        public String getApps() {
            PackageManager pm = getPackageManager();
            Intent intent = new Intent(Intent.ACTION_MAIN);
            intent.addCategory(Intent.CATEGORY_LAUNCHER);
            List<ResolveInfo> infos = pm.queryIntentActivities(intent, 0);

            // Uma entrada por pacote (algumas apps têm várias atividades lançáveis).
            Map<String, String> names = new LinkedHashMap<>();
            for (ResolveInfo info : infos) {
                String pkg = info.activityInfo.packageName;
                if (pkg.equals(getPackageName()) || names.containsKey(pkg)) continue;
                names.put(pkg, String.valueOf(info.loadLabel(pm)));
            }

            List<Map.Entry<String, String>> entries = new ArrayList<>(names.entrySet());
            Collections.sort(entries, (a, b) -> a.getValue().compareToIgnoreCase(b.getValue()));

            JSONArray result = new JSONArray();
            try {
                for (Map.Entry<String, String> entry : entries) {
                    JSONObject app = new JSONObject();
                    app.put("name", entry.getValue());
                    app.put("packageName", entry.getKey());
                    result.put(app);
                }
            } catch (Exception ignored) { }
            return result.toString();
        }

        /** Ícone real da aplicação (via PackageManager) como data URI, ou "" se não existir. */
        @JavascriptInterface
        public String getAppIcon(String packageName) {
            if (packageName == null) return "";
            String key = "app:" + packageName;
            String cached = iconCache.get(key);
            if (cached != null) return cached;
            String uri = "";
            try {
                uri = toDataUri(getPackageManager().getApplicationIcon(packageName));
            } catch (Exception ignored) { }
            iconCache.put(key, uri);
            return uri;
        }

        /**
         * Ícone do próprio launcher, a partir de res/drawable (ic_*.xml ou ic_app_*.png),
         * como data URI. Devolve "" se o recurso não existir.
         */
        @JavascriptInterface
        public String getIcon(String name) {
            if (name == null || !name.matches(ICON_NAME_PATTERN)) return "";
            String key = "res:" + name;
            String cached = iconCache.get(key);
            if (cached != null) return cached;
            String uri = "";
            int id = getResources().getIdentifier(name, "drawable", getPackageName());
            if (id != 0) {
                try {
                    uri = toDataUri(getResources().getDrawable(id, getTheme()));
                } catch (Exception ignored) { }
            }
            iconCache.put(key, uri);
            return uri;
        }

        @JavascriptInterface
        public void openApp(String packageName) {
            try {
                Intent launch = getPackageManager().getLaunchIntentForPackage(packageName);
                if (launch != null) {
                    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(launch);
                }
            } catch (Exception ignored) { }
        }

        @JavascriptInterface
        public void openNotificationAccess() {
            try {
                startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS));
            } catch (Exception ignored) { }
        }

        @JavascriptInterface
        public String getNotifications() {
            return DesktopNotificationListener.getNotificationsJson();
        }

        /** Verifica se o serviço de notificações está ativo nas definições do Android. */
        @JavascriptInterface
        public boolean hasNotificationAccess() {
            ComponentName listener = new ComponentName(MainActivity.this, DesktopNotificationListener.class);
            String enabled = Settings.Secure.getString(
                    getContentResolver(), "enabled_notification_listeners");
            return enabled != null && enabled.contains(listener.flattenToString());
        }

        @JavascriptInterface
        public void clearNotifications() {
            try {
                if (DesktopNotificationListener.instance != null) {
                    DesktopNotificationListener.instance.cancelAllNotifications();
                }
                DesktopNotificationListener.clearStoredNotifications();
            } catch (Exception ignored) { }
        }

        /** Dispensa uma notificação: remove-a do sistema (se o serviço estiver ligado) e da lista. */
        @JavascriptInterface
        public void dismissNotification(String key) {
            if (key == null || key.isEmpty()) return;
            try {
                if (DesktopNotificationListener.instance != null) {
                    DesktopNotificationListener.instance.cancelNotification(key);
                }
            } catch (Exception ignored) { }
            DesktopNotificationListener.removeStoredNotification(key);
        }

        @JavascriptInterface
        public int getVolume() {
            AudioManager audio = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            int max = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            return max == 0 ? 0 : Math.round(audio.getStreamVolume(AudioManager.STREAM_MUSIC) * 100f / max);
        }

        @JavascriptInterface
        public void setVolume(int percent) {
            AudioManager audio = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            int max = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            int value = Math.max(0, Math.min(100, percent));
            audio.setStreamVolume(AudioManager.STREAM_MUSIC, Math.round(max * value / 100f), 0);
        }

        @JavascriptInterface
        public void toggleMute() {
            AudioManager audio = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            int current = audio.getStreamVolume(AudioManager.STREAM_MUSIC);
            audio.setStreamVolume(AudioManager.STREAM_MUSIC,
                    current == 0 ? Math.max(1, audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC) / 2) : 0, 0);
        }

        @JavascriptInterface
        public boolean isWifiEnabled() {
            try {
                WifiManager wifi = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                return wifi != null && wifi.isWifiEnabled();
            } catch (Exception e) { return false; }
        }

        @JavascriptInterface
        public boolean toggleWifi() {
            try {
                if (Build.VERSION.SDK_INT < 29) {
                    WifiManager wifi = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                    return wifi != null && wifi.setWifiEnabled(!wifi.isWifiEnabled());
                }
            } catch (Exception ignored) { }
            openWifiSettings();
            return false;
        }

        @JavascriptInterface
        public boolean isBluetoothEnabled() {
            try {
                BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
                return adapter != null && adapter.isEnabled();
            } catch (Exception e) { return false; }
        }

        @JavascriptInterface
        public boolean toggleBluetooth() {
            try {
                BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
                if (adapter != null && Build.VERSION.SDK_INT < 33) {
                    return adapter.isEnabled() ? adapter.disable() : adapter.enable();
                }
            } catch (Exception ignored) { }
            openBluetoothSettings();
            return false;
        }

        @JavascriptInterface
        public void openWifiSettings() {
            try {
                if (Build.VERSION.SDK_INT >= 29) {
                    startActivity(new Intent(Settings.Panel.ACTION_WIFI));
                } else {
                    startActivity(new Intent(Settings.ACTION_WIFI_SETTINGS));
                }
            } catch (Exception e) {
                try { startActivity(new Intent(Settings.ACTION_WIFI_SETTINGS)); } catch (Exception ignored) { }
            }
        }

        @JavascriptInterface
        public void openBluetoothSettings() {
            try { startActivity(new Intent(Settings.ACTION_BLUETOOTH_SETTINGS)); }
            catch (Exception ignored) { }
        }

        @JavascriptInterface
        public void openLocationSettings() {
            try { startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)); }
            catch (Exception ignored) { }
        }

        @JavascriptInterface
        public int getBrightness() {
            try {
                return Math.round(Settings.System.getInt(getContentResolver(),
                        Settings.System.SCREEN_BRIGHTNESS) * 100f / 255f);
            } catch (Exception e) { return 50; }
        }

        @JavascriptInterface
        public boolean canWriteSettings() {
            return Build.VERSION.SDK_INT < 23 || Settings.System.canWrite(MainActivity.this);
        }

        @JavascriptInterface
        public void requestBrightnessPermission() {
            if (Build.VERSION.SDK_INT >= 23 && !Settings.System.canWrite(MainActivity.this)) {
                try {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS,
                            android.net.Uri.parse("package:" + getPackageName()));
                    startActivity(intent);
                } catch (Exception ignored) { }
            }
        }

        @JavascriptInterface
        public void setBrightness(int percent) {
            int value = Math.max(1, Math.min(100, percent));
            if (Build.VERSION.SDK_INT >= 23 && !Settings.System.canWrite(MainActivity.this)) {
                requestBrightnessPermission();
                return;
            }
            try {
                Settings.System.putInt(getContentResolver(), Settings.System.SCREEN_BRIGHTNESS,
                        Math.round(value * 255f / 100f));
            } catch (Exception ignored) { }
        }

        @JavascriptInterface
        public void openGoogleSearch(String query) {
            try {
                String q = query == null ? "" : query.trim();
                Intent intent = new Intent(Intent.ACTION_VIEW,
                        android.net.Uri.parse("https://www.google.com/search?q=" + android.net.Uri.encode(q)));
                startActivity(intent);
            } catch (Exception ignored) { }
        }

        @JavascriptInterface
        public void openAndroidSettings() {
            try {
                startActivity(new Intent(Settings.ACTION_SETTINGS));
            } catch (Exception ignored) { }
        }
    }
}
