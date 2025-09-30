import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Folder, ChevronDown, Plus, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'
import { useState } from 'react'

export function ProjectSwitcher() {
  const navigate = useNavigate()
  const { isFlagEnabled } = useFeatureFlags()
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)

  const shareScriptEnabled = isFlagEnabled('sharescript_core')

  const { data: projectsData } = useQuery({
    queryKey: ['user-projects'],
    queryFn: async () => {
      const response = await api.get('/projects')
      return response.data
    },
    enabled: shareScriptEnabled
  })

  const projects = projectsData?.data?.projects || []
  const currentProject = projects.find((p: any) => p.id === currentProjectId)

  if (!shareScriptEnabled) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-64">
          <Folder className="w-4 h-4 mr-2" />
          {currentProject ? currentProject.name : 'Select Project'}
          <ChevronDown className="w-4 h-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Your Projects</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {projects.length === 0 ? (
          <div className="px-2 py-8 text-center text-sm text-muted-foreground">
            No projects yet
          </div>
        ) : (
          projects.map((project: any) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => {
                setCurrentProjectId(project.id)
                navigate(`/projects/${project.id}`)
              }}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <span>{project.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {project.memberCount}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {project.myRole}
                  </Badge>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate('/projects/new')}
          className="cursor-pointer text-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
