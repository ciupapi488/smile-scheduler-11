import { useEffect, useState } from 'react';
import { Mail, Edit, Eye, Save, X, Send, RefreshCw, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { API_URL } from '@/api';

interface EmailTemplate {
  id: string;
  template_key: string;
  subject: string;
  html_body: string;
  is_active: boolean;
}

interface SchedulerStatus {
  isRunning: boolean;
  sms: {
    enabled: boolean;
    message: string;
  };
}

const templateLabels: Record<string, string> = {
  'booking_confirmation': 'Confirmare Programare',
  'booking_reminder_24h': 'Reminder 24h',
  'booking_reminder_1h': 'Reminder 1h',
  'booking_cancellation': 'Anulare Programare',
  'booking_reschedule': 'Reprogramare',
  'review_request': 'Cerere Recenzie'
};

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load templates
      const templatesRes = await fetch(`${API_URL}/api/admin/notifications/templates`);
      const templatesData = await templatesRes.json();
      setTemplates(templatesData);

      // Load scheduler status
      const statusRes = await fetch(`${API_URL}/api/admin/notifications/scheduler-status`);
      const statusData = await statusRes.json();
      setSchedulerStatus(statusData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    if (!editingTemplate) return;

    setSaving(true);
    try {
      const response = await fetch(
        `${API_URL}/api/admin/notifications/templates/${editingTemplate.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: editingTemplate.subject,
            html_body: editingTemplate.html_body,
            is_active: editingTemplate.is_active
          })
        }
      );

      if (response.ok) {
        setMessage({ type: 'success', text: 'Template salvat cu succes!' });
        setEditingTemplate(null);
        loadData();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Eroare la salvare' });
    }
    setSaving(false);
  };

  const handleSendTest = async (type: string) => {
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Introduceți o adresă de email' });
      return;
    }

    setSendingTest(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/notifications/send-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, to: testEmail })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Email de test trimis!' });
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Eroare la trimitere' });
    }
    setSendingTest(false);
  };

  const toggleScheduler = async (start: boolean) => {
    try {
      await fetch(`${API_URL}/api/admin/notifications/toggle-scheduler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start })
      });
      loadData();
    } catch (error) {
      console.error('Error toggling scheduler:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificări & Email</h1>
          <p className="text-muted-foreground">
            Gestionați template-urile de email și notificările
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reîmprospătează
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scheduler Status</p>
                <h3 className="text-lg font-semibold mt-1">
                  {schedulerStatus?.isRunning ? (
                    <span className="text-green-600 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                      Activ
                    </span>
                  ) : (
                    <span className="text-red-600">Oprit</span>
                  )}
                </h3>
              </div>
              <Button
                variant={schedulerStatus?.isRunning ? 'destructive' : 'default'}
                size="sm"
                onClick={() => toggleScheduler(!schedulerStatus?.isRunning)}
              >
                {schedulerStatus?.isRunning ? 'Oprește' : 'Pornește'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SMS (Twilio)</p>
                <h3 className="text-lg font-semibold mt-1">
                  {schedulerStatus?.sms?.enabled ? (
                    <span className="text-green-600 flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Activ
                    </span>
                  ) : (
                    <span className="text-gray-500 flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Inactiv
                    </span>
                  )}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground max-w-[150px]">
                {schedulerStatus?.sms?.message}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Test Email</p>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="email@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => handleSendTest('confirmation')}
                  disabled={sendingTest}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>Template-uri Email</CardTitle>
          <CardDescription>
            Personalizați email-urile trimise pacienților
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {templateLabels[template.template_key] || template.template_key}
                      </h4>
                      <p className="text-sm text-muted-foreground">{template.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Activ' : 'Inactiv'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTemplate({ ...template })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editare Template</DialogTitle>
          </DialogHeader>
          
          {editingTemplate && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>Tip Template</Label>
                <p className="text-sm text-muted-foreground">
                  {templateLabels[editingTemplate.template_key]}
                </p>
              </div>

              <div>
                <Label htmlFor="subject">Subiect</Label>
                <Input
                  id="subject"
                  value={editingTemplate.subject}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, subject: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="body">Conținut HTML</Label>
                <Textarea
                  id="body"
                  value={editingTemplate.html_body}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, html_body: e.target.value })
                  }
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={editingTemplate.is_active}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, is_active: e.target.checked })
                  }
                />
                <Label htmlFor="active">Template activ</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Anulează
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Se salvează...' : 'Salvează'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Previzualizare: {previewTemplate?.subject}</DialogTitle>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="mt-4">
              <div
                className="border rounded-lg p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: previewTemplate.html_body }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
