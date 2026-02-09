/**
 * Compliance Dashboard
 * 
 * PHASE 3: Comprehensive compliance reporting for SOC 2, GDPR, and HIPAA
 * 
 * RESEARCH BASIS:
 * - SOC 2 Trust Services Criteria (2024): Audit log requirements
 * - GDPR Article 30 (2023): Records of processing activities
 * - HIPAA §164.312 (2024): Audit controls requirements
 * - NIST Cybersecurity Framework (2024): Continuous monitoring effectiveness
 */

import React, { useState } from 'react';
import { useComplianceReport, exportAuditLogs } from '../../hooks/useAnalytics';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Shield, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Lock,
  FileText,
  Database,
  Users,
  Activity,
  Eye
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ComplianceDashboardProps {
  className?: string;
}

export function ComplianceDashboard({ className }: ComplianceDashboardProps) {
  const [selectedStandard, setSelectedStandard] = useState<'soc2' | 'gdpr' | 'hipaa'>('soc2');
  const [period, setPeriod] = useState('30d');
  const [isExporting, setIsExporting] = useState(false);

  const { report, loading, error, refetch } = useComplianceReport({
    standard: selectedStandard,
    period
  });

  const handleExportAuditLogs = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      await exportAuditLogs({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        format
      });

      toast.success(`Audit logs exported successfully as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to export audit logs');
      console.error('[COMPLIANCE] Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getComplianceStatusBadge = (status: string) => {
    if (status === 'compliant') {
      return (
        <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Compliant
        </Badge>
      );
    } else if (status === 'non-compliant') {
      return (
        <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
          <AlertCircle className="h-3 w-3 mr-1" />
          Non-Compliant
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
          <Activity className="h-3 w-3 mr-1" />
          Pending Review
        </Badge>
      );
    }
  };

  const renderSOC2Report = () => {
    if (!report?.details) return null;

    // Ensure we have a valid object and extract properties with defaults
    const details = report.details || {};
    const { 
      security = {
        permission_violations: 0,
        creator_overrides: 0,
        failed_logins: 0,
        unauthorized_access_attempts: 0
      }, 
      availability = {
        uptime_percentage: 0,
        incident_count: 0,
        total_requests: 0
      }, 
      integrity = {
        data_modifications: 0,
        unauthorized_modifications: 0
      }, 
      confidentiality = {
        sensitive_data_access: 0,
        encryption_status: 'N/A'
      }
    } = details;

    return (
      <div className="space-y-6">
        {/* Security */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-blue-400" />
              Security Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Permission Violations</p>
                <p className="text-2xl font-bold text-white">{security.permission_violations}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Creator Overrides</p>
                <p className="text-2xl font-bold text-white">{security.creator_overrides}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Failed Logins</p>
                <p className="text-2xl font-bold text-white">{security.failed_logins}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Access Attempts</p>
                <p className="text-2xl font-bold text-white">{security.unauthorized_access_attempts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-green-400" />
              Availability & Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Uptime Percentage</p>
                <p className="text-2xl font-bold text-green-400">{availability.uptime_percentage}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Incident Count</p>
                <p className="text-2xl font-bold text-white">{availability.incident_count}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-white">{availability.total_requests.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrity */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-purple-400" />
              Data Integrity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Data Modifications</p>
                <p className="text-2xl font-bold text-white">{integrity.data_modifications}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Unauthorized Mods</p>
                <p className="text-2xl font-bold text-white">{integrity.unauthorized_modifications}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confidentiality */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5 text-yellow-400" />
              Confidentiality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Sensitive Data Access</p>
                <p className="text-2xl font-bold text-white">{confidentiality.sensitive_data_access}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Encryption Status</p>
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                  {confidentiality.encryption_status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderGDPRReport = () => {
    if (!report?.details) return null;

    // Ensure we have a valid object and extract properties with defaults
    const details = report.details || {};
    const { 
      data_subject_requests = {
        access_requests: 0,
        deletion_requests: 0,
        rectification_requests: 0,
        average_response_time_hours: 0
      }, 
      data_processing_activities = [], 
      data_breaches = {
        total_breaches: 0,
        breaches_reported_72h: 0,
        affected_users: 0,
        compliance_rate: 0
      }, 
      consent_tracking = {
        total_users: 0,
        users_with_consent: 0,
        consent_rate: 0,
        pending_consent_updates: 0
      }
    } = details;

    return (
      <div className="space-y-6">
        {/* Data Subject Requests */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-400" />
              Data Subject Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Access Requests</p>
                <p className="text-2xl font-bold text-white">{data_subject_requests.access_requests}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Deletion Requests</p>
                <p className="text-2xl font-bold text-white">{data_subject_requests.deletion_requests}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Rectification Requests</p>
                <p className="text-2xl font-bold text-white">{data_subject_requests.rectification_requests}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Avg Response Time</p>
                <p className="text-2xl font-bold text-white">{data_subject_requests.average_response_time_hours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Processing Activities */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-green-400" />
              Processing Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data_processing_activities.map((activity: any, index: number) => (
                <div key={index} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h4 className="font-semibold text-white mb-2">{activity.activity}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Purpose:</span>
                      <span className="text-gray-200 ml-2">{activity.purpose}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Legal Basis:</span>
                      <span className="text-gray-200 ml-2">{activity.legal_basis}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Retention:</span>
                      <span className="text-gray-200 ml-2">{activity.retention_period}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Breaches */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-red-400" />
              Data Breaches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Total Breaches</p>
                <p className="text-2xl font-bold text-white">{data_breaches.total_breaches}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Reported Within 72h</p>
                <p className="text-2xl font-bold text-white">{data_breaches.breaches_reported_72h}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consent Tracking */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-purple-400" />
              Consent Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Users with Consent</p>
                <p className="text-2xl font-bold text-white">{consent_tracking.users_with_consent}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Withdrawal Requests</p>
                <p className="text-2xl font-bold text-white">{consent_tracking.pending_consent_updates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderHIPAAReport = () => {
    if (!report?.details) return null;

    // Ensure we have a valid object and extract properties with defaults
    const details = report.details || {};
    const { 
      access_controls = {
        unique_user_assignments: false,
        emergency_access_procedures: false,
        automatic_logoff: false,
        total_unique_users: 0
      }, 
      audit_controls = {
        activity_logs_enabled: false,
        log_retention_days: 0,
        unauthorized_access_attempts: 0,
        total_logged_events: 0
      }, 
      integrity_controls = {
        data_authentication: false,
        transmission_security: false
      }, 
      technical_safeguards = {
        encryption_at_rest: 'N/A',
        encryption_in_transit: 'N/A',
        access_logging: 'N/A'
      }
    } = details;

    return (
      <div className="space-y-6">
        {/* Access Controls */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-blue-400" />
              Access Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Unique User Assignments</p>
                {access_controls.unique_user_assignments ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Emergency Access</p>
                {access_controls.emergency_access_procedures ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Automatic Logoff</p>
                {access_controls.automatic_logoff ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Unique Users</p>
                <p className="text-2xl font-bold text-white">{access_controls.total_unique_users}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Controls */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-green-400" />
              Audit Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Activity Logs Enabled</p>
                {audit_controls.activity_logs_enabled ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-400">Log Retention</p>
                <p className="text-2xl font-bold text-white">{audit_controls.log_retention_days} days</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Unauthorized Access</p>
                <p className="text-2xl font-bold text-white">{audit_controls.unauthorized_access_attempts}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Logged Events</p>
                <p className="text-2xl font-bold text-white">{audit_controls.total_logged_events.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrity Controls */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-purple-400" />
              Integrity Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Data Authentication</p>
                {integrity_controls.data_authentication ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Transmission Security</p>
                {integrity_controls.transmission_security ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Safeguards */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-yellow-400" />
              Technical Safeguards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Encryption at Rest</p>
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                  {technical_safeguards.encryption_at_rest}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-400">Encryption in Transit</p>
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                  {technical_safeguards.encryption_in_transit}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-400">Access Logging</p>
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                  {technical_safeguards.access_logging}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading && !report) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Compliance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading compliance report...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Compliance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400">Error loading compliance report: {error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              Compliance Dashboard
            </CardTitle>
            <CardDescription>
              Automated compliance reporting for regulatory standards
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExportAuditLogs('csv')}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExportAuditLogs('json')}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {report && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-400 mb-1">Total Events</p>
                  <p className="text-3xl font-bold text-white">
                    {report.summary.total_events.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-400 mb-1">Security Violations</p>
                  <p className="text-3xl font-bold text-white">
                    {report.summary.security_violations}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-400 mb-1">Compliance Status</p>
                  <div className="mt-2">
                    {getComplianceStatusBadge(report.summary.compliance_status)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for different standards */}
            <Tabs value={selectedStandard} onValueChange={(v) => setSelectedStandard(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="soc2">SOC 2</TabsTrigger>
                <TabsTrigger value="gdpr">GDPR</TabsTrigger>
                <TabsTrigger value="hipaa">HIPAA</TabsTrigger>
              </TabsList>

              <TabsContent value="soc2" className="mt-6">
                {renderSOC2Report()}
              </TabsContent>

              <TabsContent value="gdpr" className="mt-6">
                {renderGDPRReport()}
              </TabsContent>

              <TabsContent value="hipaa" className="mt-6">
                {renderHIPAAReport()}
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              <p className="text-sm text-gray-400">
                Report Period: {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-400">
                Generated: {new Date(report.generated_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}