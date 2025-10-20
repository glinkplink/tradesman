import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    businessEmail: "",
    phoneNumber: "",
    businessAddress: "",
    taxId: "",
    defaultHourlyRate: "",
    paymentProcessor: "manual" as "stripe" | "square" | "paypal" | "manual",
    paymentTerms: "due_on_receipt",
    defaultInvoiceFooter: "Thank you for your business!",
  });

  const createProfileMutation = trpc.businessProfile.create.useMutation({
    onSuccess: () => {
      toast.success("Business profile created successfully!");
      setLocation("/success");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create business profile");
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file (PNG or JPG)");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setLogoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.businessName || !formData.contactName || !formData.businessEmail || !formData.phoneNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.businessEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setUploading(true);

    try {
      let logoUrl = undefined;
      let logoKey = undefined;

      // Upload logo if provided
      if (logoFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", logoFile);

        const uploadResponse = await fetch("/api/upload-logo", {
          method: "POST",
          body: formDataUpload,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload logo");
        }

        const uploadResult = await uploadResponse.json();
        logoUrl = uploadResult.url;
        logoKey = uploadResult.key;
      }

      // Create business profile
      await createProfileMutation.mutateAsync({
        ...formData,
        defaultHourlyRate: formData.defaultHourlyRate ? parseInt(formData.defaultHourlyRate) * 100 : undefined,
        logoUrl,
        logoKey,
      });
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("An error occurred during onboarding");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">Welcome to SMS Invoice</CardTitle>
            <CardDescription className="text-lg mt-2">
              Set up your business profile to start creating quotes and invoices via SMS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Business Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    placeholder="ABC Plumbing Services"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => handleInputChange("contactName", e.target.value)}
                    placeholder="John Smith"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Business Email *</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => handleInputChange("businessEmail", e.target.value)}
                    placeholder="john@abcplumbing.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Textarea
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) => handleInputChange("businessAddress", e.target.value)}
                    placeholder="123 Main St, City, State, ZIP"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / EIN (Optional)</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange("taxId", e.target.value)}
                    placeholder="12-3456789"
                  />
                </div>
              </div>

              {/* Pricing & Payment Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Pricing & Payment</h3>

                <div className="space-y-2">
                  <Label htmlFor="defaultHourlyRate">Default Hourly Rate (Optional)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="defaultHourlyRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.defaultHourlyRate}
                      onChange={(e) => handleInputChange("defaultHourlyRate", e.target.value)}
                      placeholder="75.00"
                      className="pl-7"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentProcessor">Preferred Payment Processor</Label>
                  <Select
                    value={formData.paymentProcessor}
                    onValueChange={(value) => handleInputChange("paymentProcessor", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Payment (Bank Transfer, Cash, Check)</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select
                    value={formData.paymentTerms}
                    onValueChange={(value) => handleInputChange("paymentTerms", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                      <SelectItem value="net_7">Net 7 Days</SelectItem>
                      <SelectItem value="net_15">Net 15 Days</SelectItem>
                      <SelectItem value="net_30">Net 30 Days</SelectItem>
                      <SelectItem value="net_60">Net 60 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Branding Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Branding</h3>

                <div className="space-y-2">
                  <Label htmlFor="logo">Business Logo (Optional)</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoChange}
                  />
                  <p className="text-sm text-gray-500">PNG or JPG, max 5MB. Will appear on invoices and quotes.</p>
                  {logoFile && (
                    <p className="text-sm text-green-600">✓ {logoFile.name} selected</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultInvoiceFooter">Default Invoice Footer</Label>
                  <Textarea
                    id="defaultInvoiceFooter"
                    value={formData.defaultInvoiceFooter}
                    onChange={(e) => handleInputChange("defaultInvoiceFooter", e.target.value)}
                    placeholder="Thank you for your business!"
                    rows={3}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={uploading || createProfileMutation.isPending}
              >
                {(uploading || createProfileMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Complete Setup
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

