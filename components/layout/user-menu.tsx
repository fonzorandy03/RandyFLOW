'use client'

import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { LogOut, Settings, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useStudent } from '@/lib/hooks'
import { useToast } from '../common/toast'
import { useAuth } from '@/lib/auth'

export function UserMenu() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const { data: student } = useStudent()
  const router = useRouter()
  const toast = useToast()
  const { logout } = useAuth()
  const go = (href: string) => {
    setAnchor(null)
    router.push(href)
  }

  return (
    <>
      <IconButton
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label="Menu account"
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        size="small"
        className="ml-1 p-0.5"
      >
        <Avatar className="size-8 bg-primary/12 text-[13px] font-semibold text-primary">
          {student?.initials ?? '··'}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { className: 'mt-2 min-w-[240px]' } }}
      >
        <div className="px-3 pb-2.5 pt-2">
          <p className="text-sm font-medium">
            {student?.firstName} {student?.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{student?.email}</p>
        </div>
        <Divider className="my-1" />
        <MenuItem onClick={() => go('/profilo')}>
          <User className="size-4 text-muted-foreground" /> Profilo
        </MenuItem>
        <MenuItem onClick={() => go('/impostazioni')}>
          <Settings className="size-4 text-muted-foreground" /> Impostazioni
        </MenuItem>
        <Divider className="my-1" />
        <MenuItem
          onClick={() => {
            setAnchor(null)
            void logout().catch(() => toast('Non è stato possibile chiudere la sessione.', 'info'))
          }}
        >
          <LogOut className="size-4 text-muted-foreground" /> Esci
        </MenuItem>
      </Menu>
    </>
  )
}
