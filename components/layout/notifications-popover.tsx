'use client'

import Badge from '@mui/material/Badge'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Tooltip from '@mui/material/Tooltip'
import { Bell, BellOff, CalendarClock, Sparkles, Target } from 'lucide-react'
import { useState } from 'react'
import { notificationsApi, settingsApi } from '@/lib/api/services'
import useSWR from 'swr'
import { useNotifications } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import type { AppNotification } from '@/lib/types'

const KIND_ICON: Record<AppNotification['kind'], React.ComponentType<{ className?: string }>> = {
  plan: CalendarClock,
  reminder: Bell,
  mastery: Target,
  system: Sparkles,
}

export function NotificationsPopover() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const { data, mutate } = useNotifications()
  const { data: settings } = useSWR('settings', settingsApi.get)
  const unread = settings?.notifications === false ? 0 : (data?.filter((n) => !n.read).length ?? 0)

  const markAll = async () => {
    await mutate(
      async () => {
        await notificationsApi.markAllRead()
        return data?.map((n) => ({ ...n, read: true }))
      },
      { optimisticData: data?.map((n) => ({ ...n, read: true })), revalidate: false },
    )
  }

  return (
    <>
      <Tooltip title="Notifiche">
        <IconButton
          size="small"
          className="size-9"
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label={unread ? `Notifiche, ${unread} non lette` : 'Notifiche'}
        >
          <Badge
            variant="dot"
            color="primary"
            invisible={!unread}
            overlap="circular"
            slotProps={{ badge: { className: 'ring-2 ring-background' } }}
          >
            <Bell className="size-[18px]" />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { className: 'mt-2 w-[360px] max-w-[calc(100vw-24px)]' } }}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Notifiche</h2>
          {unread > 0 && (
            <Button size="small" onClick={markAll} className="-mr-2 text-xs">
              Segna tutte come lette
            </Button>
          )}
        </div>
        {data && data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-muted-foreground">
            <BellOff className="size-5" aria-hidden />
            Nessuna notifica per ora.
          </div>
        ) : (
          <ul className="max-h-[420px] overflow-y-auto p-1.5 scrollbar-thin">
            {data?.map((n) => {
              const Icon = KIND_ICON[n.kind]
              return (
                <li key={n.id} className="flex gap-3 rounded-lg px-2.5 py-3 transition-colors hover:bg-muted">
                  <div
                    className={cn(
                      'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground',
                      !n.read && 'bg-primary/10 text-primary',
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{n.time}</span>
                    </div>
                    <p className="mt-0.5 text-pretty text-[13px] leading-5 text-muted-foreground">{n.body}</p>
                  </div>
                  {!n.read && (
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-label="Non letta" />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Popover>
    </>
  )
}
