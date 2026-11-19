package com.tayson.desktop;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Guarda as notificações recentes para o centro de ações. Cada notificação é
 * identificada pela sua chave (sbn.getKey()), por isso várias mensagens da mesma
 * app ficam todas visíveis. Notificações contínuas (música, navegação) são ignoradas.
 */
public class DesktopNotificationListener extends NotificationListenerService {
    private static final int MAX_ITEMS = 40;
    public static volatile DesktopNotificationListener instance;
    private static final List<JSONObject> ITEMS =
            Collections.synchronizedList(new ArrayList<JSONObject>());

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        instance = this;
        try {
            StatusBarNotification[] active = getActiveNotifications();
            if (active != null) for (StatusBarNotification item : active) onNotificationPosted(item);
        } catch (Exception ignored) { }
    }

    @Override
    public void onDestroy() {
        instance = null;
        super.onDestroy();
    }

    public static void clearStoredNotifications() {
        synchronized (ITEMS) { ITEMS.clear(); }
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.isOngoing()) return;
        Notification notification = sbn.getNotification();
        if (notification == null) return;

        Bundle extras = notification.extras;
        String title = text(extras, Notification.EXTRA_TITLE);
        String body = text(extras, Notification.EXTRA_TEXT);
        if (title.isEmpty() && body.isEmpty()) return;

        try {
            JSONObject item = new JSONObject();
            item.put("key", sbn.getKey());
            item.put("packageName", sbn.getPackageName());
            item.put("title", title.isEmpty() ? "Notificação" : title);
            item.put("text", body);
            item.put("when", notification.when);
            synchronized (ITEMS) {
                removeByKey(sbn.getKey());
                ITEMS.add(0, item);
                while (ITEMS.size() > MAX_ITEMS) ITEMS.remove(ITEMS.size() - 1);
            }
        } catch (Exception ignored) { }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        if (sbn == null) return;
        synchronized (ITEMS) {
            removeByKey(sbn.getKey());
        }
    }

    /** Chamar sempre dentro de synchronized (ITEMS). */
    private static void removeByKey(String key) {
        if (key == null) return;
        for (int i = ITEMS.size() - 1; i >= 0; i--) {
            if (key.equals(ITEMS.get(i).optString("key"))) ITEMS.remove(i);
        }
    }

    private static String text(Bundle extras, String key) {
        if (extras == null) return "";
        CharSequence value = extras.getCharSequence(key);
        return value == null ? "" : value.toString().trim();
    }

    public static String getNotificationsJson() {
        JSONArray array = new JSONArray();
        synchronized (ITEMS) {
            for (JSONObject item : ITEMS) array.put(item);
        }
        return array.toString();
    }
}
