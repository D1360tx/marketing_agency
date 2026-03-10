"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Eye, EyeOff, Webhook } from "lucide-react";
import { toast } from "sonner";

interface SettingsForm {
  brave_api_key: string;
  outscraper_api_key: string;
  google_pagespeed_key: string;
  hunter_api_key: string;
  resend_api_key: string;
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
  sender_email: string;
  sender_name: string;
  gemini_api_key: string;
  anthropic_api_key: string;
}

const initialSettings: SettingsForm = {
  brave_api_key: "",
  outscraper_api_key: "",
  google_pagespeed_key: "",
  hunter_api_key: "",
  resend_api_key: "",
  twilio_account_sid: "",
  twilio_auth_token: "",
  twilio_phone_number: "",
  sender_email: "",
  sender_name: "",
  gemini_api_key: "",
  anthropic_api_key: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsForm>(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.settings) {
          setWebhookUrl(data.settings.webhook_url || "");
          setSettings({
            brave_api_key: data.settings.brave_api_key || "",
            outscraper_api_key: data.settings.outscraper_api_key || "",
            google_pagespeed_key: data.settings.google_pagespeed_key || "",
            hunter_api_key: data.settings.hunter_api_key || "",
            resend_api_key: data.settings.resend_api_key || "",
            twilio_account_sid: data.settings.twilio_account_sid || "",
            twilio_auth_token: data.settings.twilio_auth_token || "",
            twilio_phone_number: data.settings.twilio_phone_number || "",
            sender_email: data.settings.sender_email || "",
            sender_name: data.settings.sender_name || "",
            gemini_api_key: data.settings.gemini_api_key || "",
            anthropic_api_key: data.settings.anthropic_api_key || "",
          });
        }
      } catch {
        console.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success("Settings saved successfully");
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleWebhookSave() {
    setSavingWebhook(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, webhook_url: webhookUrl }),
      });
      if (res.ok) {
        toast.success("Webhook URL saved");
      } else {
        toast.error("Failed to save webhook URL");
      }
    } catch {
      toast.error("Failed to save webhook URL");
    } finally {
      setSavingWebhook(false);
    }
  }

  function toggleShow(key: string) {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function ApiKeyInput({
    id,
    label,
    value,
    placeholder,
  }: {
    id: keyof SettingsForm;
    label: string;
    value: string;
    placeholder: string;
  }) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="flex gap-2">
          <Input
            id={id}
            type={showKeys[id] ? "text" : "password"}
            placeholder={placeholder}
            value={value}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, [id]: e.target.value }))
            }
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => toggleShow(id)}
          >
            {showKeys[id] ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your API keys and preferences
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Website Generation</CardTitle>
            <CardDescription>
              Power the website generator with Gemini and Claude AI. Both run in parallel when configured.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ApiKeyInput
              id="gemini_api_key"
              label="Gemini API Key"
              value={settings.gemini_api_key}
              placeholder="AIzaSy..."
            />
            <p className="text-xs text-muted-foreground">
              Get a free API key from{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Google AI Studio
              </a>
            </p>
            <Separator />
            <ApiKeyInput
              id="anthropic_api_key"
              label="Anthropic API Key (Claude)"
              value={settings.anthropic_api_key}
              placeholder="sk-ant-..."
            />
            <p className="text-xs text-muted-foreground">
              Get an API key from{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Anthropic Console
              </a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Search</CardTitle>
            <CardDescription>
              Find local businesses to prospect. Brave Search is free and used as the primary source.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ApiKeyInput
              id="brave_api_key"
              label="Brave Search API Key (Recommended — Free)"
              value={settings.brave_api_key}
              placeholder="BSA..."
            />
            <p className="text-xs text-muted-foreground">
              Free $5/mo credit (~2,000 searches). Get a key from{" "}
              <a
                href="https://brave.com/search/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Brave Search API
              </a>
            </p>
            <Separator />
            <ApiKeyInput
              id="outscraper_api_key"
              label="Outscraper API Key (Fallback — Paid)"
              value={settings.outscraper_api_key}
              placeholder="Your Outscraper API key"
            />
            <p className="text-xs text-muted-foreground">
              Optional fallback. Only used if Brave Search fails.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Website Analysis & Email Discovery</CardTitle>
            <CardDescription>
              Analyze prospect websites and find contact emails. Email extraction from websites is automatic and free — Hunter.io is an optional fallback.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ApiKeyInput
              id="google_pagespeed_key"
              label="Google PageSpeed API Key (Optional)"
              value={settings.google_pagespeed_key}
              placeholder="Your Google API key"
            />
            <p className="text-xs text-muted-foreground">
              Optional — PageSpeed works without a key but has lower rate limits.
            </p>
            <Separator />
            <ApiKeyInput
              id="hunter_api_key"
              label="Hunter.io API Key (Email Fallback — Paid)"
              value={settings.hunter_api_key}
              placeholder="Your Hunter.io API key"
            />
            <p className="text-xs text-muted-foreground">
              Optional fallback for email discovery. Emails are first extracted directly from websites for free.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Outreach</CardTitle>
            <CardDescription>
              Configure your email sending service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ApiKeyInput
              id="resend_api_key"
              label="Resend API Key"
              value={settings.resend_api_key}
              placeholder="re_..."
            />
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="sender_name">Sender Name</Label>
              <Input
                id="sender_name"
                placeholder="Your Name or Agency Name"
                value={settings.sender_name}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    sender_name: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sender_email">Sender Email</Label>
              <Input
                id="sender_email"
                type="email"
                placeholder="you@yourdomain.com"
                value={settings.sender_email}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    sender_email: e.target.value,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SMS Outreach (Twilio)</CardTitle>
            <CardDescription>
              Configure SMS messaging via Twilio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ApiKeyInput
              id="twilio_account_sid"
              label="Account SID"
              value={settings.twilio_account_sid}
              placeholder="AC..."
            />
            <ApiKeyInput
              id="twilio_auth_token"
              label="Auth Token"
              value={settings.twilio_auth_token}
              placeholder="Your auth token"
            />
            <div className="space-y-2">
              <Label htmlFor="twilio_phone_number">Phone Number</Label>
              <Input
                id="twilio_phone_number"
                placeholder="+1234567890"
                value={settings.twilio_phone_number}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    twilio_phone_number: e.target.value,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Integrations
            </CardTitle>
            <CardDescription>
              Connect Booked Out to external tools via webhooks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook_url">Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  id="webhook_url"
                  type="url"
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleWebhookSave}
                  disabled={savingWebhook}
                >
                  {savingWebhook ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Fires when a lead is converted to <strong>Client</strong> status. Connect to GHL, Zapier, Make.com, or any webhook endpoint.
              </p>
              <p className="text-xs text-muted-foreground">
                Payload includes: business name, contact, email, phone, city, website.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
