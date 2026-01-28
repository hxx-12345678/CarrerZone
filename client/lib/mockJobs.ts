export interface Job {
  id: number
  title: string
  company: {
    name: string
    id?: string
  }
  location: string
  experience: string
  salary: string
  skills: string[]
  logo: string
  posted: string
  applicants: number
  description: string
  type: string
  remote: boolean
  urgent: boolean
  featured: boolean
  companyRating: number
  category: string
}

export const mockJobs: Job[] = [
  {
    id: 1,
    title: "Senior Full Stack Developer",
    company: { name: "TechCorp Solutions" },
    location: "Bangalore",
    experience: "4-7 years",
    salary: "15-25 LPA",
    skills: ["React", "Node.js", "Python", "AWS"],
    logo: "/placeholder.svg?height=40&width=40",
    posted: "2 days ago",
    applicants: 45,
    description: "We are looking for a skilled Full Stack Developer to join our dynamic team...",
    type: "Full-time",
    remote: true,
    urgent: false,
    featured: true,
    companyRating: 4.2,
    category: "software",
  },
  {
    id: 2,
    title: "Product Manager - Growth",
    company: { name: "InnovateTech" },
    location: "Mumbai",
    experience: "5-8 years",
    salary: "20-35 LPA",
    skills: ["Product Strategy", "Analytics", "Leadership", "Growth Hacking"],
    logo: "/placeholder.svg?height=40&width=40",
    posted: "1 day ago",
    applicants: 32,
    description: "Drive product growth and user acquisition strategies...",
    type: "Full-time",
    remote: false,
    urgent: true,
    featured: false,
    companyRating: 4.5,
    category: "product",
  },
  {
    id: 3,
    title: "Data Scientist - ML",
    company: { name: "DataDriven Inc" },
    location: "Hyderabad",
    experience: "3-6 years",
    salary: "12-22 LPA",
    skills: ["Python", "Machine Learning", "SQL", "TensorFlow"],
    logo: "/placeholder.svg?height=40&width=40",
    posted: "3 days ago",
    applicants: 28,
    description: "Build and deploy machine learning models at scale...",
    type: "Full-time",
    remote: true,
    urgent: false,
    featured: false,
    companyRating: 4.1,
    category: "data",
  },
  {
    id: 4,
    title: "Frontend Developer",
    company: { name: "WebSolutions Ltd" },
    location: "Pune",
    experience: "2-4 years",
    salary: "8-15 LPA",
    skills: ["React", "TypeScript", "CSS", "Next.js"],
    logo: "/placeholder.svg?height=40&width=40",
    posted: "1 day ago",
    applicants: 38,
    description: "Create beautiful and responsive user interfaces...",
    type: "Full-time",
    remote: false,
    urgent: false,
    featured: true,
    companyRating: 4.3,
    category: "software",
  },
  {
    id: 5,
    title: "UX Designer",
    company: { name: "DesignStudio" },
    location: "Delhi",
    experience: "3-5 years",
    salary: "10-18 LPA",
    skills: ["Figma", "Adobe XD", "User Research", "Prototyping"],
    logo: "/placeholder.svg?height=40&width=40",
    posted: "2 days ago",
    applicants: 25,
    description: "Design intuitive and engaging user experiences...",
    type: "Full-time",
    remote: true,
    urgent: false,
    featured: false,
    companyRating: 4.0,
    category: "design",
  },
  {
    id: 6,
    title: "DevOps Engineer",
    company: { name: "CloudTech" },
    location: "Bangalore",
    experience: "4-6 years",
    salary: "18-28 LPA",
    skills: ["Docker", "Kubernetes", "AWS", "Jenkins"],
    logo: "/placeholder.svg?height=40&width=40",
    posted: "1 day ago",
    applicants: 22,
    description: "Build and maintain scalable infrastructure...",
    type: "Full-time",
    remote: false,
    urgent: true,
    featured: false,
    companyRating: 4.4,
    category: "devops",
  },
  {
    id: 7,
    title: "Sales Manager",
    company: { name: "SalesForce Inc" },
    location: "Mumbai",
    experience: "5-8 years",
    salary: "15-25 LPA",
    skills: ["Sales Strategy", "CRM", "Leadership", "Client Relations"],
    logo: "/placeholder.svg?height=40&width=40",
    posted: "3 days ago",
    applicants: 35,
    description: "Lead sales team and drive revenue growth...",
    type: "Full-time",
    remote: false,
    urgent: false,
    featured: true,
    companyRating: 4.2,
    category: "sales",
  },
  {
    id: 8,
    title: "Marketing Specialist",
    company: { name: "Digital Marketing Pro" },
    location: "Gurgaon",
    experience: "2-4 years",
    salary: "6-12 LPA",
    skills: ["Digital Marketing", "SEO", "Social Media", "Analytics"],
    logo: "/placeholder.svg?height=40&width=40",
    posted: "2 days ago",
    applicants: 42,
    description: "Execute digital marketing campaigns...",
    type: "Full-time",
    remote: true,
    urgent: false,
    featured: false,
    companyRating: 3.9,
    category: "marketing",
  },
]

export const getJobById = (id: string | number): Job | undefined => {
  return mockJobs.find(job => job.id.toString() === id.toString())
}
