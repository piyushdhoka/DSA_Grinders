"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/AuthContext";
import {
  Loader2,
  Send,
  Mail,
  MessageCircle,
  Users,
  Zap,
  Shield,
  LogOut,
  Clock,
  LayoutDashboard,
  Settings as SettingsIcon,
  Check,
  AlertCircle,
  RefreshCw
} from "lucide-react";



export default function AdminPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'messages' | 'system'>('messages');

  // Form states
  const [emailSubject, setEmailSubject] = useState("DSA Grinders - Daily Digest 🔥");
  const [emailMessage, setEmailMessage] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [messageType, setMessageType] = useState<'email' | 'whatsapp' | 'both'>('both');

  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  // Settings state
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [isSettingsUpdating, setIsSettingsUpdating] = useState(false);

  // Use either manual token or Google Auth token
  const effectiveToken = adminToken || token;
  const isAdmin = (user?.role === 'admin') || !!adminToken;

  useEffect(() => {
    const savedToken = localStorage.getItem('admin_session');
    if (savedToken) setAdminToken(savedToken);
  }, []);

  useEffect(() => {
    if (!authLoading && !user && !adminToken) {
      setShowLogin(true);
    } else {
      setShowLogin(false);
    }
  }, [user, authLoading, adminToken]);

  useEffect(() => {
    if (isAdmin && effectiveToken) {
      fetchUsers();
      fetchSettings();
    }
  }, [isAdmin, effectiveToken]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, password: adminPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdminToken(data.token);
        localStorage.setItem('admin_session', data.token);
        setSuccess("Admin access granted!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (adminToken) {
      setAdminToken(null);
      localStorage.removeItem('admin_session');
    }
    logout();
  };

  const fetchUsers = async () => {
    if (!effectiveToken) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${effectiveToken}` }
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    if (!effectiveToken) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${effectiveToken}` }
      });
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setGlobalSettings(data.settings);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async () => {
    if (!effectiveToken || !globalSettings) return;
    setIsSettingsUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${effectiveToken}`
        },
        body: JSON.stringify(globalSettings),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      const data = await res.json();
      setGlobalSettings(data.settings);
      setSuccess("Global settings updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSettingsUpdating(false);
    }
  };

  const handleSyncUser = async (userId: string) => {
    if (!effectiveToken) return;
    setSuccess("Syncing user stats...");

    try {
      const res = await fetch("/api/admin/users/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${effectiveToken}`
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Sync failed");

      setSuccess(`Synced stats for user! Today's points: ${data.data?.todayPoints ?? 'N/A'}`);
      fetchUsers();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Sync failed: ${err.message}`);
    }
  };

  const triggerCronJob = async () => {
    setIsSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/cron", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'BcndjbeihGgdw9hed'}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to trigger cron");
      setSuccess(`🎉 Cron job triggered! Result: ${data.message || 'Success'}`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(`Cron execution failed: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const sendCustomMessages = async () => {
    if (selectedUsers.length === 0) {
      setError("Please select at least one user");
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/send-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${effectiveToken}`
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          messageType,
          emailSubject: emailSubject.trim(),
          emailMessage: emailMessage.trim(),
          whatsappMessage: whatsappMessage.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to send messages");
      setSuccess(`Messages sent to ${selectedUsers.length} users!`);
      setSelectedUsers([]);
      setEmailMessage("");
      setWhatsappMessage("");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-gray-100"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
            <p className="text-gray-500 mt-2">Enter credentials for Super Admin access</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <Label htmlFor="adminId">Admin ID</Label>
              <Input
                id="adminId"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="admin"
                className="mt-1.5 h-12 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 h-12 rounded-xl"
              />
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Sign In to Console"}
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-red-600" />
            <span className="text-xl font-bold">Admin <span className="text-gray-400 font-normal">Console</span></span>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-gray-500">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto pt-10 px-6">
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 bg-green-50 text-green-600 p-4 rounded-xl border border-green-100">
            {success}
          </motion.div>
        )}

        <div className="flex gap-4 mb-8">
          <Button
            variant={activeTab === 'messages' ? 'default' : 'outline'}
            onClick={() => setActiveTab('messages')}
            className="rounded-full px-8"
          >
            <Send className="w-4 h-4 mr-2" /> Broadcast
          </Button>
          <Button
            variant={activeTab === 'system' ? 'default' : 'outline'}
            onClick={() => setActiveTab('system')}
            className="rounded-full px-8"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" /> System
          </Button>
        </div>

        {activeTab === 'messages' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Mail className="text-blue-500" /> Send Custom Message
                </h2>

                <div className="space-y-6">
                  <div className="flex p-1 bg-gray-100 rounded-xl">
                    {['email', 'whatsapp', 'both'].map(t => (
                      <button
                        key={t}
                        onClick={() => setMessageType(t as any)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${messageType === t ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {messageType !== 'whatsapp' && (
                    <div className="space-y-4">
                      <Input
                        placeholder="Subject"
                        value={emailSubject}
                        onChange={e => setEmailSubject(e.target.value)}
                        className="h-12"
                      />
                      <Textarea
                        placeholder="Email Body (Markdown supported)"
                        rows={6}
                        value={emailMessage}
                        onChange={e => setEmailMessage(e.target.value)}
                      />
                    </div>
                  )}

                  {messageType !== 'email' && (
                    <Textarea
                      placeholder="WhatsApp Message Content"
                      rows={4}
                      value={whatsappMessage}
                      onChange={e => setWhatsappMessage(e.target.value)}
                    />
                  )}

                  <Button
                    className="w-full h-14 rounded-2xl text-lg font-bold bg-blue-600"
                    onClick={sendCustomMessages}
                    disabled={isSending || selectedUsers.length === 0}
                  >
                    {isSending ? <Loader2 className="animate-spin" /> : `Send to ${selectedUsers.length} Users`}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm h-fit">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Select Users</h3>
                <Button variant="link" size="sm" onClick={() => setSelectedUsers(users.map(u => u.id))}>All</Button>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {users.map(u => (
                  <div
                    key={u.id}
                    onClick={() => toggleUserSelection(u.id)}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${selectedUsers.includes(u.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'} group`}
                  >
                    <div className="w-4 h-4 rounded border flex items-center justify-center">
                      {selectedUsers.includes(u.id) && <div className="w-2 h-2 bg-blue-600 rounded-sm" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">@{u.leetcodeUsername}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSyncUser(u.id);
                      }}
                      title="Force Sync Stats"
                    >
                      <RefreshCw className="h-3 w-3 text-blue-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center">
                <Zap className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Automated Alerts</h3>
                <p className="text-gray-500 mb-6 font-medium">Reset baselines and trigger per-user notifications based on their selected daily grind time.</p>
                <Button onClick={triggerCronJob} disabled={isSending} variant="outline" className="w-full h-14 rounded-2xl border-2 font-bold">
                  {isSending ? <Loader2 className="animate-spin" /> : 'Force Run Cron Job'}
                </Button>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-blue-600" />
                  System Thresholds
                </h3>
                {globalSettings ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Max Emails / Day</Label>
                        <Input
                          type="number"
                          value={globalSettings.maxDailyEmails}
                          onChange={e => setGlobalSettings({ ...globalSettings, maxDailyEmails: parseInt(e.target.value) })}
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Max WhatsApp / Day</Label>
                        <Input
                          type="number"
                          value={globalSettings.maxDailyWhatsapp}
                          onChange={e => setGlobalSettings({ ...globalSettings, maxDailyWhatsapp: parseInt(e.target.value) })}
                          className="h-12 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex flex-col gap-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-sm font-bold">Automation Master Switch</p>
                          <p className="text-[10px] text-gray-400">Enable or disable all automated tasks</p>
                        </div>
                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-blue-600"
                          checked={globalSettings.automationEnabled}
                          onChange={e => setGlobalSettings({ ...globalSettings, automationEnabled: e.target.checked })}
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full h-12 rounded-xl font-bold bg-gray-900 hover:bg-black"
                      onClick={updateSettings}
                      disabled={isSettingsUpdating}
                    >
                      {isSettingsUpdating ? <Loader2 className="animate-spin" /> : "Save System Settings"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-center p-8">
                    <Loader2 className="animate-spin text-gray-300" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center">
                <Users className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">User Stats</h3>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-2xl font-black">{users.length}</p>
                    <p className="text-xs text-gray-400 uppercase font-bold">Total</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-2xl font-black">{users.filter(u => u.phoneNumber).length}</p>
                    <p className="text-xs text-gray-400 uppercase font-bold">WhatsApp</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl">
                <div className="flex gap-3 text-amber-800">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">Maintenance Mode</p>
                    <p className="text-xs font-medium opacity-80 mt-1">
                      System thresholds are checked by the cron job before sending any broadcast messages to prevent API abuse or excessive costs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
