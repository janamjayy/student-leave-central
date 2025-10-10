import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Shield, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { policyService, LeavePolicy } from "@/services/policyService";
import { toast } from "sonner";

const PolicyManagement = () => {
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
  
  const [newPolicy, setNewPolicy] = useState({
    policy_name: '',
    policy_type: 'quota' as 'quota' | 'date_restriction' | 'approval_workflow',
    policy_rules: {},
    is_active: true
  });

  const fetchPolicies = async () => {
    setLoading(true);
    const data = await policyService.getAllPolicies();
    setPolicies(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleCreatePolicy = async () => {
    if (!newPolicy.policy_name) {
      toast.error("Policy name is required");
      return;
    }

    const result = await policyService.createPolicy(newPolicy);
    if (result.success) {
      toast.success("Policy created successfully");
      setDialogOpen(false);
      fetchPolicies();
      resetForm();
    } else {
      toast.error(result.error || "Failed to create policy");
    }
  };

  const handleTogglePolicy = async (id: string, isActive: boolean) => {
    const result = await policyService.togglePolicy(id, isActive);
    if (result.success) {
      toast.success(`Policy ${isActive ? 'activated' : 'deactivated'}`);
      fetchPolicies();
    } else {
      toast.error(result.error || "Failed to update policy");
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm("Are you sure you want to delete this policy?")) return;
    
    const result = await policyService.deletePolicy(id);
    if (result.success) {
      toast.success("Policy deleted successfully");
      fetchPolicies();
    } else {
      toast.error(result.error || "Failed to delete policy");
    }
  };

  const resetForm = () => {
    setNewPolicy({
      policy_name: '',
      policy_type: 'quota',
      policy_rules: {},
      is_active: true
    });
    setEditingPolicy(null);
  };

  const renderPolicyRulesInput = () => {
    switch (newPolicy.policy_type) {
      case 'quota':
        return (
          <div>
            <Label htmlFor="maxLeaves">Maximum Leaves Per Year</Label>
            <Input
              id="maxLeaves"
              type="number"
              value={(newPolicy.policy_rules as any).max_leaves || ''}
              onChange={(e) => setNewPolicy({
                ...newPolicy,
                policy_rules: { max_leaves: parseInt(e.target.value) }
              })}
            />
          </div>
        );
      case 'date_restriction':
        return (
          <div>
            <Label htmlFor="minDays">Minimum Days in Advance</Label>
            <Input
              id="minDays"
              type="number"
              value={(newPolicy.policy_rules as any).min_days_advance || ''}
              onChange={(e) => setNewPolicy({
                ...newPolicy,
                policy_rules: { min_days_advance: parseInt(e.target.value) }
              })}
            />
          </div>
        );
      case 'approval_workflow':
        return (
          <div>
            <Label htmlFor="requiredApprovers">Required Approvers</Label>
            <Input
              id="requiredApprovers"
              type="number"
              value={(newPolicy.policy_rules as any).required_approvers || ''}
              onChange={(e) => setNewPolicy({
                ...newPolicy,
                policy_rules: { required_approvers: parseInt(e.target.value) }
              })}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Leave Policy Management
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Policy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Leave Policy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="policyName">Policy Name</Label>
                <Input
                  id="policyName"
                  value={newPolicy.policy_name}
                  onChange={(e) => setNewPolicy({ ...newPolicy, policy_name: e.target.value })}
                  placeholder="e.g., Annual Leave Quota"
                />
              </div>
              
              <div>
                <Label htmlFor="policyType">Policy Type</Label>
                <Select
                  value={newPolicy.policy_type}
                  onValueChange={(value: any) => setNewPolicy({ ...newPolicy, policy_type: value, policy_rules: {} })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quota">Leave Quota</SelectItem>
                    <SelectItem value="date_restriction">Date Restriction</SelectItem>
                    <SelectItem value="approval_workflow">Approval Workflow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderPolicyRulesInput()}

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={newPolicy.is_active}
                  onCheckedChange={(checked) => setNewPolicy({ ...newPolicy, is_active: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <Button onClick={handleCreatePolicy} className="w-full">
                Create Policy
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {policies.map((policy) => (
          <Card key={policy.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                {policy.policy_name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Switch
                  checked={policy.is_active}
                  onCheckedChange={(checked) => handleTogglePolicy(policy.id, checked)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeletePolicy(policy.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p className="text-muted-foreground">
                  Type: <span className="font-medium text-foreground">{policy.policy_type}</span>
                </p>
                <p className="text-muted-foreground">
                  Rules: <span className="font-medium text-foreground">{JSON.stringify(policy.policy_rules)}</span>
                </p>
                <p className="text-muted-foreground">
                  Status: <span className={`font-medium ${policy.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {policy.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {policies.length === 0 && (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              No policies configured. Click "Add Policy" to create one.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PolicyManagement;
