package com.ninjadash.game;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = new WebView(this);

        webView.setWebViewClient(new WebViewClient());

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        webView.setBackgroundColor(0xFF080B12);
        webView.loadUrl("file:///android_asset/index.html");

        setContentView(webView);
    }

    @Override
    public void onBackPressed() {
        WebView webView = (WebView) findViewById(android.R.id.content);
        super.onBackPressed();
    }
}
