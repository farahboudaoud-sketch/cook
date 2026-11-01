package fr.carnetcuisine.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

/** Widget 2 × 2 « Ma semaine » : recettes choisies et courses restantes. Un appui ouvre l'appli. */
public class LauncherWidget extends AppWidgetProvider {

    static final String PREFS = "recap_widget";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
        for (int id : widgetIds) manager.updateAppWidget(id, build(context));
    }

    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, LauncherWidget.class));
        if (ids == null || ids.length == 0) return;
        RemoteViews views = build(context);
        for (int id : ids) manager.updateAppWidget(id, views);
    }

    static RemoteViews build(Context context) {
        SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int done = p.getInt("done", 0);
        int target = Math.max(1, p.getInt("target", 5));
        int todo = p.getInt("todo", 0);
        String budget = p.getString("budget", "");
        boolean set = p.getBoolean("set", false);

        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_launcher);
        v.setProgressBar(R.id.widget_ring, target, Math.min(done, target), false);
        v.setTextViewText(R.id.widget_ring_text, done + "/" + target);
        v.setTextViewText(R.id.widget_week_label, done > 1 ? "recettes\nchoisies" : "recette\nchoisie");

        String list;
        if (!set) list = "Ouvre l’appli";
        else if (todo == 0) list = done == 0 ? "Liste vide" : "Tout est acheté";
        else list = todo + " à acheter" + (budget.isEmpty() ? "" : " · ≈ " + budget);
        v.setTextViewText(R.id.widget_list_text, list);

        Intent open = new Intent(context, MainActivity.class);
        open.setAction(Intent.ACTION_MAIN);
        open.addCategory(Intent.CATEGORY_LAUNCHER);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        PendingIntent tap = PendingIntent.getActivity(
            context, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.widget_root, tap);
        return v;
    }
}
