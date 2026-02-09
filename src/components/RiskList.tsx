import { AlertTriangle, Shield, AlertCircle, AlertOctagon, Edit, CheckCircle2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { motion } from 'motion/react';

interface Risk {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'mitigating' | 'resolved';
  owner: string;
  mitigationPlan: string;
  createdAt: string;
  updatedAt: string;
}

interface RiskListProps {
  risks: Risk[];
  onEditRisk?: (risk: Risk) => void;
  onResolveRisk?: (riskId: string) => void;
}

export function RiskList({ risks, onEditRisk, onResolveRisk }: RiskListProps) {
  const severityConfig = {
    low: { icon: AlertCircle, color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500' },
    medium: { icon: AlertTriangle, color: 'text-amber-400', bgColor: 'bg-amber-500/20', borderColor: 'border-amber-500' },
    high: { icon: AlertOctagon, color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500' },
    critical: { icon: Shield, color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500' },
  };

  const statusConfig = {
    active: { label: 'Active', color: 'text-red-400 bg-red-500/20 border-red-500' },
    mitigating: { label: 'Mitigating', color: 'text-amber-400 bg-amber-500/20 border-amber-500' },
    resolved: { label: 'Resolved', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500' },
  };

  if (risks.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-400">No risks tracked</p>
        <p className="text-xs text-gray-500 mt-1">Add risks to monitor potential blockers</p>
      </div>
    );
  }

  // Sort risks: active first, then by severity
  const sortedRisks = [...risks].sort((a, b) => {
    if (a.status === 'resolved' && b.status !== 'resolved') return 1;
    if (a.status !== 'resolved' && b.status === 'resolved') return -1;
    
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return (
    <div className="space-y-3">
      {sortedRisks.map((risk, index) => {
        const severityStyle = severityConfig[risk.severity];
        const statusStyle = statusConfig[risk.status];
        const SeverityIcon = severityStyle.icon;

        return (
          <motion.div
            key={risk.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-lg border ${
              risk.status === 'resolved' 
                ? 'border-gray-700 bg-gray-800/50 opacity-75' 
                : `${severityStyle.borderColor} ${severityStyle.bgColor}`
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <SeverityIcon className={`w-5 h-5 ${severityStyle.color} mt-0.5 flex-shrink-0`} />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-white mb-1">{risk.title}</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className={`text-xs capitalize ${severityStyle.color} ${severityStyle.borderColor}`}
                    >
                      {risk.severity}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${statusStyle.color}`}
                    >
                      {risk.status === 'resolved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {statusStyle.label}
                    </Badge>
                    {risk.owner && (
                      <span className="text-xs text-gray-400">Owner: {risk.owner}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {risk.status !== 'resolved' && onEditRisk && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEditRisk(risk)}
                  className="ml-2"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-400 mb-3 pl-8">{risk.description}</p>

            {/* Mitigation Plan */}
            {risk.mitigationPlan && (
              <div className="pl-8 mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Mitigation Plan:</p>
                <p className="text-xs text-gray-400">{risk.mitigationPlan}</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pl-8 pt-3 border-t border-gray-700">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Created {risk.createdAt}</span>
                <span>Updated {risk.updatedAt}</span>
              </div>
              
              {risk.status !== 'resolved' && onResolveRisk && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onResolveRisk(risk.id)}
                  className="text-xs border-emerald-500 text-emerald-400 hover:bg-emerald-500/20"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Mark Resolved
                </Button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
