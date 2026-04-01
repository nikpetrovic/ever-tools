export const IPC = {
  EMAILS_LIST:      'emails:list',
  EMAILS_GET:       'emails:get',
  EMAILS_DELETE:    'emails:delete',
  EMAILS_CLEAR:     'emails:clear',
  EMAILS_MARK_READ: 'emails:markRead',
  SETTINGS_GET:     'settings:get',
  SETTINGS_SET:     'settings:set',
  SMTP_STATUS:      'smtp:status',
  NEW_EMAIL:        'emails:new',
  SMTP_RESTART:     'smtp:restart',
  TRAY_BADGE:       'tray:badge',
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
