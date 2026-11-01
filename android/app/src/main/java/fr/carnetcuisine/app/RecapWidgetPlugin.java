package fr.carnetcuisine.app;

import android.content.Context;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Reçoit de l'appli le résumé de la semaine et des courses, puis rafraîchit le widget. */
@CapacitorPlugin(name = "RecapWidget")
public class RecapWidgetPlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        Context ctx = getContext();
        ctx.getSharedPreferences(LauncherWidget.PREFS, Context.MODE_PRIVATE)
            .edit()
            .putInt("done", call.getInt("done", 0))
            .putInt("target", call.getInt("target", 5))
            .putInt("todo", call.getInt("todo", 0))
            .putString("budget", call.getString("budget", ""))
            .putBoolean("set", true)
            .apply();
        LauncherWidget.refreshAll(ctx);
        call.resolve();
    }
}
