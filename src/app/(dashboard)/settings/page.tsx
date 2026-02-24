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
import { Loader2, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface SettingsForm {
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
}

const initialSettings: SettingsForm = {
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
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsForm>(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.settings) {
          setSettings({
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
              Power the website generator with Google Gemini AI
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Collection</CardTitle>
            <CardDescription>
              APIs for finding and analyzing businesses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ApiKeyInput
              id="outscraper_api_key"
              label="Outscraper API Key"
              value={settings.outscraper_api_key}
              placeholder="Your Outscraper API key"
            />
            <ApiKeyInput
              id="google_pagespeed_key"
              label="Google PageSpeed API Key"
              value={settings.google_pagespeed_key}
              placeholder="Your Google API key"
            />
            <ApiKeyInput
              id="hunter_api_key"
              label="Hunter.io API Key"
              value={settings.hunter_api_key}
              placeholder="Your Hunter.io API key"
            />
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
