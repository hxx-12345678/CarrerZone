"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Privacy Policy</h1>
          
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="prose max-w-none">
                <p className="text-sm text-gray-500 mb-8">Last updated: January 25, 2025</p>
                
                <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                <p className="text-gray-600 mb-4">We collect information you provide directly to us, such as when you:</p>
                <ul className="list-disc pl-6 text-gray-600 mb-6">
                  <li>Create an account</li>
                  <li>Fill out a profile</li>
                  <li>Apply for jobs</li>
                  <li>Post job listings</li>
                  <li>Contact us for support</li>
                </ul>

                <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                <p className="text-gray-600 mb-4">We use the information we collect to:</p>
                <ul className="list-disc pl-6 text-gray-600 mb-6">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Communicate with you about products, services, and events</li>
                </ul>

                <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
                <p className="text-gray-600 mb-6">
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share your information in the following circumstances:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-6">
                  <li>With your consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and safety</li>
                  <li>In connection with a business transaction</li>
                </ul>

                <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
                <p className="text-gray-600 mb-6">
                  We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
                </p>

                <h2 className="text-2xl font-semibold mb-4">5. Cookies and Tracking</h2>
                <p className="text-gray-600 mb-6">
                  We use cookies and similar tracking technologies to collect and use personal information about you. You can control cookies through your browser settings, but disabling cookies may affect the functionality of our service.
                </p>

                <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
                <p className="text-gray-600 mb-4">You have the right to:</p>
                <ul className="list-disc pl-6 text-gray-600 mb-6">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your personal information</li>
                  <li>Object to processing of your information</li>
                  <li>Data portability</li>
                </ul>

                <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
                <p className="text-gray-600 mb-6">
                  We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy, unless a longer retention period is required by law.
                </p>

                <h2 className="text-2xl font-semibold mb-4">8. International Transfers</h2>
                <p className="text-gray-600 mb-6">
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this policy.
                </p>

                <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
                <p className="text-gray-600 mb-6">
                  Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
                </p>

                <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
                <p className="text-gray-600 mb-6">
                  We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
                </p>

                <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
                <p className="text-gray-600">
                  If you have any questions about this privacy policy, please contact us at privacy@jobportal.com
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
