import distributor from './distributor'
import { Issue } from './issue'
import Org from './org'
import { Project } from './project'
import wxuser from './wxuser'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  avatarUrl: string
  easiioId: string
  role: number
  createdAt: Date
  updatedAt: Date
  comments: Comment[]
  issues: Issue[]
  project: Project
  projectId: number
  userType: number
  organization: Org
  wxUser: wxuser
  distributor: distributor
  organizationId: number
}

export default User
