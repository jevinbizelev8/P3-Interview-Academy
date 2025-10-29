
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Copy, Check, Gift, Mail, Share2, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Referral() {
  const [referralCode, setReferralCode] = useState("");
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: myReferrals = [] } = useQuery({
    queryKey: ['myReferrals'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return await base44.entities.Referral.filter({ referrer_email: currentUser.email });
    }
  });

  // Generate or get referral code
  React.useEffect(() => {
    if (user) {
      const code = `P3IA-${user.email.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      setReferralCode(code);
    }
  }, [user]);

  const sendInviteMutation = useMutation({
    mutationFn: async (recipientEmail) => {
      const referral = await base44.entities.Referral.create({
        referrer_email: user.email,
        referee_email: recipientEmail,
        referral_code: referralCode,
        status: "pending"
      });

      // Send email invitation
      await base44.integrations.Core.SendEmail({
        from_name: user.full_name || "P³ Interview Academy",
        to: recipientEmail,
        subject: `${user.full_name || 'Your friend'} invited you to P³ Interview Academy!`,
        body: `Hi there!\n\n${user.full_name || 'Your friend'} thinks you'd benefit from P³ Interview Academy - the AI-powered platform to ace your interviews.\n\nUse referral code: ${referralCode} to get 30 bonus credits when you sign up!\n\nSign up now: ${window.location.origin}/signup?ref=${referralCode}\n\nBest regards,\nP³ Interview Academy Team`
      });

      return referral;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myReferrals']);
      setEmail("");
      alert("Invitation sent successfully!");
    }
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = (e) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      sendInviteMutation.mutate(email);
    }
  };

  const totalReferred = myReferrals.length;
  const successfulReferrals = myReferrals.filter(r => r.status === 'signed_up' || r.status === 'converted').length;
  const pendingReferrals = myReferrals.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Refer a Friend
            </span>
          </h1>
          <p className="text-xl text-gray-600">Share P³ Interview Academy and earn rewards!</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-1">{totalReferred}</p>
              <p className="text-sm text-gray-600">Total Referrals</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600 mb-1">{successfulReferrals}</p>
              <p className="text-sm text-gray-600">Successful</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-yellow-600 mb-1">{successfulReferrals * 30}</p>
              <p className="text-sm text-gray-600">Credits Earned</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-xl mb-8 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-6 h-6 text-purple-600" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-white border-purple-200">
              <AlertDescription>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                    <div>
                      <p className="font-semibold text-purple-900">Share your unique code</p>
                      <p className="text-sm text-gray-600">Send your referral code to friends via email or social media</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                    <div>
                      <p className="font-semibold text-purple-900">Your friend gets 30 credits</p>
                      <p className="text-sm text-gray-600">Your friend receives 30 bonus credits when they sign up</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                    <div>
                      <p className="font-semibold text-purple-900">You get 30 credits too!</p>
                      <p className="text-sm text-gray-600">You receive 30 credits as soon as they sign up successfully</p>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>Your Referral Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-600 mb-2">Your Code:</p>
                <p className="text-3xl font-bold text-purple-900 mb-4">{referralCode}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    className="flex-1"
                  >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied!" : "Copy Code"}
                  </Button>
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="flex-1"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">Or share via social media:</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out P³ Interview Academy! Use my code ${referralCode} for 30 bonus credits&url=${window.location.origin}/signup?ref=${referralCode}`, '_blank')}
                    className="flex-1"
                  >
                    𝕏 Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${window.location.origin}/signup?ref=${referralCode}`, '_blank')}
                    className="flex-1"
                  >
                    LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://wa.me/?text=Check out P³ Interview Academy! Use my code ${referralCode} for 30 bonus credits ${window.location.origin}/signup?ref=${referralCode}`, '_blank')}
                    className="flex-1"
                  >
                    WhatsApp
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-600" />
                Send Email Invitation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="friend@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                  disabled={sendInviteMutation.isPending}
                >
                  {sendInviteMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </form>

              <div className="mt-6">
                <h4 className="font-semibold mb-3">Referral History</h4>
                {myReferrals.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {myReferrals.map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{referral.referee_email || "Pending"}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(referral.created_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          className={
                            referral.status === 'converted' ? 'bg-green-100 text-green-800' :
                            referral.status === 'signed_up' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {referral.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6">
                    No referrals yet. Start inviting friends!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
