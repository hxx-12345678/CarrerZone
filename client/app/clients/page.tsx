"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, Star } from "lucide-react"

export default function ClientsPage() {
  const clients = [
    {
      name: "TechCorp Solutions",
      industry: "Technology",
      employees: "500-1000",
      rating: 4.8,
      description: "Leading technology company specializing in software development and digital transformation."
    },
    {
      name: "Global Finance Inc",
      industry: "Finance",
      employees: "1000+",
      rating: 4.9,
      description: "International financial services company with offices worldwide."
    },
    {
      name: "HealthCare Plus",
      industry: "Healthcare",
      employees: "200-500",
      rating: 4.7,
      description: "Healthcare provider focused on patient care and medical innovation."
    },
    {
      name: "EduTech Academy",
      industry: "Education",
      employees: "100-200",
      rating: 4.6,
      description: "Educational technology company revolutionizing online learning."
    },
    {
      name: "GreenEnergy Corp",
      industry: "Energy",
      employees: "500-1000",
      rating: 4.8,
      description: "Sustainable energy solutions provider committed to environmental responsibility."
    },
    {
      name: "RetailMax",
      industry: "Retail",
      employees: "1000+",
      rating: 4.5,
      description: "Major retail chain with stores across multiple countries."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Our Clients</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're proud to work with leading companies across various industries. 
            Discover how we've helped them find the right talent and grow their teams.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {clients.map((client, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-8 w-8 text-blue-600" />
                    <div>
                      <CardTitle className="text-xl">{client.name}</CardTitle>
                      <Badge variant="secondary">{client.industry}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{client.rating}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{client.employees} employees</span>
                </div>
                <p className="text-gray-600 text-sm">{client.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-lg bg-blue-600 text-white">
          <CardContent className="pt-8 pb-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Join Our Client Network</h2>
            <p className="text-xl mb-6 opacity-90">
              Become part of our growing network of successful companies.
            </p>
            <div className="space-x-4">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Post Jobs
              </button>
              <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                Learn More
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
